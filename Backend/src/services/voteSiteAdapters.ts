import { env } from '../config/env.js';

export type VoteSiteKey = 'serveur-prive' | 'top-serveurs' | 'serveursminecraft' | 'liste-serveurs-minecraft';

export interface VoteSiteMeta {
  key: VoteSiteKey;
  name: string;
  voteUrl: string | null;
  // Paramètre d'URL qui pré-remplit le pseudo sur la page de vote du site (null si le site n'en a pas)
  pseudoParam: string | null;
  enabled: boolean;
}

export interface VoteCheckInput {
  mcUsername: string;
  ip: string;
}

export interface VoteValidationResult {
  ok: boolean;
  reason?: string;
}

// Aucun site de vote ne prévient Valoria quand quelqu'un vote : c'est le joueur qui demande la vérification
// (« J'ai voté ») et le backend interroge l'API officielle du site, par pseudo ou par l'IP du joueur.

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<{ status: number; text: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    return { status: res.status, text: (await res.text()).trim() };
  } finally {
    clearTimeout(timer);
  }
}

function parseJson(text: string): any {
  try { return JSON.parse(text); } catch { return null; }
}

export function listSites(): VoteSiteMeta[] {
  return [
    {
      key: 'serveur-prive',
      name: 'Serveur-Privé.net',
      voteUrl: env.VOTE_SP_VOTE_URL ?? null,
      pseudoParam: null,
      enabled: Boolean(env.VOTE_SP_TOKEN),
    },
    {
      key: 'top-serveurs',
      name: 'Top-Serveurs.net',
      voteUrl: env.VOTE_TS_VOTE_URL ?? null,
      pseudoParam: 'pseudo',
      enabled: Boolean(env.VOTE_TS_TOKEN),
    },
    {
      key: 'serveursminecraft',
      name: 'ServeursMinecraft.org',
      voteUrl: env.VOTE_SMO_VOTE_URL ?? null,
      pseudoParam: null,
      enabled: Boolean(env.VOTE_SMO_SERVER_ID),
    },
    {
      key: 'liste-serveurs-minecraft',
      name: 'Liste-Serveurs-Minecraft.org',
      voteUrl: env.VOTE_LSM_VOTE_URL ?? null,
      pseudoParam: null,
      enabled: Boolean(env.VOTE_LSM_SERVER_ID),
    },
  ];
}

// Serveur-Privé : vote récent par pseudo (le site oblige à saisir un pseudo pour voter). 404 si pas de vote.
async function checkServeurPrive({ mcUsername }: VoteCheckInput): Promise<VoteValidationResult> {
  const url = `https://serveur-prive.net/api/v1/servers/${encodeURIComponent(env.VOTE_SP_TOKEN!)}/votes/${encodeURIComponent(mcUsername)}?type=username`;
  const { text } = await fetchWithTimeout(url);
  return parseJson(text)?.success === true ? { ok: true } : { ok: false, reason: 'not_voted' };
}

// Top-Serveurs : « claim » par pseudo, vote des 2 dernières heures. 1 = réclamable, 2 = déjà réclamé, 0 = introuvable.
// Le claim marque le vote côté Top-Serveurs : il ne peut pas être récompensé deux fois.
async function checkTopServeurs({ mcUsername }: VoteCheckInput): Promise<VoteValidationResult> {
  const url = `https://api.top-serveurs.net/v1/votes/claim-username?server_token=${encodeURIComponent(env.VOTE_TS_TOKEN!)}&playername=${encodeURIComponent(mcUsername)}`;
  const { text } = await fetchWithTimeout(url);
  const claimed = parseJson(text)?.claimed;
  if (claimed === 1) return { ok: true };
  return { ok: false, reason: claimed === 2 ? 'already_claimed' : 'not_voted' };
}

// ServeursMinecraft.org : par IP, « true » tant que l'IP peut encore voter, autre chose une fois qu'elle a voté.
async function checkServeursMinecraft({ ip }: VoteCheckInput): Promise<VoteValidationResult> {
  if (!ip) return { ok: false, reason: 'no_ip' };
  const url = `https://www.serveursminecraft.org/sm_api/peutVoter.php?id=${encodeURIComponent(env.VOTE_SMO_SERVER_ID!)}&ip=${encodeURIComponent(ip)}`;
  const { status, text } = await fetchWithTimeout(url);
  // Une page d'erreur ne doit pas passer pour un vote
  const answered = status === 200 && text !== '' && text.length < 64 && !text.includes('<');
  return answered && text !== 'true' ? { ok: true } : { ok: false, reason: 'not_voted' };
}

// Liste-Serveurs-Minecraft.org : par IP, « 1 » si l'IP a voté dans les 5 dernières minutes.
async function checkListeServeursMinecraft({ ip }: VoteCheckInput): Promise<VoteValidationResult> {
  if (!ip) return { ok: false, reason: 'no_ip' };
  const url = `https://api.liste-serveurs-minecraft.org/vote/vote_verification.php?server_id=${encodeURIComponent(env.VOTE_LSM_SERVER_ID!)}&ip=${encodeURIComponent(ip)}&duration=5`;
  const { text } = await fetchWithTimeout(url);
  return text === '1' ? { ok: true } : { ok: false, reason: 'not_voted' };
}

const CHECKERS: Record<VoteSiteKey, (i: VoteCheckInput) => Promise<VoteValidationResult>> = {
  'serveur-prive': checkServeurPrive,
  'top-serveurs': checkTopServeurs,
  'serveursminecraft': checkServeursMinecraft,
  'liste-serveurs-minecraft': checkListeServeursMinecraft,
};

// Sites vérifiés par l'IP du joueur : une même IP ne peut valoir qu'un vote par jour, quel que soit le pseudo.
export const IP_CHECKED_SITES: ReadonlySet<VoteSiteKey> = new Set(['serveursminecraft', 'liste-serveurs-minecraft']);

export function isKnownSite(key: string): key is VoteSiteKey {
  return key in CHECKERS;
}

export async function checkVote(site: VoteSiteKey, input: VoteCheckInput): Promise<VoteValidationResult> {
  if (!listSites().find((s) => s.key === site)?.enabled) {
    return { ok: false, reason: 'site_disabled' };
  }
  try {
    return await CHECKERS[site](input);
  } catch (e) {
    return { ok: false, reason: `api_error:${(e as Error).message}` };
  }
}
