import { Rcon } from 'rcon-client';
import { createHash } from 'node:crypto';
import { env } from '../config/env.js';

function requireRconConfig() {
  if (!env.RCON_HOST || !env.RCON_PORT || !env.RCON_PASSWORD) {
    throw new Error('RCON non configuré (RCON_HOST/RCON_PORT/RCON_PASSWORD)');
  }
  return {
    host: env.RCON_HOST.trim(),
    port: env.RCON_PORT,
    password: env.RCON_PASSWORD.trim(),
    timeoutMs: env.RCON_TIMEOUT_MS,
  };
}

export function getRconRuntimeFingerprint() {
  if (!env.RCON_PASSWORD) return { configured: false };
  const pwd = env.RCON_PASSWORD.trim();
  return {
    configured: true,
    host: (env.RCON_HOST || '').trim(),
    port: env.RCON_PORT,
    passwordLength: pwd.length,
    passwordSha256_12: createHash('sha256').update(pwd).digest('hex').slice(0, 12),
    timeoutMs: env.RCON_TIMEOUT_MS,
  };
}

export type RconSend = (command: string) => Promise<string>;

/**
 * Une seule connexion RCON pour plusieurs commandes (recommandé côté Minecraft).
 */
export async function withRcon<T>(fn: (send: RconSend) => Promise<T>): Promise<T> {
  const cfg = requireRconConfig();
  let client: Rcon | undefined;
  try {
    client = await Rcon.connect({
      host: cfg.host,
      port: cfg.port,
      password: cfg.password,
      timeout: cfg.timeoutMs,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`RCON connexion échouée vers ${cfg.host}:${cfg.port}: ${msg}`);
  }
  try {
    return await fn((cmd) => client!.send(cmd));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`RCON ${cfg.host}:${cfg.port}: ${msg}`);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

export async function sendRconCommand(command: string): Promise<string> {
  return withRcon((send) => send(command));
}
