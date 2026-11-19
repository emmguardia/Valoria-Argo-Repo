import { createPool } from 'mysql2/promise';
import type { Pool } from 'mysql2/promise';
import { env } from '../config/env.js';

// Promesse gardée : des appels simultanés au démarrage partagent le même pool (un seul initSchema)
let poolPromise: Promise<Pool> | null = null;

export function getDbPool(): Promise<Pool> {
  if (!env.DB_HOST || !env.DB_PORT || !env.DB_NAME || !env.DB_USER || !env.DB_PASSWORD) {
    return Promise.reject(new Error('DB env vars manquantes (DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD).'));
  }
  if (!poolPromise) {
    const pool = createPool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      connectionLimit: 4,
      waitForConnections: true,
      enableKeepAlive: true
    });
    poolPromise = initSchema(pool).then(() => pool, (error) => {
      poolPromise = null;
      void pool.end().catch(() => {});
      throw error;
    });
  }
  return poolPromise;
}

/** Arrêt du pod : ferme les connexions proprement. */
export async function closeDbPool() {
  const pending = poolPromise;
  poolPromise = null;
  if (pending) await (await pending.catch(() => null))?.end();
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

  // Classements publics de la page Classement, envoyés par le serveur Minecraft une fois par heure (une seule ligne)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS leaderboards (
      id TINYINT UNSIGNED NOT NULL,
      data JSON NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Votes vérifiés par l'IP du joueur : une IP ne vaut qu'un vote par site et par jour, même avec deux pseudos
  // envoyés en même temps (la contrainte tranche, pas seulement le contrôle préalable).
  // Un échec ici (doublons anciens) ne doit pas empêcher le site de démarrer : le contrôle applicatif reste en place.
  const ipSites = IP_CHECKED_VOTE_SITES.map((s) => `'${s}'`).join(', ');
  try {
    await db.execute(
      `ALTER TABLE votes ADD COLUMN IF NOT EXISTS ip_key VARCHAR(64)
         GENERATED ALWAYS AS (IF(site_name IN (${ipSites}), callback_ip, NULL)) STORED`);
    await db.execute('ALTER TABLE votes ADD UNIQUE KEY IF NOT EXISTS uniq_site_ip_day (site_name, ip_key, voted_day)');
  } catch (error) {
    console.error('[db] contrainte de vote par IP non posée :', error);
  }
}

// Sites de vote vérifiés par IP (voir services/voteSiteAdapters.ts)
export const IP_CHECKED_VOTE_SITES = ['serveursminecraft', 'liste-serveurs-minecraft'] as const;

