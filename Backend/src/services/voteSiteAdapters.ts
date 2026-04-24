import { env } from '../config/env.js';

export type VoteSiteKey = 'minecraft-serveur' | 'serveurs-minecraft' | 'top-serveurs' | 'minecraft-mp';

export interface VoteSiteMeta {
  key: VoteSiteKey;
  name: string;
  voteUrl: string | null;
  enabled: boolean;
}

export interface VoteValidationResult {
  ok: boolean;
  mcUsername?: string;
  reason?: string;
}

function sanitizeMcUsername(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const v = raw.trim();
  if (!/^[a-zA-Z0-9_]{2,32}$/.test(v)) return null;
  return v;
}

async function fetchJsonWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const text = await res.text();
    if (!res.ok) throw new Error(`http_${res.status}: ${text.slice(0, 200)}`);
    try { return JSON.parse(text); } catch { return { _raw: text }; }
  } finally {
    clearTimeout(timer);
  }
}

export function listSites(): VoteSiteMeta[] {
  return [
    {
      key: 'minecraft-serveur',
      name: 'Minecraft-Serveur.com',
      voteUrl: env.VOTE_MS_VOTE_URL ?? null,
      enabled: Boolean(env.VOTE_MS_API_KEY && env.VOTE_MS_SERVER_ID),
    },
    {
      key: 'serveurs-minecraft',
      name: 'Serveurs-Minecraft.org',
      voteUrl: env.VOTE_SM_VOTE_URL ?? null,
      enabled: Boolean(env.VOTE_SM_SERVER_IP),
    },
    {
      key: 'top-serveurs',
      name: 'Top-Serveurs.net',
      voteUrl: env.VOTE_TS_VOTE_URL ?? null,
      enabled: Boolean(env.VOTE_TS_API_KEY),
    },
    {
      key: 'minecraft-mp',
      name: 'Minecraft-MP.com',
      voteUrl: env.VOTE_MMP_VOTE_URL ?? null,
      enabled: Boolean(env.VOTE_MMP_API_KEY && env.VOTE_MMP_SERVER_ID),
    },
  ];
}

// ───────── Adapters ─────────
// Chaque adapter reçoit le payload brut du callback (body + query), récupère le pseudo,
// puis re-vérifie auprès de l'API officielle du site que le vote a bien eu lieu
// dans les dernières 24h. Ça empêche qu'un attaquant qui connaît l'URL callback
// fabrique de faux votes.

async function validateMinecraftServeur(input: VoteCallbackInput): Promise<VoteValidationResult> {
  if (!env.VOTE_MS_API_KEY || !env.VOTE_MS_SERVER_ID) {
    return { ok: false, reason: 'site_disabled' };
  }
  const pseudo = sanitizeMcUsername(input.payload.pseudo ?? input.payload.username ?? input.payload.player);
  if (!pseudo) return { ok: false, reason: 'invalid_pseudo' };

  try {
    // https://api.minecraft-serveur.com/v2/?object=servers&element=votes
    const url = `https://api.minecraft-serveur.com/v2/?object=servers&element=votes&key=${encodeURIComponent(env.VOTE_MS_API_KEY)}&pseudo=${encodeURIComponent(pseudo)}`;
    const data = await fetchJsonWithTimeout(url);
    // Documentation: retourne { status: 'ok', hasVoted: true } ou similaire.
    // On accepte plusieurs formes possibles car l'API varie selon version.
    const voted = Boolean(data?.hasVoted ?? data?.voted ?? (data?.status === 'ok' && data?.vote === 1));
    if (!voted) return { ok: false, reason: 'vote_not_confirmed' };
    return { ok: true, mcUsername: pseudo };
  } catch (e) {
    return { ok: false, reason: `api_error:${(e as Error).message}` };
  }
}

async function validateServeursMinecraft(input: VoteCallbackInput): Promise<VoteValidationResult> {
  if (!env.VOTE_SM_SERVER_IP) {
    return { ok: false, reason: 'site_disabled' };
  }
  const pseudo = sanitizeMcUsername(input.payload.pseudo ?? input.payload.username ?? input.payload.player);
  if (!pseudo) return { ok: false, reason: 'invalid_pseudo' };

  try {
    // https://serveurs-minecraft.org/sm_api/hasVoted.php?ip=<ip>&user=<pseudo>
    const url = `https://serveurs-minecraft.org/sm_api/hasVoted.php?ip=${encodeURIComponent(env.VOTE_SM_SERVER_IP)}&user=${encodeURIComponent(pseudo)}`;
    const data = await fetchJsonWithTimeout(url);
    // Retourne "1" ou 1 si voté dans les 24h, "0" sinon.
    const raw = data?._raw ?? String(data);
    const voted = raw === '1' || raw === 1 || raw?.trim?.() === '1';
    if (!voted) return { ok: false, reason: 'vote_not_confirmed' };
    return { ok: true, mcUsername: pseudo };
  } catch (e) {
    return { ok: false, reason: `api_error:${(e as Error).message}` };
  }
}

async function validateTopServeurs(input: VoteCallbackInput): Promise<VoteValidationResult> {
  if (!env.VOTE_TS_API_KEY) {
    return { ok: false, reason: 'site_disabled' };
  }
  // Top-Serveurs.net envoie généralement le pseudo dans le body + une signature.
  // On vérifie via leur API (votes récents).
  const pseudo = sanitizeMcUsername(input.payload.username ?? input.payload.pseudo ?? input.payload.player);
  if (!pseudo) return { ok: false, reason: 'invalid_pseudo' };

  try {
    const url = `https://api.top-serveurs.net/v1/servers/votes/username/${encodeURIComponent(pseudo)}`;
    const data = await fetchJsonWithTimeout(url, {
      headers: { Authorization: `Bearer ${env.VOTE_TS_API_KEY}` },
    });
    const voted = Boolean(data?.success && (data?.hasVoted ?? data?.data?.hasVoted));
    if (!voted) return { ok: false, reason: 'vote_not_confirmed' };
    return { ok: true, mcUsername: pseudo };
  } catch (e) {
    return { ok: false, reason: `api_error:${(e as Error).message}` };
  }
}

async function validateMinecraftMp(input: VoteCallbackInput): Promise<VoteValidationResult> {
  if (!env.VOTE_MMP_API_KEY || !env.VOTE_MMP_SERVER_ID) {
    return { ok: false, reason: 'site_disabled' };
  }
  // Minecraft-MP : callback avec username + custom, vérification via API.
  const pseudo = sanitizeMcUsername(input.payload.username ?? input.payload.pseudo ?? input.payload.player);
  if (!pseudo) return { ok: false, reason: 'invalid_pseudo' };

  try {
    const url = `https://minecraft-mp.com/api/?object=votes&element=claim&key=${encodeURIComponent(env.VOTE_MMP_API_KEY)}&username=${encodeURIComponent(pseudo)}`;
    const data = await fetchJsonWithTimeout(url);
    // Retourne "1" si voté et claimable, "0" sinon.
    const raw = data?._raw ?? String(data);
    const voted = raw === '1' || raw === 1 || raw?.trim?.() === '1';
    if (!voted) return { ok: false, reason: 'vote_not_confirmed' };
    return { ok: true, mcUsername: pseudo };
  } catch (e) {
    return { ok: false, reason: `api_error:${(e as Error).message}` };
  }
}

export interface VoteCallbackInput {
  payload: Record<string, any>;
  ip: string;
}

const VALIDATORS: Record<VoteSiteKey, (i: VoteCallbackInput) => Promise<VoteValidationResult>> = {
  'minecraft-serveur': validateMinecraftServeur,
  'serveurs-minecraft': validateServeursMinecraft,
  'top-serveurs': validateTopServeurs,
  'minecraft-mp': validateMinecraftMp,
};

export function isKnownSite(key: string): key is VoteSiteKey {
  return key in VALIDATORS;
}

export async function validateVoteCallback(site: VoteSiteKey, input: VoteCallbackInput): Promise<VoteValidationResult> {
  return VALIDATORS[site](input);
}
