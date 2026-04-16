import { Router } from 'express';
import { z } from 'zod';
import { getPublicTebexConfig, resolveCheckoutUrl } from '../services/tebexService.js';

export const tebexRouter = Router();

const checkoutSchema = z.object({
  pack: z.coerce.number().int().positive(),
  username: z.string().trim().min(2).max(32).optional()
});

tebexRouter.get('/config', (_req, res) => {
  res.json(getPublicTebexConfig());
});

tebexRouter.post('/checkout-url', async (req, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    const url = await resolveCheckoutUrl(parsed.data.pack, parsed.data.username);
    return res.json({ url });
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
});
