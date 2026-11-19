import type { Request, Response, NextFunction } from 'express';
import type { RowDataPacket } from 'mysql2/promise';
import { getDbPool } from '../db/mysql.js';
import { verifyToken } from '../services/jwt.js';

/** Compte de la requête, relu en base à chaque appel : un ban, un retrait du rôle admin ou un nouveau pseudo comptent tout de suite. */
export type AuthUser = { userId: string; pseudo: string; email: string; role: 'user' | 'admin'; linked: boolean };

type Loaded = { user: AuthUser } | { banned: true } | null;

async function loadUser(req: Request): Promise<Loaded> {
  const userId = verifyToken(req.headers.authorization?.split(' ')[1]);
  if (!userId) return null;
  const db = await getDbPool();
  const [rows] = await db.execute<RowDataPacket[]>(
    'SELECT id, pseudo, email, role, mc_uuid, banned_at FROM users WHERE id = ? LIMIT 1', [userId]);
  const row = rows[0];
  if (!row) return null;
  if (row.banned_at) return { banned: true };
  return {
    user: {
      userId: String(row.id), pseudo: String(row.pseudo), email: String(row.email),
      role: row.role === 'admin' ? 'admin' : 'user', linked: Boolean(row.mc_uuid),
    },
  };
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  if (!req.headers.authorization) return res.status(401).json({ error: 'Token manquant' });
  try {
    const loaded = await loadUser(req);
    if (!loaded) return res.status(401).json({ error: 'Token invalide' });
    if ('banned' in loaded) return res.status(403).json({ error: 'Compte suspendu' });
    req.user = loaded.user;
    return next();
  } catch (error) {
    console.error('[auth] lecture du compte impossible:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

// Comme authenticateToken, mais laisse passer sans compte (req.user reste vide si le jeton est absent, invalide ou banni)
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const loaded = req.headers.authorization ? await loadUser(req) : null;
    if (loaded && 'user' in loaded) req.user = loaded.user;
  } catch (error) {
    console.error('[auth] lecture du compte impossible:', error);
  }
  return next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Token invalide' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  return next();
}
