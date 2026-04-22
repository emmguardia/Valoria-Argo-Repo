-- Migration : sync des écus vers le scoreboard MC + claim manuel des récompenses items.
--
-- À jouer une seule fois sur la DB MariaDB prod.

-- 1. Nouvelle table dédiée au sync écus → scoreboard in-game.
CREATE TABLE IF NOT EXISTS ecus_sync_jobs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  mc_username VARCHAR(32) NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  next_attempt_at DATETIME NOT NULL,
  last_error TEXT NULL,
  synced_at DATETIME NULL,
  last_synced_value INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status_next (status, next_attempt_at),
  INDEX idx_user (user_id)
);

-- 2. Support du claim manuel sur reward_delivery_jobs (pour les items futurs).
ALTER TABLE reward_delivery_jobs
  MODIFY COLUMN status ENUM('pending', 'processing', 'completed', 'failed', 'dead', 'pending_claim') NOT NULL DEFAULT 'pending';

ALTER TABLE reward_delivery_jobs
  ADD COLUMN IF NOT EXISTS requires_manual_claim TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_attempts INT UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_attempts_reset_at DATETIME NULL;
