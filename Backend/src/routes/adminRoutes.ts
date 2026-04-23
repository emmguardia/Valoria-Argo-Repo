import { Router } from 'express';
import { z } from 'zod';
import { getDbPool } from '../db/mysql.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';
import { authReadLimiter, authWriteLimiter } from '../middleware/rateLimitMiddleware.js';

export const adminRouter = Router();

// Toutes les routes passent par auth + requireAdmin.
adminRouter.use(authenticateToken, requireAdmin);

// ───────── UTILS ─────────
function parsePagination(q: any) {
  const page = Math.max(1, Number(q.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(q.limit) || 25));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

// ═══════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════

adminRouter.get('/users', authReadLimiter, async (req, res) => {
  try {
    const { limit, offset, page } = parsePagination(req.query);
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const db = await getDbPool();

    let where = '';
    const params: any[] = [];
    if (search) {
      where = 'WHERE pseudo LIKE ? OR email LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [countRows] = await db.execute(`SELECT COUNT(*) as total FROM users ${where}`, params);
    const total = Array.isArray(countRows) && countRows.length > 0 ? Number((countRows[0] as any).total) : 0;

    const [rows] = await db.execute(
      `SELECT id, pseudo, email, ecus, role, banned_at, banned_reason, created_at, last_login
       FROM users ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const items = Array.isArray(rows)
      ? (rows as any[]).map((u) => ({
          id: String(u.id),
          pseudo: u.pseudo,
          email: u.email,
          ecus: Number(u.ecus ?? 0),
          role: u.role || 'user',
          bannedAt: u.banned_at,
          bannedReason: u.banned_reason,
          createdAt: u.created_at,
          lastLogin: u.last_login,
        }))
      : [];

    return res.json({ items, total, page, limit });
  } catch (error) {
    console.error('[admin/users GET] error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

const updateUserSchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
  banned: z.boolean().optional(),
  banReason: z.string().max(500).optional(),
});

adminRouter.patch('/users/:id', authWriteLimiter, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Id invalide' });
  }
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Champs invalides' });
  }
  const { role, banned, banReason } = parsed.data;
  if (role === undefined && banned === undefined) {
    return res.status(400).json({ error: 'Aucune modification' });
  }

  try {
    const db = await getDbPool();
    const updates: string[] = [];
    const values: any[] = [];
    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }
    if (banned !== undefined) {
      if (banned) {
        updates.push('banned_at = NOW()', 'banned_reason = ?');
        values.push(banReason || 'Non communiqué');
      } else {
        updates.push('banned_at = NULL', 'banned_reason = NULL');
      }
    }
    values.push(id);

    await db.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    const [rows] = await db.execute(
      `SELECT id, pseudo, email, ecus, role, banned_at, banned_reason, created_at, last_login
       FROM users WHERE id = ? LIMIT 1`,
      [id]
    );
    const user = Array.isArray(rows) && rows.length > 0 ? (rows[0] as any) : null;
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    return res.json({
      id: String(user.id),
      pseudo: user.pseudo,
      email: user.email,
      ecus: Number(user.ecus ?? 0),
      role: user.role,
      bannedAt: user.banned_at,
      bannedReason: user.banned_reason,
      createdAt: user.created_at,
      lastLogin: user.last_login,
    });
  } catch (error) {
    console.error('[admin/users PATCH] error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

const adjustEcusSchema = z.object({
  delta: z.number().int().min(-1000000).max(1000000),
  reason: z.string().trim().min(2).max(500),
});

adminRouter.post('/users/:id/ecus', authWriteLimiter, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Id invalide' });
  }
  const parsed = adjustEcusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Champs invalides' });
  }
  const { delta, reason } = parsed.data;
  const adminId = Number((req as any).user.userId);

  const db = await getDbPool();
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute('SELECT id, ecus FROM users WHERE id = ? FOR UPDATE', [id]);
    if (!Array.isArray(rows) || rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }
    const current = Number((rows[0] as any).ecus ?? 0);
    const next = current + delta;
    if (next < 0) {
      await conn.rollback();
      return res.status(409).json({ error: 'Solde écus ne peut pas devenir négatif' });
    }
    await conn.execute('UPDATE users SET ecus = ? WHERE id = ?', [next, id]);
    await conn.execute(
      `INSERT INTO ecus_adjustments (user_id, admin_id, delta, reason, balance_after)
       VALUES (?, ?, ?, ?, ?)`,
      [id, adminId, delta, reason, next]
    );
    await conn.commit();
    console.log(`[admin/ecus] admin=${adminId} user=${id} delta=${delta} balance=${next} reason="${reason}"`);
    return res.json({ ok: true, balance: next, delta });
  } catch (error) {
    try { await conn.rollback(); } catch {}
    console.error('[admin/users/ecus POST] error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    conn.release();
  }
});

// ═══════════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════════

adminRouter.get('/products', authReadLimiter, async (_req, res) => {
  try {
    const db = await getDbPool();
    const [rows] = await db.execute(
      `SELECT id, slug, name, description, category, price_ecus, image_url,
              command_template, is_new, active, sort_order, created_at, updated_at
       FROM products ORDER BY sort_order ASC, id ASC`
    );
    const items = Array.isArray(rows)
      ? (rows as any[]).map((p) => ({
          id: Number(p.id),
          slug: p.slug,
          name: p.name,
          description: p.description,
          category: p.category,
          priceEcus: Number(p.price_ecus),
          imageUrl: p.image_url,
          commandTemplate: p.command_template,
          isNew: Boolean(p.is_new),
          active: Boolean(p.active),
          sortOrder: Number(p.sort_order),
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        }))
      : [];
    return res.json({ items });
  } catch (error) {
    console.error('[admin/products GET] error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

const productSchema = z.object({
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9_-]+$/, 'Slug: a-z, 0-9, _ ou -'),
  name: z.string().trim().min(2).max(120),
  description: z.string().max(2000).nullable().optional(),
  category: z.enum(['cosmetiques', 'avantages', 'kits', 'grades']),
  priceEcus: z.number().int().min(0).max(1_000_000),
  imageUrl: z.string().trim().max(500).nullable().optional(),
  commandTemplate: z.string().trim().min(2).max(500),
  isNew: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

adminRouter.post('/products', authWriteLimiter, async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Champs invalides' });
  }
  const p = parsed.data;
  try {
    const db = await getDbPool();
    const [result] = await db.execute(
      `INSERT INTO products (slug, name, description, category, price_ecus, image_url, command_template, is_new, active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.slug, p.name, p.description ?? null, p.category, p.priceEcus,
        p.imageUrl ?? null, p.commandTemplate, p.isNew ? 1 : 0, p.active ? 1 : 0, p.sortOrder,
      ]
    );
    const insertedId = (result as any).insertId;
    return res.status(201).json({ ok: true, id: Number(insertedId) });
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Slug déjà utilisé' });
    }
    console.error('[admin/products POST] error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

adminRouter.patch('/products/:id', authWriteLimiter, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Id invalide' });
  }
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Champs invalides' });
  }
  const data = parsed.data;
  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'Aucune modification' });
  }

  const fields: string[] = [];
  const values: any[] = [];
  const map: Record<string, string> = {
    slug: 'slug', name: 'name', description: 'description', category: 'category',
    priceEcus: 'price_ecus', imageUrl: 'image_url', commandTemplate: 'command_template',
    isNew: 'is_new', active: 'active', sortOrder: 'sort_order',
  };
  for (const [k, col] of Object.entries(map)) {
    if (k in data) {
      fields.push(`${col} = ?`);
      let v = (data as any)[k];
      if (typeof v === 'boolean') v = v ? 1 : 0;
      values.push(v);
    }
  }
  values.push(id);

  try {
    const db = await getDbPool();
    await db.execute(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
    return res.json({ ok: true });
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Slug déjà utilisé' });
    }
    console.error('[admin/products PATCH] error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

adminRouter.delete('/products/:id', authWriteLimiter, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Id invalide' });
  }
  try {
    const db = await getDbPool();
    await db.execute('DELETE FROM products WHERE id = ?', [id]);
    return res.json({ ok: true });
  } catch (error) {
    console.error('[admin/products DELETE] error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ═══════════════════════════════════════════════════════════════
// PAYMENTS (lecture seule)
// ═══════════════════════════════════════════════════════════════

adminRouter.get('/payments', authReadLimiter, async (req, res) => {
  try {
    const { limit, offset, page } = parsePagination(req.query);
    const db = await getDbPool();

    const [countRows] = await db.execute('SELECT COUNT(*) as total FROM stripe_ecus_payments');
    const total = Array.isArray(countRows) && countRows.length > 0 ? Number((countRows[0] as any).total) : 0;

    const [rows] = await db.execute(
      `SELECT p.id, p.stripe_session_id, p.user_id, p.mc_username, p.reward_id,
              p.ecus_amount, p.amount_cents, p.currency, p.created_at,
              u.pseudo, u.email
       FROM stripe_ecus_payments p
       LEFT JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const items = Array.isArray(rows)
      ? (rows as any[]).map((p) => ({
          id: Number(p.id),
          stripeSessionId: p.stripe_session_id,
          userId: String(p.user_id),
          userPseudo: p.pseudo,
          userEmail: p.email,
          mcUsername: p.mc_username,
          rewardId: p.reward_id,
          ecusAmount: Number(p.ecus_amount),
          amountCents: Number(p.amount_cents),
          currency: p.currency,
          createdAt: p.created_at,
        }))
      : [];
    return res.json({ items, total, page, limit });
  } catch (error) {
    console.error('[admin/payments GET] error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ═══════════════════════════════════════════════════════════════
// REWARD JOBS (lecture + retry manuel)
// ═══════════════════════════════════════════════════════════════

adminRouter.get('/reward-jobs', authReadLimiter, async (req, res) => {
  try {
    const { limit, offset, page } = parsePagination(req.query);
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    const db = await getDbPool();

    let where = '';
    const params: any[] = [];
    if (status && ['pending', 'processing', 'completed', 'failed', 'dead', 'pending_claim'].includes(status)) {
      where = 'WHERE j.status = ?';
      params.push(status);
    }

    const [countRows] = await db.execute(`SELECT COUNT(*) as total FROM reward_delivery_jobs j ${where}`, params);
    const total = Array.isArray(countRows) && countRows.length > 0 ? Number((countRows[0] as any).total) : 0;

    const [rows] = await db.execute(
      `SELECT j.id, j.stripe_session_id, j.user_id, j.mc_username, j.reward_id,
              j.command_text, j.status, j.attempts, j.last_error, j.delivered_at,
              j.daily_attempts, j.daily_attempts_reset_at, j.requires_manual_claim,
              j.created_at, j.updated_at, u.pseudo, u.email
       FROM reward_delivery_jobs j
       LEFT JOIN users u ON u.id = j.user_id
       ${where}
       ORDER BY j.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const items = Array.isArray(rows)
      ? (rows as any[]).map((j) => ({
          id: Number(j.id),
          stripeSessionId: j.stripe_session_id,
          userId: String(j.user_id),
          userPseudo: j.pseudo,
          userEmail: j.email,
          mcUsername: j.mc_username,
          rewardId: j.reward_id,
          commandText: j.command_text,
          status: j.status,
          attempts: Number(j.attempts ?? 0),
          lastError: j.last_error,
          deliveredAt: j.delivered_at,
          dailyAttempts: Number(j.daily_attempts ?? 0),
          dailyAttemptsResetAt: j.daily_attempts_reset_at,
          requiresManualClaim: Boolean(j.requires_manual_claim),
          createdAt: j.created_at,
          updatedAt: j.updated_at,
        }))
      : [];

    return res.json({ items, total, page, limit });
  } catch (error) {
    console.error('[admin/reward-jobs GET] error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Remettre un job failed / dead en pending_claim pour permettre au joueur de reclaim.
adminRouter.post('/reward-jobs/:id/reopen', authWriteLimiter, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Id invalide' });
  try {
    const db = await getDbPool();
    await db.execute(
      `UPDATE reward_delivery_jobs
       SET status = 'pending_claim', daily_attempts = 0, daily_attempts_reset_at = NULL,
           last_error = NULL, updated_at = NOW()
       WHERE id = ?`,
      [id]
    );
    return res.json({ ok: true });
  } catch (error) {
    console.error('[admin/reward-jobs reopen] error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ═══════════════════════════════════════════════════════════════
// AUDIT (lectures)
// ═══════════════════════════════════════════════════════════════

adminRouter.get('/ecus-adjustments', authReadLimiter, async (req, res) => {
  try {
    const { limit, offset, page } = parsePagination(req.query);
    const userId = typeof req.query.userId === 'string' ? Number(req.query.userId) : null;
    const db = await getDbPool();

    let where = '';
    const params: any[] = [];
    if (userId && Number.isInteger(userId) && userId > 0) {
      where = 'WHERE a.user_id = ?';
      params.push(userId);
    }

    const [countRows] = await db.execute(`SELECT COUNT(*) as total FROM ecus_adjustments a ${where}`, params);
    const total = Array.isArray(countRows) && countRows.length > 0 ? Number((countRows[0] as any).total) : 0;

    const [rows] = await db.execute(
      `SELECT a.id, a.user_id, a.admin_id, a.delta, a.reason, a.balance_after, a.created_at,
              u.pseudo as user_pseudo, adm.pseudo as admin_pseudo
       FROM ecus_adjustments a
       LEFT JOIN users u ON u.id = a.user_id
       LEFT JOIN users adm ON adm.id = a.admin_id
       ${where}
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const items = Array.isArray(rows)
      ? (rows as any[]).map((a) => ({
          id: Number(a.id),
          userId: String(a.user_id),
          userPseudo: a.user_pseudo,
          adminId: String(a.admin_id),
          adminPseudo: a.admin_pseudo,
          delta: Number(a.delta),
          reason: a.reason,
          balanceAfter: Number(a.balance_after),
          createdAt: a.created_at,
        }))
      : [];
    return res.json({ items, total, page, limit });
  } catch (error) {
    console.error('[admin/ecus-adjustments GET] error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});
