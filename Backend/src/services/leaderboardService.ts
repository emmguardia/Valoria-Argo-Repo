import { z } from 'zod';
import type { RowDataPacket } from 'mysql2/promise';
import { getDbPool } from '../db/mysql.js';

// Classements de la page Classement (factions, kills, métiers), envoyés par le plugin du serveur avec son tirage,
// au plus une fois par heure. On garde le dernier envoi tel quel.

const name = z.string().min(1).max(32);

export const rankingsSchema = z.object({
  factions: z.array(z.object({
    name, score: z.number().int(), members: z.number().int().min(0), power: z.number().int(),
  })).max(10),
  kills: z.array(z.object({
    name, kills: z.number().int().min(0), deaths: z.number().int().min(0),
  })).max(10),
  metiers: z.array(z.object({
    name, total: z.number().int().min(0), jobs: z.array(z.string().max(32)).max(5),
  })).max(10),
});

export type Rankings = z.infer<typeof rankingsSchema>;

export async function saveRankings(rankings: Rankings) {
  const db = await getDbPool();
  await db.execute(
    'INSERT INTO leaderboards (id, data) VALUES (1, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)',
    [JSON.stringify(rankings)]
  );
}

export async function readRankings(): Promise<(Rankings & { updatedAt: string }) | null> {
  const db = await getDbPool();
  const [rows] = await db.execute<RowDataPacket[]>('SELECT data, updated_at FROM leaderboards WHERE id = 1');
  const row = rows[0];
  if (!row) return null;
  const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
  return { ...data, updatedAt: new Date(row.updated_at).toISOString() };
}
