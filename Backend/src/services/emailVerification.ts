import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import type { Pool } from 'mysql2/promise';
import { env } from '../config/env.js';

// Vérification de l'adresse e-mail : lien à usage unique (48 h) envoyé par l'Email-Service du homelab, projet
// « valoria » (expéditeur valoria@zenixweb.fr). Le jeton d'accès à l'Email-Service est signé ici avec sa clé (RS256).

const LINK_HOURS = 48;
export const RESEND_SECONDS = 60;

export const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

/** Prépare un nouveau lien pour ce compte et l'envoie. false si l'envoi n'a pas pu se faire (lien gardé quand même). */
export async function sendVerificationEmail(db: Pool, user: { id: string; pseudo: string; email: string }): Promise<boolean> {
  const token = crypto.randomBytes(32).toString('hex');
  await db.execute(
    `UPDATE users SET email_verify_hash = ?, email_verify_expires = NOW() + INTERVAL ${LINK_HOURS} HOUR,
       email_verify_sent_at = NOW() WHERE id = ?`,
    [hashToken(token), user.id]
  );
  const link = `${env.PUBLIC_SITE_URL.replace(/\/$/, '')}/verifier-email?jeton=${token}`;
  if (!env.EMAIL_SERVICE_PRIVATE_KEY) {
    console.warn('[email] EMAIL_SERVICE_PRIVATE_KEY absent : e-mail de vérification non envoyé', { userId: user.id });
    if (env.NODE_ENV !== 'production') console.info('[email] lien de vérification (dev) :', link);
    return false;
  }
  try {
    const auth = jwt.sign({ project: 'valoria', permissions: ['send_email'] }, env.EMAIL_SERVICE_PRIVATE_KEY, {
      algorithm: 'RS256', issuer: 'email-service', expiresIn: '5m'
    });
    const res = await fetch(`${env.EMAIL_SERVICE_URL}/api/v1/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}` },
      body: JSON.stringify({
        template_id: 'verify-email', project: 'valoria', to_email: user.email, to_name: user.pseudo,
        variables: { pseudo: user.pseudo, link }
      }),
      signal: AbortSignal.timeout(15_000)
    });
    if (!res.ok) {
      console.error('[email] Email-Service a refusé l\'envoi', res.status, await res.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] envoi impossible :', err instanceof Error ? err.message : err);
    return false;
  }
}
