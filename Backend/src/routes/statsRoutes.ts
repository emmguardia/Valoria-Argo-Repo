import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { recordPageView } from '../services/statsService.js';

// Mesure d'audience anonyme du site : une page vue = un appel sans cookie ni identifiant (voir statsService).
export const statsRouter = Router();

const viewLimiter = rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: false, legacyHeaders: false });

statsRouter.post('/v', viewLimiter, async (req, res) => {
  // Réponse immédiate : la mesure ne doit jamais ralentir ni casser le site
  res.status(204).end();
  try {
    await recordPageView({
      path: req.body?.p,
      referrer: req.body?.r,
      // Derrière Cloudflare : IP et pays du visiteur (l'IP sert à l'empreinte du jour, jamais écrite)
      ip: req.get('cf-connecting-ip') || req.ip || '',
      userAgent: req.get('user-agent') || '',
      country: req.get('cf-ipcountry') || null,
      dnt: req.get('dnt') === '1' || req.get('sec-gpc') === '1',
    });
  } catch (error) {
    console.error('[stats/v] error:', error);
  }
});
