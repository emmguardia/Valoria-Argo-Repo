import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { tebexRouter } from './routes/tebexRoutes.js';
import { authRouter } from './routes/authRoutes.js';
import { webhookRouter } from './routes/webhookRoutes.js';

const app = express();

app.use(cors());
app.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));

app.use('/api/tebex/webhooks', express.raw({ type: 'application/json' }), webhookRouter);
app.use('/api', express.json());
app.use('/api/tebex', tebexRouter);
app.use('/api/auth', authRouter);

app.listen(env.PORT, () => {
  console.log(`Valoria backend listening on :${env.PORT}`);
});
