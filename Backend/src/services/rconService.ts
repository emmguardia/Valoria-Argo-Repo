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
  };
}

export async function sendRconCommand(command: string): Promise<string> {
  const cfg = requireRconConfig();
  const client = await Rcon.connect({
    host: cfg.host,
    port: cfg.port,
    password: cfg.password,
  });
  try {
    return await client.send(command);
  } finally {
    client.end();
  }
}
