import { limiter } from '../utils/http.js';

export const authWriteLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { error: 'Trop de requêtes, réessaie plus tard.' },
});

export const authReadLimiter = limiter({
  windowMs: 60 * 1000,
  limit: 120,
  message: { error: 'Trop de requêtes, réessaie plus tard.' },
});

export const paymentsLimiter = limiter({
  windowMs: 5 * 60 * 1000,
  limit: 60,
  message: { error: 'Trop de requêtes sur le service paiement.' },
});

// Stripe appelle depuis ses propres IP : la limite est large
export const webhookLimiter = limiter({
  windowMs: 60 * 1000,
  limit: 240,
  message: { error: 'Trop de webhooks reçus.' },
});

// Chaque vérification interroge l'API d'un site de vote : on reste raisonnable par IP
export const voteCheckLimiter = limiter({
  windowMs: 60 * 1000,
  limit: 20,
  message: { error: 'Trop de vérifications de votes, réessaie dans une minute.' },
});

export const voteReadLimiter = limiter({
  windowMs: 60 * 1000,
  limit: 180,
  message: { error: 'Trop de requêtes.' },
});
