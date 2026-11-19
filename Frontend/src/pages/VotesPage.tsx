import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ExternalLink, RefreshCw } from 'lucide-react';
import SEO from '../components/SEO';
import { useUser } from '../context/UserContext';

interface SiteMeta {
  key: string;
  name: string;
  voteUrl: string | null;
  pseudoParam: string | null;
  enabled: boolean;
}

interface LeaderboardEntry {
  rank: number;
  mcUsername: string;
  totalVotes: number;
  lastVote: string;
}

interface UserVoteStats {
  totalVotesMonth: number;
  lastVote: string | null;
  todaySites: string[];
}

// Réponses de /api/votes/check/:site quand le vote n'est pas compté
const CHECK_MESSAGES: Record<string, string> = {
  not_voted: 'Vote introuvable pour ce pseudo. Vote d’abord, puis réessaie dans quelques secondes.',
  already_claimed: 'Ce vote a déjà été récompensé.',
  already_voted_today: 'Déjà récompensé aujourd’hui sur ce site.',
  ip_already_used: 'Un vote depuis ta connexion a déjà été récompensé aujourd’hui sur ce site.',
  site_disabled: 'Ce site n’est pas encore actif.',
};

const PSEUDO_KEY = 'valoria-vote-pseudo';
const PSEUDO_RE = /^[a-zA-Z0-9_]{2,16}$/;

function savedPseudo(): string {
  try { return localStorage.getItem(PSEUDO_KEY) ?? ''; } catch { return ''; }
}

// Podium affiché 2 - 1 - 3, comme sur une vraie estrade
const PODIUM_STYLE: Record<number, string> = {
  1: 'h-[6.5rem] bg-or text-encre text-[2.4rem] shadow-[0_4px_0_var(--color-or-fonce)]',
  2: 'h-[4.6rem] bg-brume-300 text-nuit-700 text-3xl shadow-[0_4px_0_var(--color-brume-600)]',
  3: 'h-14 bg-[#d9875a] text-cuir text-[1.6rem] shadow-[0_4px_0_var(--color-brique)]',
};

export default function VotesPage() {
  const { isLoggedIn, profile, token } = useUser();
  const [sites, setSites] = useState<SiteMeta[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  // Stats rattachées au token qui les a chargées : à la déconnexion (ou au
  // changement de compte) elles disparaissent sans setState dans l'effet.
  const [statsEntry, setStatsEntry] = useState<{ token: string; data: UserVoteStats } | null>(null);
  const stats = isLoggedIn && token && statsEntry?.token === token ? statsEntry.data : null;
  const [loading, setLoading] = useState(true);
  // Sans compte, le joueur saisit son pseudo Minecraft (gardé dans le navigateur)
  const [typedPseudo, setTypedPseudo] = useState(savedPseudo);
  const pseudo = isLoggedIn && profile ? profile.pseudo : typedPseudo.trim();
  const pseudoOk = PSEUDO_RE.test(pseudo);
  // Sites validés pendant cette visite, vérification en cours et dernier message par site
  const [validated, setValidated] = useState<string[]>([]);
  const [checking, setChecking] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, { ok: boolean; text: string }>>({});

  const changePseudo = (value: string) => {
    setTypedPseudo(value);
    try { localStorage.setItem(PSEUDO_KEY, value.trim()); } catch { /* stockage indisponible */ }
  };

  const voteLink = (site: SiteMeta) => {
    if (!site.voteUrl || !site.pseudoParam || !pseudoOk) return site.voteUrl ?? undefined;
    const url = new URL(site.voteUrl);
    url.searchParams.set(site.pseudoParam, pseudo);
    return url.toString();
  };

  const checkVote = async (site: SiteMeta) => {
    if (!pseudoOk) {
      setNotes((n) => ({ ...n, [site.key]: { ok: false, text: 'Indique d’abord ton pseudo Minecraft.' } }));
      return;
    }
    setChecking(site.key);
    try {
      const res = await fetch(`/api/votes/check/${site.key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ pseudo }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setValidated((v) => [...v, site.key]);
        setNotes((n) => ({ ...n, [site.key]: { ok: true, text: `Vote compté ! Récompense envoyée à ${pseudo} en jeu.` } }));
      } else {
        const text = CHECK_MESSAGES[data.reason] ?? data.error ?? 'Le site de vote ne répond pas, réessaie dans un instant.';
        setNotes((n) => ({ ...n, [site.key]: { ok: false, text } }));
      }
    } catch {
      setNotes((n) => ({ ...n, [site.key]: { ok: false, text: 'Connexion impossible, réessaie dans un instant.' } }));
    } finally {
      setChecking(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sitesRes, lbRes] = await Promise.all([
          fetch('/api/votes/sites').then((r) => r.json()),
          fetch('/api/votes/leaderboard/monthly').then((r) => r.json()),
        ]);
        if (cancelled) return;
        setSites(sitesRes.sites || []);
        setLeaderboard(lbRes.items || []);
      } catch {
        if (!cancelled) setSites([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/votes/me/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok) setStatsEntry({ token, data });
      } catch {
        // best-effort, on ignore les erreurs de stats perso
      }
    })();
    return () => { cancelled = true; };
  }, [isLoggedIn, token]);

  const todaySites = [...(stats?.todaySites ?? []), ...validated];
  const activeSites = sites.filter((s) => s.enabled && s.voteUrl);
  const doneToday = activeSites.filter((s) => todaySites.includes(s.key)).length;
  const progress = activeSites.length ? Math.round((doneToday / activeSites.length) * 100) : 0;
  const podium = [2, 1, 3]
    .map((rank) => leaderboard.find((e) => e.rank === rank))
    .filter((e): e is LeaderboardEntry => Boolean(e));
  const rest = leaderboard.filter((e) => e.rank > 3).slice(0, 7);

  return (
    <>
      <SEO title="Vote" description="Vote pour Valoria : une récompense en jeu par vote et une place au classement du mois." keywords="vote, Valoria, Minecraft" url="/votes" />

      <section className="bandeau-nuit-sombre -mt-24 px-5 pb-14 pt-36">
        <div className="mx-auto max-w-[75rem]">
          <p className="kicker">Vote</p>
          <h1 className="mt-2.5 text-[clamp(2.5rem,5.5vw,4.25rem)] leading-[1.02] text-white [text-shadow:0_4px_0_#0a1228,0_10px_30px_rgb(0_0_0/0.5)]">
            Fais résonner ta bannière
          </h1>
          <p className="mt-3.5 max-w-xl text-lg font-semibold leading-relaxed text-brume-200">
            Vote sur chaque site, puis clique sur « J’ai voté » : la récompense arrive en jeu et tu grimpes au classement du mois. Un vote récompensé par site et par jour.
          </p>
        </div>
      </section>

      <div className="mx-auto flex max-w-[75rem] flex-wrap items-start gap-7 px-5 pb-24 pt-5">
        <div className="flex min-w-0 flex-[999_1_35rem] flex-col gap-5">
          {/* Progression perso */}
          <div className="rounded-[1.375rem] border-2 border-or/40 bg-nuit-800 p-6 shadow-[0_6px_0_#091127]">
            {isLoggedIn && profile ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-brume-600">Tes votes du jour</p>
                    <p className="mt-1 font-display text-[2.1rem] text-white">
                      {activeSites.length > 0 && doneToday === activeSites.length
                        ? 'Tous faits, bravo !'
                        : `${doneToday} / ${activeSites.length} sites`}
                    </p>
                  </div>
                  {stats && (
                    <div className="text-right">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-brume-600">Ce mois-ci</p>
                      <p className="mt-1 font-display text-[2.1rem] text-or">
                        {stats.totalVotesMonth} vote{stats.totalVotesMonth > 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>
                <div
                  role="progressbar"
                  aria-label="Votes du jour"
                  aria-valuemin={0}
                  aria-valuemax={activeSites.length}
                  aria-valuenow={doneToday}
                  className="mt-4 h-[18px] overflow-hidden rounded-[10px] border-2 border-ciel/20 bg-nuit-900"
                >
                  <div className="h-full rounded-md bg-or transition-[width] duration-300" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-3.5 text-[15px] leading-relaxed text-brume-400">
                  Connecté en <strong className="text-white">{profile.pseudo}</strong>. Utilise exactement ce pseudo sur les sites de vote, sinon la récompense n'arrive pas.
                </p>
              </>
            ) : (
              <div className="flex flex-col gap-4">
                <label htmlFor="vote-pseudo" className="text-xs font-black uppercase tracking-[0.16em] text-brume-600">
                  Ton pseudo Minecraft
                </label>
                <input
                  id="vote-pseudo"
                  type="text"
                  autoComplete="nickname"
                  spellCheck={false}
                  maxLength={16}
                  value={typedPseudo}
                  onChange={(e) => changePseudo(e.target.value)}
                  placeholder="Pseudo exact, comme en jeu"
                  className="min-h-12 w-full max-w-sm rounded-xl border-2 border-ciel/25 bg-nuit-900 px-4 text-lg font-bold text-white placeholder-brume-600 outline-none focus:border-or"
                />
                <p className="max-w-md text-[15px] leading-relaxed text-brume-300">
                  Utilise le même pseudo sur les sites de vote.{' '}
                  <Link to="/connexion" className="font-extrabold text-or underline">Connecte-toi</Link> pour suivre tes votes du mois.
                </p>
              </div>
            )}
          </div>

          <h2 className="titre-section mt-3 text-[2.1rem]">Sites de vote</h2>

          {loading ? (
            <p className="font-bold text-brume-500">Chargement…</p>
          ) : sites.length === 0 ? (
            <p className="carte px-6 py-10 text-center font-bold text-brume-500">Aucun site de vote configuré pour le moment.</p>
          ) : (
            <ol className="flex flex-col gap-3.5">
              {sites.map((site, i) => {
                const votedToday = todaySites.includes(site.key);
                const available = site.enabled && site.voteUrl;
                return (
                  <li
                    key={site.key}
                    className={`flex flex-wrap items-center gap-4 rounded-[1.125rem] border-2 bg-nuit-800 px-4.5 py-4 ${
                      votedToday ? 'border-emerald-400/35' : 'border-ciel/14'
                    } ${available ? '' : 'opacity-60'}`}
                  >
                    <span className="flex h-13 w-13 flex-none items-center justify-center rounded-2xl bg-nuit-700 font-display text-[1.6rem] text-or">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[1.3rem] text-white">{site.name}</p>
                      <p className={`mt-0.5 text-sm font-extrabold ${votedToday ? 'text-emerald-300' : 'text-brume-600'}`}>
                        {votedToday ? 'Déjà voté aujourd’hui' : available ? '1 vote récompensé par jour' : 'Bientôt'}
                      </p>
                    </div>
                    {votedToday ? (
                      <span className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-400/14 px-4 font-black text-emerald-300">
                        <Check className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
                        Voté
                      </span>
                    ) : available ? (
                      <div className="flex flex-wrap gap-2.5">
                        <a
                          href={voteLink(site)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-3d btn-or min-h-12 px-5 text-lg"
                        >
                          Voter
                          <span className="sr-only"> sur {site.name} (nouvel onglet)</span>
                          <ExternalLink className="h-[18px] w-[18px]" strokeWidth={2.6} aria-hidden="true" />
                        </a>
                        <button
                          type="button"
                          onClick={() => checkVote(site)}
                          disabled={checking === site.key}
                          className="btn-3d btn-nuit min-h-12 px-5 text-lg"
                        >
                          <RefreshCw className={`h-[18px] w-[18px] ${checking === site.key ? 'animate-spin' : ''}`} strokeWidth={2.6} aria-hidden="true" />
                          J’ai voté
                        </button>
                      </div>
                    ) : null}
                    {notes[site.key] && (
                      <p role="status" className={`basis-full text-[15px] font-bold ${notes[site.key].ok ? 'text-emerald-300' : 'text-brume-300'}`}>
                        {notes[site.key].text}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Classement du mois */}
        <aside aria-labelledby="top-voteurs" className="carte min-w-0 flex-[1_1_20rem] p-6">
          <h2 id="top-voteurs" className="text-[1.625rem] text-white">Top voteurs du mois</h2>
          {leaderboard.length === 0 ? (
            <p className="mt-4 text-[15px] text-brume-500">Aucun vote ce mois-ci pour le moment. La première place est libre.</p>
          ) : (
            <>
              <ol className="mt-6 grid grid-cols-3 items-end gap-2 text-center">
                {podium.map((e) => (
                  <li key={e.mcUsername} className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-brume-100">{e.mcUsername}</p>
                    <p className="text-xs font-black text-or">{e.totalVotes} votes</p>
                    <div className={`mt-2 flex items-center justify-center rounded-t-xl rounded-b font-display ${PODIUM_STYLE[e.rank]}`}>
                      {e.rank}
                    </div>
                  </li>
                ))}
              </ol>
              {rest.length > 0 && (
                <ol className="mt-5 flex flex-col gap-1.5">
                  {rest.map((e) => (
                    <li key={e.mcUsername} className="flex min-h-11 items-center gap-3 rounded-xl bg-nuit-850 px-3">
                      <span className="w-7 font-display text-lg text-brume-600">{e.rank}</span>
                      <span className="min-w-0 flex-1 truncate text-[15px] font-extrabold text-brume-200">{e.mcUsername}</span>
                      <span className="text-[15px] font-black text-or">{e.totalVotes}</span>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
        </aside>
      </div>
    </>
  );
}
