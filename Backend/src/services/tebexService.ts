import crypto from 'crypto';
import { z } from 'zod';
import { env } from '../config/env.js';

const packageIdsSchema = z.record(z.string(), z.string().min(1));

function parsePackageIds(raw: string): Record<string, string> {
  try {
    const json = JSON.parse(raw);
    return packageIdsSchema.parse(json);
  } catch {
    return {};
  }
}

const packageIds = parsePackageIds(env.TEBEX_PACKAGE_IDS);

export function resolveCheckoutUrl(packAmount: number, username?: string): string {
  const packageId = packageIds[String(packAmount)];
  if (!packageId) {
    throw new Error(`No Tebex package configured for pack ${packAmount}`);
  }

  const url = new URL(`${env.TEBEX_CHECKOUT_BASE_URL}${packageId}`);
  if (username) {
    url.searchParams.set('username', username);
  }
  return url.toString();
}

export function verifyWebhookSignature(rawBody: Buffer, signature: string | undefined): boolean {
  if (!signature) return false;
  const hmac = crypto.createHmac('sha256', env.TEBEX_WEBHOOK_SECRET);
  hmac.update(rawBody);
  const expected = hmac.digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expected, 'utf8'));
  } catch {
    return false;
  }
}

export function getPublicTebexConfig() {
  return {
    checkoutBaseUrl: env.TEBEX_CHECKOUT_BASE_URL,
    packageIds
  };
}
