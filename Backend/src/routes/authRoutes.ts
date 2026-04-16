import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDbPool } from '../db/mysql.js';
import { env } from '../config/env.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

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

const pseudoSchema = z
  .string()
  .trim()
  .min(2)
  .max(32)
  .regex(/^[a-zA-Z0-9_]+$/);

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
  password: passwordSchema,
  rememberMe: z.boolean().optional().default(false)
});

function requireJwtPrivateKey() {
  if (!env.JWT_PRIVATE_KEY) throw new Error('JWT_PRIVATE_KEY non configurée');
  return env.JWT_PRIVATE_KEY;
}

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Champs invalides' });
  }

  try {
    if (!env.JWT_PRIVATE_KEY || !env.JWT_PUBLIC_KEY) {
      return res.status(500).json({ error: 'JWT non configuré côté serveur' });
    }

    const { pseudo, email, password } = parsed.data;
    const db = await getDbPool();

    const [existingPseudo] = await db.execute('SELECT id FROM users WHERE pseudo = ? LIMIT 1', [pseudo]);
    if (Array.isArray(existingPseudo) && existingPseudo.length > 0) {
      return res.status(409).json({ error: 'Pseudo déjà utilisé' });
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

    const token = jwt.sign(
      { userId: insertedId, pseudo, email },
      requireJwtPrivateKey(),
      { algorithm: 'RS256', expiresIn: '7d', issuer: env.JWT_ISSUER }
    );

    return res.status(201).json({
      message: 'Inscription réussie',
      token,
      user: {
        id: insertedId,
        pseudo,
        email,
        ecus: 0
      }
    });
  } catch (err) {
    console.error('[auth/register] error:', err);
    const msg = err instanceof Error ? err.message : 'Erreur serveur';
    return res.status(500).json({ error: msg });
  }
});

authRouter.post('/login', async (req, res) => {
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

    if (!env.JWT_PRIVATE_KEY || !env.JWT_PUBLIC_KEY) {
      return res.status(500).json({ error: 'JWT non configuré côté serveur' });
    }

    const db = await getDbPool();

    let rows: unknown;
    if (identifierPseudo) {
      const result = await db.execute(
        'SELECT id, pseudo, email, password_hash, ecus, created_at, last_login FROM users WHERE pseudo = ? LIMIT 1',
        [identifierPseudo]
      );
      rows = result[0];
    } else {
      const emailValue = identifierEmail!;
      const result = await db.execute(
        'SELECT id, pseudo, email, password_hash, ecus, created_at, last_login FROM users WHERE email = ? LIMIT 1',
        [emailValue]
      );
      rows = result[0];
    }

    const user = Array.isArray(rows) ? (rows[0] as any) : null;
    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    await db.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    const token = jwt.sign(
      { userId: String(user.id), pseudo: user.pseudo, email: user.email },
      requireJwtPrivateKey(),
      { algorithm: 'RS256', expiresIn: rememberMe ? '30d' : '1d', issuer: env.JWT_ISSUER }
    );

    return res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: String(user.id),
        pseudo: user.pseudo,
        email: user.email,
        ecus: user.ecus ?? 0,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });
  } catch (err) {
    console.error('[auth/login] error:', err);
    const msg = err instanceof Error ? err.message : 'Erreur serveur';
    return res.status(500).json({ error: msg });
  }
});

authRouter.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.userId as string | undefined;
    if (!userId) return res.status(401).json({ error: 'Token invalide' });

    const db = await getDbPool();
    const [rows] = await db.execute(
      'SELECT id, pseudo, email, ecus, created_at, last_login FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    const user = Array.isArray(rows) ? (rows[0] as any) : null;
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    return res.json({
      id: String(user.id),
      pseudo: user.pseudo,
      email: user.email,
      ecus: user.ecus ?? 0,
      createdAt: user.created_at,
      lastLogin: user.last_login
    });
  } catch (err) {
    console.error('[auth/me GET] error:', err);
    const msg = err instanceof Error ? err.message : 'Erreur serveur';
    return res.status(500).json({ error: msg });
  }
});

authRouter.put('/me', authenticateToken, async (req, res) => {
  const parsed = z
    .object({
      pseudo: pseudoSchema.optional(),
      email: emailSchema.optional()
    })
    .safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Champs invalides' });
  }

  try {
    const userId = (req as any).user?.userId as string | undefined;
    if (!userId) return res.status(401).json({ error: 'Token invalide' });

    const { pseudo, email } = parsed.data;
    const db = await getDbPool();

    const updateData: { pseudo?: string; email?: string } = {};
    if (pseudo) updateData.pseudo = normalizePseudo(pseudo);
    if (email) updateData.email = normalizeEmail(email);

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
    }

    if (updateData.pseudo) {
      const [rows] = await db.execute('SELECT id FROM users WHERE pseudo = ? AND id <> ? LIMIT 1', [
        updateData.pseudo,
        userId
      ]);
      if (Array.isArray(rows) && rows.length > 0) {
        return res.status(409).json({ error: 'Pseudo déjà utilisé' });
      }
    }

    if (updateData.email) {
      const [rows] = await db.execute('SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1', [updateData.email, userId]);
      if (Array.isArray(rows) && rows.length > 0) {
        return res.status(409).json({ error: 'Email déjà utilisé' });
      }
    }

    if (updateData.pseudo && updateData.email) {
      await db.execute('UPDATE users SET pseudo = ?, email = ? WHERE id = ?', [updateData.pseudo, updateData.email, userId]);
    } else if (updateData.pseudo) {
      await db.execute('UPDATE users SET pseudo = ? WHERE id = ?', [updateData.pseudo, userId]);
    } else if (updateData.email) {
      await db.execute('UPDATE users SET email = ? WHERE id = ?', [updateData.email, userId]);
    }

    const [rows] = await db.execute(
      'SELECT id, pseudo, email, ecus, created_at, last_login FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    const user = Array.isArray(rows) ? (rows[0] as any) : null;
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    return res.json({
      id: String(user.id),
      pseudo: user.pseudo,
      email: user.email,
      ecus: user.ecus ?? 0,
      createdAt: user.created_at,
      lastLogin: user.last_login
    });
  } catch (err) {
    console.error('[auth/me PUT] error:', err);
    const msg = err instanceof Error ? err.message : 'Erreur serveur';
    return res.status(500).json({ error: msg });
  }
});

authRouter.delete('/me', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.userId as string | undefined;
    if (!userId) return res.status(401).json({ error: 'Token invalide' });

    const db = await getDbPool();
    await db.execute('DELETE FROM users WHERE id = ?', [userId]);
    return res.json({ message: 'Compte supprimé' });
  } catch (err) {
    console.error('[auth/me DELETE] error:', err);
    const msg = err instanceof Error ? err.message : 'Erreur serveur';
    return res.status(500).json({ error: msg });
  }
});

export { authRouter };

