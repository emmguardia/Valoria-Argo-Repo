import { getDbPool } from '../db/mysql.js';
import { withRcon } from './rconService.js';

const RETRY_DELAY_MS = 30_000;
const MAX_ATTEMPTS = 1000;
const INVENTORY_MAX_SLOTS = 36;
const SCORE_CHECK_ID = '%check%';

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

class PlayerOfflineError extends Error {
  constructor(user: string) { super(`player_offline:${user}`); }
}
class InventoryFullError extends Error {
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
      (stripe_session_id, user_id, mc_username, reward_id, command_text, status, attempts, next_attempt_at)
     VALUES (?, ?, ?, ?, ?, 'pending', 0, NOW())
     ON DUPLICATE KEY UPDATE updated_at = NOW()`,
    [input.stripeSessionId, input.userId, mcUsername, rewardId, command]
  );
}

export async function processPendingRewardJobs(limit = 20) {
  const db = await getDbPool();
  const [rows] = await db.execute(
    `SELECT id, stripe_session_id, user_id, mc_username, reward_id, command_text, attempts
     FROM reward_delivery_jobs
     WHERE status IN ('pending', 'failed') AND next_attempt_at <= NOW()
     ORDER BY next_attempt_at ASC
     LIMIT ?`,
    [limit]
  );

  if (!Array.isArray(rows) || rows.length === 0) return;

  for (const raw of rows as any[]) {
    const id = Number(raw.id);
    const attempts = Number(raw.attempts ?? 0);
    const mcUsername = String(raw.mc_username ?? '');
    const rewardId = String(raw.reward_id ?? '');
    const command = buildRewardCommand(mcUsername, rewardId);
    await db.execute(`UPDATE reward_delivery_jobs SET status = 'processing' WHERE id = ?`, [id]);
    try {
      const response = await withRcon(async (send) => {
        await ensurePlayerCanReceiveReward(send, mcUsername);
        return send(command);
      });
      await db.execute(
        `UPDATE reward_delivery_jobs
         SET status = 'completed', delivered_at = NOW(), last_error = NULL, updated_at = NOW()
         WHERE id = ?`,
        [id]
      );
      console.log(`[worker] job=${id} user=${mcUsername} reward=${rewardId} → delivered`);
      logSale({
        type: 'reward_delivered',
        stripeSessionId: String(raw.stripe_session_id),
        userId: String(raw.user_id),
        mcUsername,
        rewardId,
        rconResponse: response,
      });
    } catch (error) {
      const nextAttempts = attempts + 1;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isAuthFailure = /authentication failed/i.test(errorMessage);
      const isOffline = error instanceof PlayerOfflineError;
      const isInvFull = error instanceof InventoryFullError;
      const retryMs = isAuthFailure ? 10 * 60 * 1000 : RETRY_DELAY_MS;
      const nextAt = new Date(Date.now() + retryMs);
      const status = isAuthFailure || nextAttempts >= MAX_ATTEMPTS ? 'dead' : 'failed';

      if (isOffline) {
        console.log(`[worker] job=${id} user=${mcUsername} → offline (retry ${retryMs / 1000}s)`);
      } else if (isInvFull) {
        console.log(`[worker] job=${id} user=${mcUsername} → inventory_full (retry ${retryMs / 1000}s)`);
      } else if (status === 'dead') {
        console.error(`[worker] job=${id} user=${mcUsername} → dead: ${errorMessage}`);
      } else {
        console.error(`[worker] job=${id} user=${mcUsername} → error: ${errorMessage} (retry ${retryMs / 1000}s)`);
      }

      await db.execute(
        `UPDATE reward_delivery_jobs
         SET status = ?, attempts = ?, last_error = ?, next_attempt_at = ?, updated_at = NOW()
         WHERE id = ?`,
        [status, nextAttempts, errorMessage, nextAt, id]
      );
    }
  }
}

export function startRewardDeliveryWorker() {
  void processPendingRewardJobs().catch((error) => {
    console.error('[reward-worker] initial run failed:', error);
  });

  setInterval(() => {
    void processPendingRewardJobs().catch((error) => {
      console.error('[reward-worker] periodic run failed:', error);
    });
  }, 15_000);
}
