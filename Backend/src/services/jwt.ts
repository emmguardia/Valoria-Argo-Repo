import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Jetons de session du site (RS256). L'émetteur (JWT_ISSUER) est posé à la signature et exigé à la vérification.

export type TokenClaims = { userId: string; pseudo: string; email: string; role: 'user' | 'admin' };

const issuer = () => env.JWT_ISSUER?.trim() || undefined;

export function jwtConfigured(): boolean {
  return Boolean(env.JWT_PRIVATE_KEY && env.JWT_PUBLIC_KEY);
}

export function signToken(claims: TokenClaims, expiresIn: '1d' | '7d' | '30d'): string {
  if (!env.JWT_PRIVATE_KEY) throw new Error('JWT_PRIVATE_KEY non configurée');
  return jwt.sign(claims, env.JWT_PRIVATE_KEY, { algorithm: 'RS256', expiresIn, ...(issuer() ? { issuer: issuer() } : {}) });
}

/** Identifiant du compte porté par le jeton, ou null si le jeton est absent, expiré, mal signé ou d'un autre émetteur. */
export function verifyToken(token: string | undefined): string | null {
  if (!token || !env.JWT_PUBLIC_KEY) return null;
  try {
    const payload = jwt.verify(token, env.JWT_PUBLIC_KEY, { algorithms: ['RS256'], ...(issuer() ? { issuer: issuer() } : {}) });
    const userId = typeof payload === 'object' ? payload.userId : null;
    return typeof userId === 'string' || typeof userId === 'number' ? String(userId) : null;
  } catch {
    return null;
  }
}
