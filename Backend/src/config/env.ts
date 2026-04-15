import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  TEBEX_SECRET_KEY: z.string().min(10),
  TEBEX_PUBLIC_TOKEN: z.string().min(10),
  TEBEX_PROJECT_ID: z.string().min(1),
  TEBEX_WEBHOOK_SECRET: z.string().min(10),
  TEBEX_CHECKOUT_BASE_URL: z.string().url().default('https://checkout.tebex.io/package/'),
  TEBEX_PACKAGE_IDS: z.string().default('{}')
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n');
  throw new Error(`Invalid backend env:\n${details}`);
}

export const env = parsed.data;
