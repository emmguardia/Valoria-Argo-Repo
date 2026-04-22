import { getDbPool } from '../db/mysql.js';
import { withRcon } from './rconService.js';

const TICK_INTERVAL_MS = 60_000;
const OFFLINE_RETRY_MS = 60 * 60 * 1000;
const OBJECTIVE_NAME = 'valoria_ecus';

function sanitizeMcUsername(value: string) {
  const v = value.trim();
  if (!/^[a-zA-Z0-9_]{2,32}$/.test(v)) throw new Error('mc_username invalide');
  return v;
}

async function ensureObjectiveExists(send: (cmd: string) => Promise<string>) {
  try {
    await send(`scoreboard objectives add ${OBJECTIVE_NAME} dummy "Écus"`);
  } catch {
    // Existe déjà, on continue.
  }
}

export async function enqueueEcusSync(userId: string, mcUsername: string) {
  const db = await getDbPool();
  const safeName = sanitizeMcUsername(mcUsername);
  await db.execute(
    `INSERT INTO ecus_sync_jobs (user_id, mc_username, status, next_attempt_at)
     VALUES (?, ?, 'pending', NOW())`,
    [userId, safeName]
  );
}

export async function processPendingEcusSyncJobs(limit = 20) {
  const db = await getDbPool();
  const [rows] = await db.execute(
    `SELECT id, user_id, mc_username, attempts
     FROM ecus_sync_jobs
     WHERE status IN ('pending', 'failed') AND next_attempt_at <= NOW()
     ORDER BY next_attempt_at ASC
     LIMIT ?`,
    [limit]
  );

  if (!Array.isArray(rows) || rows.length === 0) return;

  for (const raw of rows as any[]) {
    const id = Number(raw.id);
    const userId = String(raw.user_id);
    const mcUsername = String(raw.mc_username);
    const attempts = Number(raw.attempts ?? 0);

    await db.execute(`UPDATE ecus_sync_jobs SET status = 'processing' WHERE id = ?`, [id]);

    try {
      const [userRows] = await db.execute('SELECT ecus FROM users WHERE id = ? LIMIT 1', [userId]);
      if (!Array.isArray(userRows) || userRows.length === 0) {
        throw new Error(`user_not_found:${userId}`);
      }
      const currentEcus = Number((userRows[0] as any).ecus ?? 0);

      await withRcon(async (send) => {
        await ensureObjectiveExists(send);
        await send(`scoreboard players set ${mcUsername} ${OBJECTIVE_NAME} ${currentEcus}`);
      });

      await db.execute(
        `UPDATE ecus_sync_jobs
         SET status = 'completed', synced_at = NOW(), last_synced_value = ?, last_error = NULL, updated_at = NOW()
         WHERE id = ?`,
        [currentEcus, id]
      );
      console.log(`[ecus-sync] user=${mcUsername} → ${currentEcus} écus synced`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const nextAttempts = attempts + 1;
      const nextAt = new Date(Date.now() + OFFLINE_RETRY_MS);
      await db.execute(
        `UPDATE ecus_sync_jobs
         SET status = 'failed', attempts = ?, last_error = ?, next_attempt_at = ?, updated_at = NOW()
         WHERE id = ?`,
        [nextAttempts, errorMessage, nextAt, id]
      );
      console.log(`[ecus-sync] user=${mcUsername} → failed: ${errorMessage} (retry 1h)`);
    }
  }
}

export function startEcusSyncWorker() {
  void processPendingEcusSyncJobs().catch((error) => {
    console.error('[ecus-sync] initial run failed:', error);
  });

  setInterval(() => {
    void processPendingEcusSyncJobs().catch((error) => {
      console.error('[ecus-sync] periodic run failed:', error);
    });
  }, TICK_INTERVAL_MS);
}
