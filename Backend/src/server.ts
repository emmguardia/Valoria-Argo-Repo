import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { authRouter } from './routes/authRoutes.js';
import { paymentsRouter } from './routes/paymentsRoutes.js';
import { productsRouter } from './routes/productsRoutes.js';
import { adminRouter } from './routes/adminRoutes.js';
import { voteRouter } from './routes/voteRoutes.js';
import { serverRouter } from './routes/serverRoutes.js';
import { shopRouter } from './routes/shopRoutes.js';

const app = express();
app.set('trust proxy', env.TRUST_PROXY);

app.use(cors());
app.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));

app.use('/api/payments/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use('/api', express.json());
app.use('/api/auth', authRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/products', productsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/votes', voteRouter);
app.use('/api/shop', shopRouter);
// Réservé au serveur Minecraft (jeton partagé) : il vient chercher ses commandes, le site ne l'appelle jamais
app.use('/api/server', serverRouter);

app.listen(env.PORT, () => {
  console.log(`Valoria backend listening on :${env.PORT}`);
});
