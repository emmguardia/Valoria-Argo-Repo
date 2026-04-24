-- Migration : système de votes (4 sites) + leaderboard mensuel.
--
-- À jouer une seule fois sur la DB MariaDB prod, après 002.

CREATE TABLE IF NOT EXISTS votes (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  mc_username VARCHAR(32) NOT NULL,
  site_name VARCHAR(32) NOT NULL,
  voted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  voted_day DATE GENERATED ALWAYS AS (DATE(voted_at)) STORED,
  callback_ip VARCHAR(64) NULL,
  raw_payload JSON NULL,
  rcon_status ENUM('pending','sent','failed') NOT NULL DEFAULT 'pending',
  rcon_error VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Anti-replay : un seul vote par site/joueur/jour.
  UNIQUE KEY uniq_site_user_day (site_name, mc_username, voted_day),
  INDEX idx_user_voted (user_id, voted_at),
  INDEX idx_site_voted (site_name, voted_at),
  INDEX idx_mc_voted (mc_username, voted_at)
);
