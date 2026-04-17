import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { authRouter } from './routes/authRoutes.js';
import { paymentsRouter } from './routes/paymentsRoutes.js';
import { startRewardDeliveryWorker } from './services/rewardDeliveryService.js';
import { getRconRuntimeFingerprint } from './services/rconService.js';

const app = express();
app.set('trust proxy', env.TRUST_PROXY);

app.use(cors());
app.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));

app.use('/api/payments/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use('/api', express.json());
app.use('/api/auth', authRouter);
app.use('/api/payments', paymentsRouter);

app.listen(env.PORT, () => {
  console.log(`Valoria backend listening on :${env.PORT}`);
  console.log('[RCON runtime]', getRconRuntimeFingerprint());
  startRewardDeliveryWorker();
});
