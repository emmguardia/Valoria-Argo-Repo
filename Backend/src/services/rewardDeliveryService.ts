import { getDbPool } from '../db/mysql.js';
import { withRcon } from './rconService.js';

const INVENTORY_MAX_SLOTS = 36;
const SCORE_CHECK_ID = '%check%';
const MAX_DAILY_CLAIMS = 3;
const CLAIM_COOLDOWN_MS = 10_000;

function sanitizeMcUsername(value: string) {
  return value.trim();
}

function sanitizeRewardId(value: string) {
  return value.trim();
}

function buildRewardCommand(mcUsername: string, rewardId: string) {
  if (!/^[a-zA-Z0-9_]{2,32}$/.test(mcUsername)) {
    throw new Error('mc_username invalide');
  }
  if (!/^[a-zA-Z0-9_.-]{2,128}$/.test(rewardId)) {
    throw new Error('reward_id invalide');
  }
  // Placeholder : à remplacer par une table de mapping reward_id → commande quand on ajoutera des items réels.
  return `give ${mcUsername} diamond 10`;
}

function logSale(entry: Record<string, unknown>) {
  try {
    console.log(JSON.stringify({ ...entry, ts: new Date().toISOString() }));
  } catch {
    // jamais throw — un échec de log ne doit pas corrompre le statut du job
  }
}

function stripMcFormatting(s: string) {
  return s.replace(/\x1b\[[0-9;]*m/g, '').replace(/§[0-9a-fk-or]/gi, '');
}

function parseOnlinePlayers(listOutput: string): string[] {
  const normalized = stripMcFormatting(listOutput).trim();
  const colonIndex = normalized.lastIndexOf(':');
  if (colonIndex < 0) return [];
  const playersPart = normalized.slice(colonIndex + 1).trim();
  if (!playersPart) return [];
  return playersPart.split(',').map((p) => p.trim()).filter(Boolean);
}

function parseScoreFromOutput(output: string): number {
  const match = output.match(/(-?\d+)/);
  if (!match) throw new Error(`Scoreboard invalide: ${output}`);
  return Number(match[1]);
}

export class PlayerOfflineError extends Error {
  constructor(user: string) { super(`player_offline:${user}`); }
}
export class InventoryFullError extends Error {
  constructor(user: string, slots: number) { super(`inventory_full:${user}:${slots}/${INVENTORY_MAX_SLOTS}`); }
}

async function ensurePlayerCanReceiveReward(
  send: (command: string) => Promise<string>,
  mcUsername: string
) {
  const listOutput = await send('minecraft:list');
  const players = parseOnlinePlayers(listOutput);
  if (!players.includes(mcUsername)) {
    throw new PlayerOfflineError(mcUsername);
  }

  try {
    await send('scoreboard objectives add boutique dummy');
  } catch {
    // L'objectif existe déjà, on continue.
  }

  await send(
    `execute store result score ${SCORE_CHECK_ID} boutique run data get entity ${mcUsername} Inventory`
  );
  const scoreOutput = await send(`scoreboard players get ${SCORE_CHECK_ID} boutique`);
  const occupiedSlots = parseScoreFromOutput(scoreOutput);
  if (occupiedSlots >= INVENTORY_MAX_SLOTS) {
    throw new InventoryFullError(mcUsername, occupiedSlots);
  }
}

export async function enqueueRewardDeliveryJob(input: {
  stripeSessionId: string;
  userId: string;
  mcUsername: string;
  rewardId: string;
}) {
  const db = await getDbPool();
  const mcUsername = sanitizeMcUsername(input.mcUsername);
  const rewardId = sanitizeRewardId(input.rewardId);
  const command = buildRewardCommand(mcUsername, rewardId);
  await db.execute(
    `INSERT INTO reward_delivery_jobs
      (stripe_session_id, user_id, mc_username, reward_id, command_text, status, attempts, next_attempt_at, requires_manual_claim)
     VALUES (?, ?, ?, ?, ?, 'pending_claim', 0, NOW(), 1)
     ON DUPLICATE KEY UPDATE updated_at = NOW()`,
    [input.stripeSessionId, input.userId, mcUsername, rewardId, command]
  );
}

export async function listPendingRewardsForUser(userId: string) {
  const db = await getDbPool();
  const [rows] = await db.execute(
    `SELECT id, reward_id, mc_username, daily_attempts, daily_attempts_reset_at, last_error, created_at, updated_at
     FROM reward_delivery_jobs
     WHERE user_id = ? AND status = 'pending_claim'
     ORDER BY created_at DESC`,
    [userId]
  );
  if (!Array.isArray(rows)) return [];
  return (rows as any[]).map((r) => {
    const dailyAttempts = Number(r.daily_attempts ?? 0);
    const resetAt = r.daily_attempts_reset_at ? new Date(r.daily_attempts_reset_at) : null;
    const now = new Date();
    const windowExpired = !resetAt || resetAt <= now;
    const effectiveAttempts = windowExpired ? 0 : dailyAttempts;
    return {
      id: Number(r.id),
      rewardId: String(r.reward_id),
      mcUsername: String(r.mc_username),
      attemptsRemaining: Math.max(0, MAX_DAILY_CLAIMS - effectiveAttempts),
      resetAt: windowExpired ? null : resetAt,
      lastError: r.last_error,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });
}

type ClaimResult =
  | { ok: true; status: 'delivered' }
  | { ok: false; reason: 'player_offline' | 'inventory_full' | 'error'; message: string; attemptsRemaining: number };

export async function claimReward(userId: string, jobId: number): Promise<ClaimResult> {
  const db = await getDbPool();
  const conn = await db.getConnection();

  let job: any;
  let newDailyAttempts = 0;

  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute(
      `SELECT id, stripe_session_id, user_id, mc_username, reward_id, command_text, status,
              daily_attempts, daily_attempts_reset_at, updated_at
       FROM reward_delivery_jobs
       WHERE id = ? FOR UPDATE`,
      [jobId]
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      await conn.rollback();
      throw new Error('job_not_found');
    }
    job = rows[0];
    if (String(job.user_id) !== String(userId)) {
      await conn.rollback();
      throw new Error('forbidden');
    }
    if (job.status !== 'pending_claim') {
      await conn.rollback();
      throw new Error(`invalid_status:${job.status}`);
    }

    const now = new Date();
    const resetAt = job.daily_attempts_reset_at ? new Date(job.daily_attempts_reset_at) : null;
    const windowExpired = !resetAt || resetAt <= now;
    const currentAttempts = windowExpired ? 0 : Number(job.daily_attempts ?? 0);

    if (currentAttempts >= MAX_DAILY_CLAIMS) {
      await conn.rollback();
      throw new Error('daily_limit_reached');
    }

    // Cooldown 10s anti-spam entre claims sur le même job.
    const lastUpdate = job.updated_at ? new Date(job.updated_at) : null;
    if (lastUpdate && now.getTime() - lastUpdate.getTime() < CLAIM_COOLDOWN_MS) {
      await conn.rollback();
      throw new Error('cooldown');
    }

    newDailyAttempts = currentAttempts + 1;
    const newResetAt = windowExpired
      ? new Date(now.getTime() + 24 * 60 * 60 * 1000)
      : resetAt!;

    await conn.execute(
      `UPDATE reward_delivery_jobs
       SET daily_attempts = ?, daily_attempts_reset_at = ?, updated_at = NOW()
       WHERE id = ?`,
      [newDailyAttempts, newResetAt, jobId]
    );
    await conn.commit();
  } catch (error) {
    try { await conn.rollback(); } catch {}
    throw error;
  } finally {
    conn.release();
  }

  const mcUsername = String(job.mc_username);
  const rewardId = String(job.reward_id);
  const command = buildRewardCommand(mcUsername, rewardId);
  const attemptsRemaining = MAX_DAILY_CLAIMS - newDailyAttempts;

  try {
    const response = await withRcon(async (send) => {
      await ensurePlayerCanReceiveReward(send, mcUsername);
      return send(command);
    });
    await db.execute(
      `UPDATE reward_delivery_jobs
       SET status = 'completed', delivered_at = NOW(), last_error = NULL, updated_at = NOW()
       WHERE id = ?`,
      [jobId]
    );
    logSale({
      type: 'reward_delivered',
      stripeSessionId: String(job.stripe_session_id),
      userId,
      mcUsername,
      rewardId,
      rconResponse: response,
    });
    console.log(`[claim] job=${jobId} user=${mcUsername} reward=${rewardId} → delivered`);
    return { ok: true, status: 'delivered' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    let reason: 'player_offline' | 'inventory_full' | 'error' = 'error';
    if (error instanceof PlayerOfflineError) reason = 'player_offline';
    else if (error instanceof InventoryFullError) reason = 'inventory_full';

    await db.execute(
      `UPDATE reward_delivery_jobs SET last_error = ?, updated_at = NOW() WHERE id = ?`,
      [errorMessage, jobId]
    );
    console.log(`[claim] job=${jobId} user=${mcUsername} → ${reason} (${attemptsRemaining} tentatives restantes)`);
    return { ok: false, reason, message: errorMessage, attemptsRemaining };
  }
}
