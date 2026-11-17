import { Router } from 'express';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';
import { voteCheckLimiter, voteReadLimiter } from '../middleware/rateLimitMiddleware.js';
import {
  IP_CHECKED_SITES,
  checkVote,
  isKnownSite,
  listSites,
} from '../services/voteSiteAdapters.js';
import {
  getMonthlyLeaderboard,
  getUserMonthlyVoteStats,
  ipVotedToday,
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

// « J'ai voté » : le joueur demande la vérification d'un site, le backend interroge l'API du site
// (par pseudo ou par IP) puis compte le vote et met la récompense en file. Connecté, le pseudo est celui
// du compte ; sinon le joueur le saisit (la récompense va de toute façon au pseudo qui a voté).
voteRouter.post('/check/:site', voteCheckLimiter, optionalAuth, async (req, res) => {
  const site = String(req.params.site || '');
  if (!isKnownSite(site)) {
    return res.status(404).json({ error: 'Site inconnu' });
  }
  const user = (req as any).user as { pseudo?: string } | undefined;
  const mcUsername = String(user?.pseudo ?? req.body?.pseudo ?? '').trim();
  if (!/^[a-zA-Z0-9_]{2,32}$/.test(mcUsername)) {
    return res.status(400).json({ error: 'Pseudo Minecraft invalide' });
  }
  // Derrière Cloudflare, req.ip est le pod cloudflared : l'IP du joueur est dans CF-Connecting-IP
  const ip = req.get('cf-connecting-ip') || req.ip || '';

  try {
    if (IP_CHECKED_SITES.has(site) && await ipVotedToday(site, ip)) {
      return res.json({ ok: false, reason: 'ip_already_used' });
    }
    const check = await checkVote(site, { mcUsername, ip });
    if (!check.ok) {
      console.log(`[votes/check] site=${site} user=${mcUsername} refusé : ${check.reason ?? 'inconnu'}`);
      return res.json({ ok: false, reason: check.reason });
    }
    const result = await recordVoteAndReward({ siteName: site, mcUsername, ip, rawPayload: { pseudo: mcUsername } });
    if (!result.inserted) {
      return res.json({ ok: false, reason: result.reason });
    }
    return res.json({ ok: true, rewarded: result.rconOk });
  } catch (error) {
    console.error(`[votes/check] site=${site} error:`, error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});
