import { Router } from 'express';
import { getDbPool } from '../db/mysql.js';
import { authReadLimiter } from '../middleware/rateLimitMiddleware.js';

export const productsRouter = Router();

productsRouter.get('/', authReadLimiter, async (_req, res) => {
  try {
    const db = await getDbPool();
    const [rows] = await db.execute(
      `SELECT id, slug, name, description, category, price_ecus, image_url, is_new, sort_order
       FROM products
       WHERE active = 1
       ORDER BY sort_order ASC, id ASC`
    );
    if (!Array.isArray(rows)) return res.json({ items: [] });
    const items = (rows as any[]).map((r) => ({
      id: Number(r.id),
      slug: String(r.slug),
      name: String(r.name),
      description: r.description ?? null,
      category: String(r.category),
      priceEcus: Number(r.price_ecus),
      imageUrl: r.image_url ?? null,
      isNew: Boolean(r.is_new),
    }));
    return res.json({ items });
  } catch (error) {
    console.error('[products GET] error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});
