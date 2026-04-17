import { Rcon } from 'rcon-client';
import { env } from '../config/env.js';

function requireRconConfig() {
  if (!env.RCON_HOST || !env.RCON_PORT || !env.RCON_PASSWORD) {
    throw new Error('RCON non configuré (RCON_HOST/RCON_PORT/RCON_PASSWORD)');
  }
  return {
    host: env.RCON_HOST,
    port: env.RCON_PORT,
    password: env.RCON_PASSWORD,
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
