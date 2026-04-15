import { Router } from 'express';
import { verifyWebhookSignature } from '../services/tebexService.js';

export const webhookRouter = Router();

webhookRouter.post('/tebex', (req, res) => {
  const signature = req.header('x-signature');
  const rawBody = req.body as Buffer;

  if (!verifyWebhookSignature(rawBody, signature)) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  let payload: unknown = null;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  // TODO: Persist transaction + credit player + execute Minecraft command queue.
  console.log('Tebex webhook received:', payload);
  return res.status(200).json({ ok: true });
});
