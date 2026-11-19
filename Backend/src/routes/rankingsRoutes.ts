import { Router } from 'express';
import { readRankings } from '../services/leaderboardService.js';
import { voteReadLimiter } from '../middleware/rateLimitMiddleware.js';

// Classements publics de la page Classement : dernier envoi du serveur (une fois par heure).
export const rankingsRouter = Router();

rankingsRouter.get('/', voteReadLimiter, async (_req, res) => {
  try {
    const rankings = await readRankings();
    res.set('Cache-Control', 'public, max-age=300');
    return res.json(rankings ?? { factions: [], kills: [], metiers: [], updatedAt: null });
  } catch (error) {
    console.error('[classements] error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});
