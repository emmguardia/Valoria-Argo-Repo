import type { Request } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Options } from 'express-rate-limit';

/**
 * IP du visiteur. Le site passe par le tunnel Cloudflare : req.ip est le pod cloudflared (le même pour tout le monde),
 * l'IP réelle est dans CF-Connecting-IP, posé par Cloudflare (un en-tête envoyé par le client est remplacé).
 */
export function clientIp(req: Request): string {
  return req.get('cf-connecting-ip') || req.ip || '';
}

/** Limiteur de requêtes compté par visiteur (IP réelle, les IPv6 regroupées par /56 comme le fait express-rate-limit). */
export function limiter(options: Partial<Options>) {
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(clientIp(req)),
    ...options,
  });
}
