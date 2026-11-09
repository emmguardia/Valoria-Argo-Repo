import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authReadLimiter, paymentsLimiter } from '../middleware/rateLimitMiddleware.js';
import { getDbPool } from '../db/mysql.js';
import { ShopError, catalogFor, createLinkCode, purchaseProduct } from '../services/shopService.js';

// Boutique du site : achat en Écus, liaison du compte au jeu, historique complet du joueur
// (achats, état de chaque livraison, mouvements d'Écus).

export const shopRouter = Router();

const userIdOf = (req: any) => Number(req.user?.userId);

shopRouter.get('/catalog', authReadLimiter, authenticateToken, async (req, res) => {
  try {
    return res.json({ products: await catalogFor(userIdOf(req)) });
  } catch (error) {
    console.error('[shop/catalog] error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

const purchaseSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{1,80}$/),
  requestId: z.string().regex(/^[a-zA-Z0-9_-]{8,64}$/),
});

shopRouter.post('/purchase', paymentsLimiter, authenticateToken, async (req, res) => {
  const parsed = purchaseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Requête invalide' });
  try {
    const result = await purchaseProduct({ userId: userIdOf(req), productSlug: parsed.data.slug, requestId: parsed.data.requestId, origin: 'site' });
    return res.status(result.duplicated ? 200 : 201).json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof ShopError) return res.status(error.status).json({ code: error.code, error: error.message });
    console.error('[shop/purchase] error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

shopRouter.post('/link-code', paymentsLimiter, authenticateToken, async (req, res) => {
  try {
    const { code, expiresAt } = await createLinkCode(userIdOf(req));
    return res.status(201).json({ code, expiresAt: expiresAt.toISOString() });
  } catch (error) {
    console.error('[shop/link-code] error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

/** Tout ce qui concerne le joueur : liaison, achats avec l'état de leur livraison, registre des Écus. */
shopRouter.get('/me', authReadLimiter, authenticateToken, async (req, res) => {
  try {
    const db = await getDbPool();
    const userId = userIdOf(req);
    const [users] = await db.execute('SELECT pseudo, ecus, mc_uuid, mc_linked_at FROM users WHERE id = ?', [userId]);
    const user = (users as any[])[0];
    if (!user) return res.status(404).json({ error: 'Compte introuvable' });
    const [purchases] = await db.execute(
      `SELECT pp.id, pp.product_slug, pp.product_name, pp.price_ecus, pp.origin, pp.created_at,
              sc.id AS command_id, sc.status, sc.attempts, sc.done_at, sc.last_error
       FROM product_purchases pp LEFT JOIN server_commands sc ON sc.id = pp.server_command_id
       WHERE pp.user_id = ? ORDER BY pp.id DESC LIMIT 100`, [userId]);
    const [ledger] = await db.execute(
      `SELECT id, delta, balance_after, reason, origin, ref_type, ref_id, detail, created_at
       FROM ecus_ledger WHERE user_id = ? ORDER BY id DESC LIMIT 200`, [userId]);
    return res.json({
      pseudo: user.pseudo,
      ecus: Number(user.ecus ?? 0),
      linked: Boolean(user.mc_uuid),
      linkedAt: user.mc_linked_at,
      purchases: (purchases as any[]).map((p) => ({
        id: Number(p.id), slug: p.product_slug, name: p.product_name, price: Number(p.price_ecus), origin: p.origin,
        createdAt: p.created_at, commandId: p.command_id ? Number(p.command_id) : null,
        delivery: p.status ?? 'inconnue', attempts: Number(p.attempts ?? 0), deliveredAt: p.done_at, lastError: p.last_error,
      })),
      ledger: (ledger as any[]).map((l) => ({
        id: Number(l.id), delta: Number(l.delta), balanceAfter: Number(l.balance_after), reason: l.reason, origin: l.origin,
        ref: l.ref_type ? `${l.ref_type}:${l.ref_id}` : null, detail: l.detail, createdAt: l.created_at,
      })),
    });
  } catch (error) {
    console.error('[shop/me] error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});
