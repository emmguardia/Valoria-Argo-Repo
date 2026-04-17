import { createPool } from 'mysql2/promise';
import type { Pool } from 'mysql2/promise';
import { env } from '../config/env.js';

let pool: Pool | null = null;

export async function getDbPool(): Promise<Pool> {
  if (!env.DB_HOST || !env.DB_PORT || !env.DB_NAME || !env.DB_USER || !env.DB_PASSWORD) {
    throw new Error('DB env vars manquantes (DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD).');
  }

  if (pool) return pool;

  pool = createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    connectionLimit: 4,
    waitForConnections: true,
    enableKeepAlive: true
  });

  await initSchema(pool);
  return pool;
}

async function initSchema(db: Pool) {
  // Table minimale pour l'inscription/connexion + solde Écus.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      pseudo VARCHAR(32) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      ecus INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP NULL DEFAULT NULL,
      updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_users_pseudo (pseudo),
      UNIQUE KEY uniq_users_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS stripe_ecus_payments (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      stripe_session_id VARCHAR(255) NOT NULL,
      user_id BIGINT UNSIGNED NOT NULL,
      mc_username VARCHAR(32) NOT NULL,
      reward_id VARCHAR(128) NOT NULL,
      ecus_amount INT NOT NULL,
      amount_cents INT NOT NULL,
      currency VARCHAR(16) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_stripe_session_id (stripe_session_id),
      KEY idx_stripe_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await db.execute(`ALTER TABLE stripe_ecus_payments ADD COLUMN IF NOT EXISTS mc_username VARCHAR(32) NOT NULL DEFAULT ''`);
  await db.execute(`ALTER TABLE stripe_ecus_payments ADD COLUMN IF NOT EXISTS reward_id VARCHAR(128) NOT NULL DEFAULT ''`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS reward_delivery_jobs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      stripe_session_id VARCHAR(255) NOT NULL,
      user_id BIGINT UNSIGNED NOT NULL,
      mc_username VARCHAR(32) NOT NULL,
      reward_id VARCHAR(128) NOT NULL,
      command_text VARCHAR(512) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      attempts INT NOT NULL DEFAULT 0,
      last_error TEXT NULL,
      next_attempt_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      delivered_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_reward_delivery_session (stripe_session_id),
      KEY idx_reward_delivery_status_next (status, next_attempt_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

