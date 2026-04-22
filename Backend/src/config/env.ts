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
  STRIPE_PUBLISHABLE_KEY: z.string().min(10).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(10).optional(),
  RCON_HOST: z.string().min(1).optional(),
  RCON_PORT: z.coerce.number().int().positive().optional(),
  RCON_PASSWORD: z.string().min(1).optional(),
  /** Délai max (ms) pour connexion + réponses RCON (inventaire volumineux). Défaut rcon-client: 2000 — trop court. */
  RCON_TIMEOUT_MS: z.coerce.number().int().positive().default(60_000),
  TRUST_PROXY: z.coerce.number().int().min(0).default(1)
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n');
  throw new Error(`Invalid backend env:\n${details}`);
}

export const env = parsed.data;
