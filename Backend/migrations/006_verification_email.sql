-- Migration : vérification de l'adresse e-mail à l'inscription (lien envoyé par l'Email-Service, depuis
-- valoria@zenixweb.fr). Tant que l'adresse n'est pas confirmée, le compte fonctionne mais ne peut pas acheter d'Écus.
-- Seule l'empreinte SHA-256 du lien est gardée.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS email_verify_hash CHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS email_verify_expires DATETIME NULL,
  ADD COLUMN IF NOT EXISTS email_verify_sent_at DATETIME NULL,
  ADD INDEX IF NOT EXISTS idx_users_email_verify (email_verify_hash);

-- Comptes créés avant la vérification (staff) : considérés comme vérifiés
UPDATE users SET email_verified_at = created_at WHERE email_verified_at IS NULL AND created_at < '2026-11-14';
