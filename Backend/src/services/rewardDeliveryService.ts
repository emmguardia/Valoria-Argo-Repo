import fs from 'node:fs/promises';
import { env } from '../config/env.js';
import { getDbPool } from '../db/mysql.js';
import { sendRconCommand } from './rconService.js';

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

async function appendSalesLog(entry: Record<string, unknown>) {
  const line = JSON.stringify({ ...entry, ts: new Date().toISOString() }) + '\n';
  await fs.appendFile(env.SALES_LOG_PATH, line, 'utf8');
}

function parseOnlinePlayers(listOutput: string): string[] {
  const normalized = listOutput.trim();
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

async function ensurePlayerCanReceiveReward(mcUsername: string) {
  const listOutput = await sendRconCommand('minecraft:list');
  const players = parseOnlinePlayers(listOutput);
  if (!players.includes(mcUsername)) {
    throw new Error(`Joueur hors ligne: ${mcUsername}`);
  }

  try {
    await sendRconCommand('scoreboard objectives add boutique dummy');
  } catch {
    // L'objectif existe déjà, on continue.
  }

  await sendRconCommand(
    `execute store result score ${SCORE_CHECK_ID} boutique run data get entity ${mcUsername} Inventory`
  );
  const scoreOutput = await sendRconCommand(`scoreboard players get ${SCORE_CHECK_ID} boutique`);
  const occupiedSlots = parseScoreFromOutput(scoreOutput);
  if (occupiedSlots >= INVENTORY_MAX_SLOTS) {
    throw new Error(`Inventaire plein pour ${mcUsername} (${occupiedSlots}/${INVENTORY_MAX_SLOTS})`);
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
      await ensurePlayerCanReceiveReward(mcUsername);
      const response = await sendRconCommand(command);
      await db.execute(
        `UPDATE reward_delivery_jobs
         SET status = 'completed', delivered_at = NOW(), last_error = NULL, updated_at = NOW()
         WHERE id = ?`,
        [id]
      );
      await appendSalesLog({
        type: 'reward_delivered',
        stripeSessionId: String(raw.stripe_session_id),
        userId: String(raw.user_id),
        mcUsername,
        rewardId: String(raw.reward_id),
        rconResponse: response,
      });
    } catch (error) {
      const nextAttempts = attempts + 1;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isAuthFailure = /authentication failed/i.test(errorMessage);
      const nextAt = new Date(Date.now() + (isAuthFailure ? 10 * 60 * 1000 : RETRY_DELAY_MS));
      const status = isAuthFailure || nextAttempts >= MAX_ATTEMPTS ? 'dead' : 'failed';
      console.error(`[reward-worker] job ${id} failed (attempt ${nextAttempts}):`, error);
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
