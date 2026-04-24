import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { voteCallbackLimiter, voteReadLimiter } from '../middleware/rateLimitMiddleware.js';
import {
  isKnownSite,
  listSites,
  validateVoteCallback,
} from '../services/voteSiteAdapters.js';
import {
  getMonthlyLeaderboard,
  getUserMonthlyVoteStats,
  recordVoteAndReward,
} from '../services/voteService.js';

export const voteRouter = Router();

// Liste publique des sites de vote (avec URL externe pour voter).
voteRouter.get('/sites', voteReadLimiter, (_req, res) => {
  res.json({ sites: listSites() });
});

// Leaderboard mensuel — public, top 100.
voteRouter.get('/leaderboard/monthly', voteReadLimiter, async (_req, res) => {
  try {
    const items = await getMonthlyLeaderboard(100);
    return res.json({ items });
  } catch (error) {
    console.error('[votes/leaderboard] error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Stats perso du mois courant — nécessite auth.
voteRouter.get('/me/stats', voteReadLimiter, authenticateToken, async (req, res) => {
  const user = (req as any).user as { pseudo?: string } | undefined;
  if (!user?.pseudo) return res.status(400).json({ error: 'Pseudo manquant sur le token' });
  try {
    const stats = await getUserMonthlyVoteStats(user.pseudo);
    return res.json(stats);
  } catch (error) {
    console.error('[votes/me/stats] error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Callback appelé par le site de vote quand un joueur vote.
// On accepte GET et POST pour matcher les conventions différentes.
const handleCallback = async (req: any, res: any) => {
  const siteParam = String(req.params.site || '');
  if (!isKnownSite(siteParam)) {
    return res.status(404).json({ error: 'Site inconnu' });
  }
  const payload: Record<string, any> = {
    ...(typeof req.query === 'object' ? req.query : {}),
    ...(typeof req.body === 'object' && req.body ? req.body : {}),
  };
  const ip = (req.ip || req.socket?.remoteAddress || null) as string | null;

  try {
    const validation = await validateVoteCallback(siteParam, { payload, ip: ip || '' });
    if (!validation.ok || !validation.mcUsername) {
      console.log(`[votes/callback] site=${siteParam} rejected: ${validation.reason ?? 'unknown'} (ip=${ip})`);
      return res.status(400).json({ error: 'Vote non validé', reason: validation.reason });
    }

    const result = await recordVoteAndReward({
      siteName: siteParam,
      mcUsername: validation.mcUsername,
      ip,
      rawPayload: payload,
    });

    if (!result.inserted && result.reason === 'already_voted_today') {
      return res.status(200).json({ ok: true, duplicate: true });
    }
    return res.status(200).json({ ok: true, rconOk: result.rconOk, reason: result.reason });
  } catch (error) {
    console.error(`[votes/callback] site=${siteParam} error:`, error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

voteRouter.post('/callback/:site', voteCallbackLimiter, handleCallback);
voteRouter.get('/callback/:site', voteCallbackLimiter, handleCallback);
