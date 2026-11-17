import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

type JwtPayload = {
  userId: string;
  pseudo?: string;
  email?: string;
  role?: 'user' | 'admin';
  iat?: number;
  exp?: number;
};

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  if (!env.JWT_PUBLIC_KEY) {
    return res.status(500).json({ error: 'JWT_PUBLIC_KEY non configurée' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_PUBLIC_KEY, { algorithms: ['RS256'] }) as JwtPayload;
    (req as any).user = decoded;
    return next();
  } catch {
    return res.status(403).json({ error: 'Token invalide' });
  }
}

// Comme authenticateToken, mais laisse passer sans compte (req.user reste vide si le token est absent ou invalide)
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (token && env.JWT_PUBLIC_KEY) {
    try {
      (req as any).user = jwt.verify(token, env.JWT_PUBLIC_KEY, { algorithms: ['RS256'] }) as JwtPayload;
    } catch {
      // token expiré ou invalide : on continue comme un visiteur
    }
  }
  return next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user?.userId) {
    return res.status(401).json({ error: 'Token invalide' });
  }
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  return next();
}
