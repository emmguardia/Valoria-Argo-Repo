import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

type JwtPayload = {
  userId: string;
  pseudo?: string;
  email?: string;
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

