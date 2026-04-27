import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { authRouter } from './routes/authRoutes.js';
import { paymentsRouter } from './routes/paymentsRoutes.js';
import { productsRouter } from './routes/productsRoutes.js';
import { adminRouter } from './routes/adminRoutes.js';
import { voteRouter } from './routes/voteRoutes.js';
import { startEcusSyncWorker } from './services/ecusSyncService.js';
import { getRconRuntimeFingerprint } from './services/rconService.js';

const ALLOWED_ORIGINS = new Set([
  env.FRONTEND_URL,
  ...(env.NODE_ENV !== 'production' ? ['http://localhost:5173', 'http://localhost:3000'] : []),
]);

const app = express();
app.set('trust proxy', env.TRUST_PROXY);

app.use(cors({
  origin: (origin, callback) => {
    // Les requêtes sans Origin (curl, Postman, webhooks Stripe) sont autorisées.
    if (!origin || ALLOWED_ORIGINS.has(origin)) return callback(null, true);
    callback(new Error(`CORS: origine non autorisée — ${origin}`));
  },
}));
app.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));

app.use('/api/payments/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use('/api', express.json());
app.use('/api/auth', authRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/products', productsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/votes', voteRouter);

app.listen(env.PORT, () => {
  console.log(`Valoria backend listening on :${env.PORT}`);
  console.log('[RCON runtime]', getRconRuntimeFingerprint());
  startEcusSyncWorker();
});
