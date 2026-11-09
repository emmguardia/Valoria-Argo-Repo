import { timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { env } from '../config/env.js';
import { applyAcks, claimCommands, isMcName, isMcUuid, recordHeartbeat } from '../services/serverQueueService.js';
import { ShopError, balancesFor, catalogFor, linkAccount, purchaseProduct, userIdForUuid } from '../services/shopService.js';

// API réservée au serveur Minecraft (plugin ValoriaCore), protégée par le jeton partagé VALORIA_SERVER_TOKEN.
// Le serveur appelle le site, jamais l'inverse : aucun port à ouvrir sur la VM du serveur.

export const serverRouter = Router();

const serverLimiter = rateLimit({ windowMs: 60_000, limit: 600, standardHeaders: true, legacyHeaders: false });

function requireServerToken(req: Request, res: Response, next: NextFunction) {
  const expected = env.VALORIA_SERVER_TOKEN;
  if (!expected) return res.status(503).json({ error: 'API serveur non configurée' });
  const given = (req.headers.authorization || '').replace(/^Bearer /, '');
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    // Derrière Cloudflare, req.ip est le pod cloudflared : l'IP de l'appelant est dans CF-Connecting-IP
    const ip = req.get('cf-connecting-ip') || req.ip;
    console.warn(JSON.stringify({ evt: 'serveur', etape: 'jeton-refuse', ip, ua: req.get('user-agent') ?? null, ts: new Date().toISOString() }));
    return res.status(401).json({ error: 'Jeton invalide' });
  }
  return next();
}

serverRouter.use(serverLimiter, requireServerToken);

const playerSchema = z.object({ uuid: z.string().refine(isMcUuid), name: z.string().refine(isMcName) });
const pollSchema = z.object({
  online: z.array(playerSchema).max(500),
  acks: z.array(z.object({
    id: z.number().int().positive(),
    ok: z.boolean(),
    error: z.string().max(1000).optional(),
    executedAt: z.string().max(40).optional(),
  })).max(500).default([]),
  pluginVersion: z.string().max(40).optional(),
});

// Un passage noté par minute et par réplica, ou dès qu'il s'est passé quelque chose
let lastHeartbeat = 0;

/** Tirage : le serveur envoie ses accusés et la liste des joueurs connectés, reçoit ses commandes et les soldes. */
serverRouter.post('/poll', async (req, res) => {
  const parsed = pollSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Requête invalide' });
  const { online, acks, pluginVersion } = parsed.data;
  try {
    const acked = await applyAcks(acks);
    const commands = await claimCommands(online);
    const balances = await balancesFor(online.map((p) => p.uuid));
    if (commands.length > 0 || acked > 0 || Date.now() - lastHeartbeat > 60_000) {
      lastHeartbeat = Date.now();
      await recordHeartbeat(online.length, pluginVersion ?? null, commands.length, acked);
    }
    if (commands.length > 0 || acked > 0) {
      console.log(JSON.stringify({ evt: 'serveur', etape: 'tirage', joueurs: online.length, envoyees: commands.map((c) => c.id),
        accusees: acks.map((a) => `${a.id}:${a.ok ? 'ok' : 'echec'}`), ts: new Date().toISOString() }));
    }
    return res.json({ commands, balances, serverTime: new Date().toISOString() });
  } catch (error) {
    console.error('[server/poll] error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

/** Produits en vente, avec le prix pour ce joueur (menu /boutique en jeu). */
serverRouter.get('/catalog/:uuid', async (req, res) => {
  if (!isMcUuid(req.params.uuid)) return res.status(400).json({ error: 'uuid invalide' });
  try {
    const userId = await userIdForUuid(req.params.uuid);
    const balance = userId ? (await balancesFor([req.params.uuid]))[req.params.uuid] ?? 0 : null;
    return res.json({ linked: userId !== null, balance, products: await catalogFor(userId) });
  } catch (error) {
    console.error('[server/catalog] error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

const purchaseSchema = z.object({
  uuid: z.string().refine(isMcUuid),
  slug: z.string().regex(/^[a-z0-9-]{1,80}$/),
  requestId: z.string().regex(/^[a-zA-Z0-9_-]{8,64}$/),
});

/** Achat en jeu avec les Écus du compte lié. Rejouer la même requestId ne repaie pas. */
serverRouter.post('/purchase', async (req, res) => {
  const parsed = purchaseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Requête invalide' });
  try {
    const userId = await userIdForUuid(parsed.data.uuid);
    if (!userId) return res.status(409).json({ code: 'compte_non_lie', error: 'Compte du site non lié : /lier <code>' });
    const result = await purchaseProduct({ userId, productSlug: parsed.data.slug, requestId: parsed.data.requestId, origin: 'jeu' });
    return res.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof ShopError) return res.status(error.status).json({ code: error.code, error: error.message });
    console.error('[server/purchase] error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

const linkSchema = z.object({ uuid: z.string().refine(isMcUuid), name: z.string().refine(isMcName), code: z.string().max(16) });

/** /lier <code> en jeu. */
serverRouter.post('/link', async (req, res) => {
  const parsed = linkSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Requête invalide' });
  try {
    return res.json({ ok: true, ...(await linkAccount(parsed.data)) });
  } catch (error) {
    if (error instanceof ShopError) return res.status(error.status).json({ code: error.code, error: error.message });
    console.error('[server/link] error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});
