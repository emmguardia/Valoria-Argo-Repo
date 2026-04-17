import { Router } from 'express';
import type { Request } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import { env } from '../config/env.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { getDbPool } from '../db/mysql.js';
import { enqueueRewardDeliveryJob } from '../services/rewardDeliveryService.js';
import { paymentsLimiter, webhookLimiter } from '../middleware/rateLimitMiddleware.js';

export const paymentsRouter = Router();

const ecusPackSchema = z.object({
  ecus: z.union([z.literal(50), z.literal(150), z.literal(350), z.literal(750), z.literal(1650)])
});
const confirmCheckoutSchema = z.object({
  sessionId: z.string().min(1)
});

const ECUS_PRICING_CENTS: Record<50 | 150 | 350 | 750 | 1650, number> = {
  50: 99,
  150: 249,
  350: 499,
  750: 999,
  1650: 1999
};
// Mapping sécurisé côté backend (ne vient jamais de la requête client).
const ECUS_REWARD_IDS: Record<50 | 150 | 350 | 750 | 1650, string> = {
  50: 'ecus_50',
  150: 'ecus_150',
  350: 'ecus_350',
  750: 'ecus_750',
  1650: 'ecus_1650'
};
const STRIPE_CURRENCY = 'eur';

function getStripeClient() {
  if (!env.STRIPE_SECRET_KEY) return null;
  return new Stripe(env.STRIPE_SECRET_KEY);
}

function getFrontendUrl(req: Request) {
  const origin = req.get('origin');
  if (typeof origin === 'string' && origin.startsWith('http')) {
    return origin;
  }
  return 'https://valoria.zenixweb.fr';
}

paymentsRouter.get('/status', paymentsLimiter, (_req, res) => {
  const enabled = Boolean(env.STRIPE_SECRET_KEY);

  res.json({
    provider: 'stripe',
    enabled,
    message: enabled ? 'Paiements Stripe actifs' : 'Paiements Stripe non configurés'
  });
});

paymentsRouter.post('/create-checkout-session', paymentsLimiter, authenticateToken, async (req, res) => {
  const parsed = ecusPackSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Pack Écus invalide' });
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe non configuré côté serveur' });
  }

  const user = (req as any).user as { userId?: string; pseudo?: string; email?: string } | undefined;
  if (!user?.userId) {
    return res.status(401).json({ error: 'Token invalide' });
  }
  if (!user.pseudo || !/^[a-zA-Z0-9_]{2,32}$/.test(user.pseudo)) {
    return res.status(400).json({ error: 'Pseudo Minecraft invalide' });
  }

  const { ecus } = parsed.data;
  const amount = ECUS_PRICING_CENTS[ecus];
  const rewardId = ECUS_REWARD_IDS[ecus];
  const frontendUrl = getFrontendUrl(req);
  const successUrl = `${frontendUrl}/ecus?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${frontendUrl}/ecus?checkout=cancel`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: STRIPE_CURRENCY,
            unit_amount: amount,
            product_data: {
              name: `${ecus} Écus`,
              description: `Crédit de ${ecus} Écus pour Valoria`
            }
          }
        }
      ],
      metadata: {
        userId: user.userId,
        mcUsername: user.pseudo,
        ecus: String(ecus),
        rewardId
      }
    });

    if (!session.url) {
      return res.status(500).json({ error: 'URL Stripe introuvable' });
    }

    return res.status(201).json({ url: session.url });
  } catch (error) {
    console.error('[payments/create-checkout-session] error:', error);
    return res.status(500).json({ error: 'Erreur Stripe lors de la création de session' });
  }
});

async function persistPaidSession(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const mcUsername = session.metadata?.mcUsername;
  const rewardId = session.metadata?.rewardId;
  const ecusRaw = session.metadata?.ecus;
  const ecus = Number(ecusRaw);
  const amountCents = typeof session.amount_total === 'number' ? session.amount_total : 0;
  const currency = session.currency || STRIPE_CURRENCY;

  if (!session.id || !userId || !mcUsername || !rewardId || !Number.isInteger(ecus) || ecus <= 0) {
    throw new Error('Métadonnées Stripe invalides');
  }

  const db = await getDbPool();
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [existing] = await conn.execute(
      'SELECT id FROM stripe_ecus_payments WHERE stripe_session_id = ? LIMIT 1',
      [session.id]
    );
    if (Array.isArray(existing) && existing.length > 0) {
      const [rows] = await conn.execute('SELECT ecus FROM users WHERE id = ? LIMIT 1', [userId]);
      const currentEcus = Array.isArray(rows) && rows.length > 0 ? Number((rows[0] as any).ecus ?? 0) : 0;
      await conn.rollback();
      return { duplicated: true, credited: 0, ecus: currentEcus };
    }

    await conn.execute('UPDATE users SET ecus = ecus + ? WHERE id = ?', [ecus, userId]);
    await conn.execute(
      `INSERT INTO stripe_ecus_payments (stripe_session_id, user_id, mc_username, reward_id, ecus_amount, amount_cents, currency)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [session.id, userId, mcUsername, rewardId, ecus, amountCents, currency]
    );
    const [updatedRows] = await conn.execute('SELECT ecus FROM users WHERE id = ? LIMIT 1', [userId]);
    const newEcus = Array.isArray(updatedRows) && updatedRows.length > 0 ? Number((updatedRows[0] as any).ecus ?? 0) : 0;
    await conn.commit();

    await enqueueRewardDeliveryJob({
      stripeSessionId: session.id,
      userId: String(userId),
      mcUsername: String(mcUsername),
      rewardId: String(rewardId),
    });

    return { duplicated: false, credited: ecus, ecus: newEcus };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

paymentsRouter.post('/confirm-checkout-session', paymentsLimiter, authenticateToken, async (req, res) => {
  const parsed = confirmCheckoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Session Stripe invalide' });
  }

  if (!env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Stripe non configuré côté serveur' });
  }

  const user = (req as any).user as { userId?: string } | undefined;
  if (!user?.userId) {
    return res.status(401).json({ error: 'Token invalide' });
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(parsed.data.sessionId);
  } catch (error) {
    console.error('[payments/confirm-checkout-session] retrieve error:', error);
    return res.status(400).json({ error: 'Session Stripe introuvable' });
  }

  const userId = session.metadata?.userId;
  if (!userId || String(userId) !== String(user.userId)) {
    return res.status(403).json({ error: 'Session Stripe non autorisée' });
  }
  if (session.payment_status !== 'paid') {
    return res.status(409).json({ error: 'Paiement non validé' });
  }

  try {
    const result = await persistPaidSession(session);
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    console.error('[payments/confirm-checkout-session] processing error:', error);
    return res.status(500).json({ error: 'Erreur serveur validation paiement' });
  }
});

paymentsRouter.post('/webhooks/stripe', webhookLimiter, async (req, res) => {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return res.status(204).send();
  }

  const signature = req.headers['stripe-signature'];
  if (typeof signature !== 'string') {
    return res.status(400).json({ error: 'Signature Stripe manquante' });
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('[payments/stripe-webhook] signature error:', error);
    return res.status(400).json({ error: 'Signature webhook invalide' });
  }

  if (event.type !== 'checkout.session.completed') {
    return res.status(200).json({ ok: true, ignored: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  try {
    await persistPaidSession(session);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[payments/stripe-webhook] processing error:', error);
    return res.status(500).json({ error: 'Erreur serveur webhook Stripe' });
  }
});
