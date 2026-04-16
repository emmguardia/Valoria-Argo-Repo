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

async function createPluginCheckoutUrl(packageId: string, username: string): Promise<string> {
  if (!env.TEBEX_SECRET_KEY) {
    throw new Error('TEBEX_SECRET_KEY non configurée');
  }

  // D'apres la doc Tebex Plugin API:
  // POST https://plugin.tebex.io/checkout
  // Headers: X-Tebex-Secret
  // Body: { package_id, username }
  const resp = await fetch('https://plugin.tebex.io/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tebex-Secret': env.TEBEX_SECRET_KEY
    },
    body: JSON.stringify({
      package_id: packageId,
      username
    })
  });

  const payload: unknown = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    const message = (payload as any)?.error || (payload as any)?.message || `Tebex error HTTP ${resp.status}`;
    throw new Error(message);
  }

  const url = (payload as any)?.url;
  if (!url || typeof url !== 'string') {
    throw new Error('Réponse Tebex invalide: url manquant');
  }

  return url;
}

export async function resolveCheckoutUrl(packAmount: number, username?: string): Promise<string> {
  const packageId = packageIds[String(packAmount)];
  if (!packageId) {
    throw new Error(`No Tebex package configured for pack ${packAmount}`);
  }

  const normalizedUsername = (username ?? '').trim();
  if (!normalizedUsername) {
    // La Plugin API Tebex demande username (la doc dit "The username of the player").
    throw new Error('username requis pour Tebex');
  }

  return createPluginCheckoutUrl(packageId, normalizedUsername);
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
