import type { PoolConnection } from 'mysql2/promise';
import { getDbPool } from '../db/mysql.js';

// File des commandes du serveur Minecraft. Le site ne se connecte jamais au serveur : le plugin ValoriaCore
// tire ses commandes toutes les quelques secondes (POST /api/server/poll) et accuse leur exécution.
// Chaque étape est écrite dans server_command_events : en cas de panne, on sait où en est chaque livraison.
// Plusieurs réplicas du backend peuvent répondre : une commande est réservée ligne par ligne (FOR UPDATE).

const LEASE_SECONDS = 120;
const MAX_ATTEMPTS = 20;
const MC_NAME = /^[a-zA-Z0-9_]{2,16}$/;
const MC_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export type OnlinePlayer = { uuid: string; name: string };
export type Ack = { id: number; ok: boolean; error?: string; executedAt?: string };
export type QueuedCommand = { id: number; command: string; uuid: string | null; name: string | null; requireOnline: boolean; message?: string };

export function isMcName(value: unknown): value is string {
  return typeof value === 'string' && MC_NAME.test(value);
}

export function isMcUuid(value: unknown): value is string {
  return typeof value === 'string' && MC_UUID.test(value);
}

export async function logCommandEvent(db: PoolConnection | Awaited<ReturnType<typeof getDbPool>>, commandId: number,
                                      event: string, detail?: string) {
  await db.execute('INSERT INTO server_command_events (command_id, event, detail) VALUES (?, ?, ?)',
    [commandId, event, detail ? detail.slice(0, 1000) : null]);
}

/**
 * Met une commande en file. {uuid} et {joueur} sont remplacés au moment de l'exécution par le plugin
 * (le pseudo peut changer entre l'achat et la livraison). À appeler dans la transaction de l'achat.
 */
export async function enqueueCommand(conn: PoolConnection, input: {
  command: string;
  uuid: string | null;
  name: string | null;
  requireOnline: boolean;
  source: string;
  sourceId: string | null;
}): Promise<number> {
  if (input.uuid !== null && !isMcUuid(input.uuid)) throw new Error('uuid Minecraft invalide');
  if (input.name !== null && !isMcName(input.name)) throw new Error('pseudo Minecraft invalide');
  if (input.requireOnline && !input.uuid) throw new Error('une commande « en ligne » demande un uuid');
  const [result] = await conn.execute(
    `INSERT INTO server_commands (mc_uuid, mc_username, command_text, require_online, source, source_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.uuid, input.name, input.command, input.requireOnline ? 1 : 0, input.source, input.sourceId]
  );
  const id = Number((result as any).insertId);
  await logCommandEvent(conn, id, 'cree', `${input.source}${input.sourceId ? ' ' + input.sourceId : ''} : ${input.command}`);
  return id;
}

/** Accusés du plugin : exécutée (done) ou en échec (remise en file jusqu'à MAX_ATTEMPTS, puis failed). */
export async function applyAcks(acks: Ack[]): Promise<number> {
  if (acks.length === 0) return 0;
  const db = await getDbPool();
  let applied = 0;
  for (const ack of acks) {
    if (!Number.isInteger(ack.id) || ack.id <= 0) continue;
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.execute('SELECT id, status, attempts FROM server_commands WHERE id = ? FOR UPDATE', [ack.id]);
      const row = Array.isArray(rows) ? (rows[0] as any) : null;
      if (!row) {
        await conn.rollback();
        continue;
      }
      if (row.status === 'done' || row.status === 'cancelled') {
        // Accusé en double (le plugin le renvoie tant qu'il n'a pas eu de réponse) : on le note, sans rien changer
        await logCommandEvent(conn, ack.id, 'accuse-double', ack.ok ? 'ok' : ack.error);
      } else if (ack.ok) {
        await conn.execute(`UPDATE server_commands SET status = 'done', done_at = CURRENT_TIMESTAMP(3), lease_until = NULL,
                            last_error = NULL WHERE id = ?`, [ack.id]);
        await logCommandEvent(conn, ack.id, 'executee', ack.executedAt ? `exécutée en jeu à ${ack.executedAt}` : undefined);
      } else {
        const failed = Number(row.attempts) >= MAX_ATTEMPTS;
        await conn.execute(`UPDATE server_commands SET status = ?, lease_until = NULL, last_error = ? WHERE id = ?`,
          [failed ? 'failed' : 'pending', (ack.error || 'erreur inconnue').slice(0, 1000), ack.id]);
        await logCommandEvent(conn, ack.id, failed ? 'abandonnee' : 'echec', ack.error);
      }
      await conn.commit();
      applied++;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
  return applied;
}

/**
 * Commandes à exécuter maintenant : celles qui n'exigent pas le joueur, et celles des joueurs connectés.
 * Une commande déjà envoyée dont l'accusé n'est pas revenu à temps est redonnée (reprise notée dans l'historique).
 */
export async function claimCommands(online: OnlinePlayer[], limit = 50): Promise<QueuedCommand[]> {
  const db = await getDbPool();
  const uuids = online.map((p) => p.uuid).filter(isMcUuid);
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const playerFilter = uuids.length > 0 ? `OR mc_uuid IN (${uuids.map(() => '?').join(',')})` : '';
    const [rows] = await conn.execute(
      `SELECT sc.id, sc.mc_uuid, sc.mc_username, sc.command_text, sc.require_online, sc.status, pp.product_name
       FROM server_commands sc LEFT JOIN product_purchases pp ON pp.server_command_id = sc.id
       WHERE (sc.status = 'pending' OR (sc.status = 'sent' AND sc.lease_until < CURRENT_TIMESTAMP(3)))
         AND (sc.require_online = 0 ${playerFilter.replace('mc_uuid', 'sc.mc_uuid')})
       ORDER BY sc.id LIMIT ${Number(limit)} FOR UPDATE SKIP LOCKED`,
      uuids
    );
    const list = Array.isArray(rows) ? (rows as any[]) : [];
    for (const row of list) {
      await conn.execute(
        `UPDATE server_commands SET status = 'sent', attempts = attempts + 1, sent_at = CURRENT_TIMESTAMP(3),
         lease_until = CURRENT_TIMESTAMP(3) + INTERVAL ${LEASE_SECONDS} SECOND WHERE id = ?`,
        [row.id]
      );
      await logCommandEvent(conn, Number(row.id), row.status === 'sent' ? 'renvoyee' : 'envoyee',
        row.status === 'sent' ? `pas d'accusé en ${LEASE_SECONDS} s, redonnée au serveur` : undefined);
    }
    await conn.commit();
    return list.map((row) => ({
      id: Number(row.id),
      command: String(row.command_text),
      uuid: row.mc_uuid ? String(row.mc_uuid) : null,
      name: row.mc_username ? String(row.mc_username) : null,
      requireOnline: Boolean(row.require_online),
      // Message affiché au joueur à la livraison d'un achat
      ...(row.product_name ? { message: `Valoria • Ton achat est livré : ${row.product_name}. Merci !` } : {}),
    }));
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function recordHeartbeat(onlinePlayers: number, pluginVersion: string | null, delivered: number, acked: number) {
  const db = await getDbPool();
  await db.execute(
    'INSERT INTO server_heartbeats (online_players, plugin_version, delivered, acked) VALUES (?, ?, ?, ?)',
    [onlinePlayers, pluginVersion ? pluginVersion.slice(0, 40) : null, delivered, acked]
  );
}
