import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  DB_HOST: z.string().min(1).optional(),
  DB_PORT: z.coerce.number().int().positive().optional(),
  DB_NAME: z.string().min(1).optional(),
  DB_USER: z.string().min(1).optional(),
  DB_PASSWORD: z.string().min(1).optional(),
  JWT_PRIVATE_KEY: z.string().min(10).optional(),
  JWT_PUBLIC_KEY: z.string().min(10).optional(),
  JWT_ISSUER: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().min(10).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(10).optional(),
  // Email-Service du homelab (vérification des adresses) : URL interne au cluster et clé de signature de ses jetons
  EMAIL_SERVICE_URL: z.string().url().default('http://email-service.email-service.svc.cluster.local:8080'),
  EMAIL_SERVICE_PRIVATE_KEY: z.string().min(10).optional(),
  // Adresse publique du site, pour les liens envoyés par e-mail (jamais déduite de la requête)
  PUBLIC_SITE_URL: z.string().url().default('https://valoria.zenixweb.fr'),
  // Jeton partagé avec le plugin du serveur Minecraft : il protège /api/server (le serveur vient chercher ses commandes).
  VALORIA_SERVER_TOKEN: z.string().min(32).optional(),
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),
  // Sites de vote : jetons d'API (secrets) et identifiants publics des fiches
  VOTE_SP_TOKEN: z.string().optional(),
  VOTE_SP_VOTE_URL: z.string().url().optional(),
  VOTE_TS_TOKEN: z.string().optional(),
  VOTE_TS_VOTE_URL: z.string().url().optional(),
  VOTE_SMO_SERVER_ID: z.string().optional(),
  VOTE_SMO_VOTE_URL: z.string().url().optional(),
  VOTE_LSM_SERVER_ID: z.string().optional(),
  VOTE_LSM_VOTE_URL: z.string().url().optional(),
  // Récompense in-game déclenchée à chaque vote validé.
  VOTE_REWARD_COMMAND: z.string().default('fvote add {user} small_rewards')
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n');
  throw new Error(`Invalid backend env:\n${details}`);
}

export const env = parsed.data;
