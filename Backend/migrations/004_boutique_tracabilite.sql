-- Migration : boutique réelle (achats en Écus livrés en jeu), file de commandes tirée par le serveur Minecraft,
-- traçabilité complète. Le backend crée aussi ces tables au démarrage (db/mysql.ts) ; ce fichier sert à les
-- jouer à la main sur la prod, après 003.
--
-- Rien n'est jamais supprimé ni réécrit dans les tables d'historique : en cas de panne du site ou du serveur
-- Minecraft, on retrouve qui a payé quoi, quand, et où en est la livraison. Le plugin garde aussi son propre
-- journal (plugins/ValoriaCore/boutique/) : les deux se recoupent par l'id de commande.

-- 1. Liaison du compte du site au joueur Minecraft (code donné sur le site, tapé en jeu avec /lier).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS mc_uuid CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS mc_linked_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS link_code VARCHAR(12) NULL,
  ADD COLUMN IF NOT EXISTS link_code_expires_at DATETIME NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_users_mc_uuid ON users (mc_uuid);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_users_link_code ON users (link_code);

-- 2. Produits : achat unique (grades) et montée en gamme (VIP -> VIP+ au prix de la différence).
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS one_time TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS upgrade_from VARCHAR(80) NULL;

-- 3. Registre des Écus : chaque mouvement, avec le solde après. Jamais modifié ni supprimé.
CREATE TABLE IF NOT EXISTS ecus_ledger (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  delta INT NOT NULL,
  balance_after INT NOT NULL,
  reason VARCHAR(40) NOT NULL,          -- paiement_stripe, achat_produit, ajustement_admin, remboursement
  origin VARCHAR(20) NOT NULL,          -- stripe, site, jeu, admin
  ref_type VARCHAR(40) NULL,            -- stripe_session, product_purchase, ecus_adjustment
  ref_id VARCHAR(255) NULL,
  detail VARCHAR(500) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_ledger_user (user_id, created_at),
  INDEX idx_ledger_ref (ref_type, ref_id)
);

-- 4. File des commandes pour le serveur Minecraft : le plugin vient les chercher (le site ne se connecte jamais
--    au serveur). Une commande « réservée » (sent) sans accusé avant lease_until est redonnée au tirage suivant ;
--    le plugin reconnaît les ids qu'il a déjà exécutés (son journal) et ne les rejoue pas.
CREATE TABLE IF NOT EXISTS server_commands (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  mc_uuid CHAR(36) NULL,
  mc_username VARCHAR(32) NULL,
  command_text VARCHAR(512) NOT NULL,
  require_online TINYINT(1) NOT NULL DEFAULT 1,
  source VARCHAR(40) NOT NULL,          -- achat_produit, vote, admin
  source_id VARCHAR(255) NULL,
  status ENUM('pending','sent','done','failed','cancelled') NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  lease_until TIMESTAMP(3) NULL,
  last_error VARCHAR(1000) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  sent_at TIMESTAMP(3) NULL,
  done_at TIMESTAMP(3) NULL,
  INDEX idx_cmd_status (status, id),
  INDEX idx_cmd_player (mc_uuid, status),
  INDEX idx_cmd_source (source, source_id)
);

-- 5. Historique de chaque commande : créée, envoyée, exécutée, échouée, reprise, annulée.
CREATE TABLE IF NOT EXISTS server_command_events (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  command_id BIGINT UNSIGNED NOT NULL,
  event VARCHAR(20) NOT NULL,
  detail VARCHAR(1000) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_cmd_events (command_id, id)
);

-- 6. Achats de produits (site ou jeu). request_id rend l'achat idempotent : un double clic ne paie pas deux fois.
CREATE TABLE IF NOT EXISTS product_purchases (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  request_id VARCHAR(64) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  mc_uuid CHAR(36) NOT NULL,
  mc_username VARCHAR(32) NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  product_slug VARCHAR(80) NOT NULL,
  product_name VARCHAR(120) NOT NULL,
  price_ecus INT UNSIGNED NOT NULL,
  origin ENUM('site','jeu') NOT NULL,
  server_command_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uniq_purchase_request (request_id),
  INDEX idx_purchase_user (user_id, created_at)
);

-- 7. Passages du serveur Minecraft (chaque tirage) : on sait quand il a parlé au site pour la dernière fois.
CREATE TABLE IF NOT EXISTS server_heartbeats (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  online_players INT NOT NULL,
  plugin_version VARCHAR(40) NULL,
  delivered INT NOT NULL DEFAULT 0,
  acked INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_heartbeat_time (created_at)
);

-- 8. Votes : la récompense passe par la file (queued = mise en file, numéro de commande dans rcon_error).
ALTER TABLE votes MODIFY rcon_status ENUM('pending','sent','failed','queued') NOT NULL DEFAULT 'pending';

-- 9. Produits du lancement. Commandes : {uuid} (toujours connu) et {joueur} (pseudo au moment de l'exécution).
--    ValoPass, box et clés restent inactifs tant que leur plugin ou leur objet n'existe pas.
INSERT IGNORE INTO products (slug, name, description, category, price_ecus, command_template, active, sort_order, one_time, upgrade_from) VALUES
  ('vip', 'VIP', 'Plus de homes et de ventes à l''HDV, /craft et /ec avant les rangs, badge et couleur du pseudo. À vie.', 'grades', 750, 'lp user {uuid} parent add vip', 1, 10, 1, NULL),
  ('vipplus', 'VIP+', 'Tout le VIP, en plus fort. Un VIP ne paie que la différence. À vie.', 'grades', 1650, 'lp user {uuid} parent add vipplus', 1, 20, 1, 'vip'),
  ('valopass', 'ValoPass premium', 'Les récompenses premium du pass de la saison.', 'avantages', 350, 'battlepass premium give {joueur}', 0, 30, 0, NULL),
  ('box-fragments', 'Box de fragments', 'Des fragments pour l''armure du Souverain.', 'kits', 150, 'nexo give fragment_souverain 1 {joueur}', 0, 40, 0, NULL),
  ('cle-caisse', 'Clé de caisse', 'Une clé pour une caisse du spawn.', 'kits', 150, 'crate key give {joueur} vip 1', 0, 50, 0, NULL);
