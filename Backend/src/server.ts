import express from 'express';
import { env } from './config/env.js';
import { closeDbPool } from './db/mysql.js';
import { authRouter } from './routes/authRoutes.js';
import { paymentsRouter } from './routes/paymentsRoutes.js';
import { productsRouter } from './routes/productsRoutes.js';
import { adminRouter } from './routes/adminRoutes.js';
import { voteRouter } from './routes/voteRoutes.js';
import { serverRouter } from './routes/serverRoutes.js';
import { shopRouter } from './routes/shopRoutes.js';
import { statsRouter } from './routes/statsRoutes.js';

const app = express();
app.set('trust proxy', env.TRUST_PROXY);
app.disable('x-powered-by');

// Pas de CORS : l'API est servie par le même domaine que le site (nginx du front la relaie sous /api)
app.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));

app.use('/api/payments/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use('/api', express.json());
app.use('/api/auth', authRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/products', productsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/votes', voteRouter);
app.use('/api/shop', shopRouter);
// Mesure d'audience anonyme (sans cookie, sans IP stockée)
app.use('/api/stats', statsRouter);
// Réservé au serveur Minecraft (jeton partagé) : il vient chercher ses commandes, le site ne l'appelle jamais
app.use('/api/server', serverRouter);

const server = app.listen(env.PORT, () => {
  console.log(`Valoria backend listening on :${env.PORT}`);
});

// Arrêt demandé par Kubernetes (déploiement, nœud vidé) : on finit les requêtes en cours avant de fermer la base
let stopping = false;
function shutdown(signal: string) {
  if (stopping) return;
  stopping = true;
  console.log(`[server] ${signal} reçu : arrêt après les requêtes en cours`);
  const force = setTimeout(() => process.exit(1), 20_000);
  force.unref();
  server.close(() => {
    closeDbPool()
      .catch((error) => console.error('[server] fermeture de la base :', error))
      .finally(() => process.exit(0));
  });
  server.closeIdleConnections();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
