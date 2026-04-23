-- Migration : admin panel (roles, bans, products, audit écus).
--
-- À jouer une seule fois sur la DB MariaDB prod, après 001.

-- 1. Rôles + bans sur users.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role ENUM('user','admin') NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS banned_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS banned_reason VARCHAR(500) NULL;

-- 2. Table produits (items boutique achetés en écus, livrés in-game via RCON).
CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  slug VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  category ENUM('cosmetiques','avantages','kits','grades') NOT NULL,
  price_ecus INT UNSIGNED NOT NULL,
  image_url VARCHAR(500) NULL,
  command_template VARCHAR(500) NOT NULL,
  is_new TINYINT(1) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category_active (category, active),
  INDEX idx_sort (sort_order, id)
);

-- 3. Audit trail des ajustements manuels d'écus par un admin.
CREATE TABLE IF NOT EXISTS ecus_adjustments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  admin_id BIGINT UNSIGNED NOT NULL,
  delta INT NOT NULL,
  reason VARCHAR(500) NOT NULL,
  balance_after INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_admin (admin_id),
  INDEX idx_created (created_at)
);

-- 4. Premier admin (à modifier selon ton pseudo avant exécution si tu veux).
-- UPDATE users SET role = 'admin' WHERE pseudo = 'kirua69';
