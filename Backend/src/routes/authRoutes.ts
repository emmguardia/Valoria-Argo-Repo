import { Router } from 'express';
import type { RowDataPacket } from 'mysql2/promise';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getDbPool } from '../db/mysql.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authReadLimiter, authWriteLimiter } from '../middleware/rateLimitMiddleware.js';
import { hashToken, RESEND_SECONDS, sendVerificationEmail } from '../services/emailVerification.js';
import { jwtConfigured, signToken } from '../services/jwt.js';
import { USER_COLUMNS, userJson } from '../services/users.js';
import type { UserRow } from '../services/users.js';

const authRouter = Router();

function normalizePseudo(raw: string) {
  return raw.trim();
}

function normalizeEmail(raw: string) {
  return raw.toLowerCase().trim();
}

function validatePassword(password: string) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

// Même règle qu'un pseudo Minecraft : le pseudo du compte est celui du joueur en jeu
const pseudoSchema = z
  .string()
  .trim()
  .min(2)
  .max(16)
  .regex(/^[a-zA-Z0-9_]+$/, 'Pseudo Minecraft invalide (lettres, chiffres et _ uniquement)');

const emailSchema = z.string().trim().email();

const passwordSchema = z
  .string()
  .min(8)
  .max(128)
  .refine((v) => validatePassword(v), 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre');

const registerSchema = z.object({
  pseudo: pseudoSchema,
  email: emailSchema.transform((v) => normalizeEmail(v)),
  password: passwordSchema
});

const loginSchema = z.object({
  pseudo: pseudoSchema.optional(),
  email: emailSchema.optional().transform((v) => (v ? normalizeEmail(v) : v)),
  // Pas la règle de complexité de l'inscription : un ancien mot de passe reste valable si la règle change
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().optional().default(false)
});

authRouter.post('/register', authWriteLimiter, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Champs invalides' });
  }

  try {
    if (!jwtConfigured()) {
      return res.status(500).json({ error: 'JWT non configuré côté serveur' });
    }

    const { pseudo, email, password } = parsed.data;
    const db = await getDbPool();

    const [existingPseudo] = await db.execute('SELECT id FROM users WHERE pseudo = ? LIMIT 1', [pseudo]);
    if (Array.isArray(existingPseudo) && existingPseudo.length > 0) {
      return res.status(409).json({
        error: 'Pseudo déjà pris sur le site. Si c\'est ton pseudo Minecraft, inscris-toi avec un autre pseudo puis tape /lier en jeu : ton pseudo te sera rendu.'
      });
    }

    const [existingEmail] = await db.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (Array.isArray(existingEmail) && existingEmail.length > 0) {
      return res.status(409).json({ error: 'Email déjà utilisé' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [insertResult] = await db.execute(
      'INSERT INTO users (pseudo, email, password_hash, ecus) VALUES (?, ?, ?, 0)',
      [pseudo, email, passwordHash]
    );

    const insertedId = (insertResult as any).insertId?.toString?.() ?? null;
    if (!insertedId) {
      return res.status(500).json({ error: 'Impossible de créer le compte' });
    }

    // Lien de vérification de l'adresse (l'échec de l'envoi ne bloque pas l'inscription : renvoi possible du profil)
    const mailSent = await sendVerificationEmail(db, { id: insertedId, pseudo, email });

    const token = signToken({ userId: insertedId, pseudo, email, role: 'user' }, '7d');

    return res.status(201).json({
      message: 'Inscription réussie',
      token,
      user: {
        id: insertedId,
        pseudo,
        email,
        ecus: 0,
        role: 'user',
        linked: false,
        emailVerified: false,
        verificationSent: mailSent
      }
    });
  } catch (err) {
    console.error('[auth/register] error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

authRouter.post('/login', authWriteLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Champs invalides' });
  }

  try {
    const { pseudo, email, password, rememberMe } = parsed.data;
    const identifierPseudo = pseudo ? normalizePseudo(pseudo) : undefined;
    const identifierEmail = email ? normalizeEmail(email) : undefined;

    if (!identifierPseudo && !identifierEmail) {
      return res.status(400).json({ error: 'Pseudo ou email requis' });
    }

    if (!jwtConfigured()) {
      return res.status(500).json({ error: 'JWT non configuré côté serveur' });
    }

    const db = await getDbPool();

    const [rows] = await db.execute<UserRow[]>(
      `SELECT ${USER_COLUMNS}, password_hash, banned_reason FROM users WHERE ${identifierPseudo ? 'pseudo' : 'email'} = ? LIMIT 1`,
      [identifierPseudo ?? identifierEmail ?? '']
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    if (user.banned_at) {
      return res.status(403).json({
        error: 'Compte suspendu',
        reason: user.banned_reason || 'Non communiqué',
      });
    }

    await db.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    const json = userJson(user);
    const token = signToken({ userId: json.id, pseudo: json.pseudo, email: json.email, role: json.role }, rememberMe ? '30d' : '1d');

    return res.json({ message: 'Connexion réussie', token, user: json });
  } catch (err) {
    console.error('[auth/login] error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

authRouter.get('/me', authReadLimiter, authenticateToken, async (req, res) => {
  try {
    const db = await getDbPool();
    const [rows] = await db.execute<UserRow[]>(`SELECT ${USER_COLUMNS} FROM users WHERE id = ? LIMIT 1`, [req.user!.userId]);
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    return res.json(userJson(rows[0]));
  } catch (err) {
    console.error('[auth/me GET] error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Lien reçu par e-mail : /verifier-email?jeton=… sur le site, qui appelle cette route
authRouter.post('/verify-email', authWriteLimiter, async (req, res) => {
  const parsed = z.object({ token: z.string().regex(/^[0-9a-f]{64}$/) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Lien invalide' });
  try {
    const db = await getDbPool();
    const [rows] = await db.execute(
      'SELECT id, email_verify_expires < NOW() AS expired FROM users WHERE email_verify_hash = ? LIMIT 1',
      [hashToken(parsed.data.token)]
    );
    const user = Array.isArray(rows) ? (rows[0] as any) : null;
    if (!user) return res.status(400).json({ error: 'Lien invalide ou déjà utilisé' });
    if (Number(user.expired)) return res.status(410).json({ error: 'Lien expiré : demande-en un nouveau depuis ton profil' });
    await db.execute(
      'UPDATE users SET email_verified_at = NOW(), email_verify_hash = NULL, email_verify_expires = NULL WHERE id = ?',
      [user.id]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error('[auth/verify-email] error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Renvoyer le lien (profil), au plus une fois par minute
authRouter.post('/resend-verification', authWriteLimiter, authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const db = await getDbPool();
    const [rows] = await db.execute(
      `SELECT id, pseudo, email, email_verified_at, TIMESTAMPDIFF(SECOND, email_verify_sent_at, NOW()) AS since
         FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );
    const user = Array.isArray(rows) ? (rows[0] as any) : null;
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    if (user.email_verified_at) return res.json({ ok: true, alreadyVerified: true });
    if (user.since !== null && Number(user.since) < RESEND_SECONDS) {
      return res.status(429).json({ error: `Patiente encore ${RESEND_SECONDS - Number(user.since)} s avant un nouvel envoi` });
    }
    const sent = await sendVerificationEmail(db, { id: String(user.id), pseudo: user.pseudo, email: user.email });
    if (!sent) return res.status(502).json({ error: 'L\'e-mail n\'a pas pu partir, réessaie dans quelques minutes' });
    return res.json({ ok: true, email: user.email });
  } catch (err) {
    console.error('[auth/resend-verification] error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

authRouter.put('/me', authWriteLimiter, authenticateToken, async (req, res) => {
  const parsed = z
    .object({
      pseudo: pseudoSchema.optional(),
      email: emailSchema.optional()
    })
    .safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Champs invalides' });
  }

  try {
    const { userId, linked } = req.user!;
    const pseudo = parsed.data.pseudo ? normalizePseudo(parsed.data.pseudo) : undefined;
    const email = parsed.data.email ? normalizeEmail(parsed.data.email) : undefined;
    const db = await getDbPool();
    const [currentRows] = await db.execute<UserRow[]>(`SELECT ${USER_COLUMNS} FROM users WHERE id = ? LIMIT 1`, [userId]);
    const current = currentRows[0];
    if (!current) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    const pseudoChanged = pseudo !== undefined && pseudo !== current.pseudo;
    const emailChanged = email !== undefined && email !== current.email;
    if (!pseudoChanged && !emailChanged) return res.json(userJson(current));

    // Compte lié : le pseudo est celui du joueur en jeu, il suit le jeu (mis à jour au /lier), pas le site
    if (pseudoChanged && linked) {
      return res.status(409).json({ error: 'Ton compte est lié au jeu : ton pseudo est celui de Minecraft et ne se change pas ici.' });
    }
    if (pseudoChanged) {
      const [rows] = await db.execute<RowDataPacket[]>('SELECT id FROM users WHERE pseudo = ? AND id <> ? LIMIT 1', [pseudo, userId]);
      if (rows.length > 0) return res.status(409).json({ error: 'Pseudo déjà utilisé' });
    }
    if (emailChanged) {
      const [rows] = await db.execute<RowDataPacket[]>('SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1', [email, userId]);
      if (rows.length > 0) return res.status(409).json({ error: 'Email déjà utilisé' });
    }

    await db.execute(
      `UPDATE users SET pseudo = ?, email = ?${emailChanged ? ', email_verified_at = NULL' : ''} WHERE id = ?`,
      [pseudoChanged ? pseudo : current.pseudo, emailChanged ? email : current.email, userId]
    );
    // Nouvelle adresse : elle doit être confirmée à son tour
    if (emailChanged) {
      await sendVerificationEmail(db, { id: userId, pseudo: pseudoChanged ? pseudo! : current.pseudo, email: email! });
    }

    const [rows] = await db.execute<UserRow[]>(`SELECT ${USER_COLUMNS} FROM users WHERE id = ? LIMIT 1`, [userId]);
    return res.json(userJson(rows[0]!));
  } catch (err) {
    console.error('[auth/me PUT] error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Suppression du compte : le mot de passe est redemandé (un jeton volé ne suffit pas)
authRouter.delete('/me', authWriteLimiter, authenticateToken, async (req, res) => {
  const parsed = z.object({ password: z.string().min(1).max(128) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Mot de passe requis' });
  try {
    const db = await getDbPool();
    const [rows] = await db.execute<RowDataPacket[]>('SELECT password_hash FROM users WHERE id = ? LIMIT 1', [req.user!.userId]);
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    if (!(await bcrypt.compare(parsed.data.password, String(rows[0].password_hash)))) {
      return res.status(400).json({ error: 'Mot de passe incorrect' });
    }
    await db.execute('DELETE FROM users WHERE id = ?', [req.user!.userId]);
    return res.json({ message: 'Compte supprimé' });
  } catch (err) {
    console.error('[auth/me DELETE] error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

export { authRouter };
