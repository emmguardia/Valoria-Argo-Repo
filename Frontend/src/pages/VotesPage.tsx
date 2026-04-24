import { useEffect, useState } from 'react';
import { ExternalLink, Gift, Check, Medal } from 'lucide-react';
import SEO from '../components/SEO';
import { useUser } from '../context/UserContext';

interface SiteMeta {
  key: string;
  name: string;
  voteUrl: string | null;
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

export default function VotesPage() {
  const { isLoggedIn, profile, token } = useUser();
  const [sites, setSites] = useState<SiteMeta[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<UserVoteStats | null>(null);
  const [loading, setLoading] = useState(true);

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
    if (!isLoggedIn || !token) { setStats(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/votes/me/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok) setStats(data);
      } catch {
        // best-effort, on ignore les erreurs de stats perso
      }
    })();
    return () => { cancelled = true; };
  }, [isLoggedIn, token]);

  const todaySites = stats?.todaySites ?? [];

  return (
    <div className="valoria-page-shell">
      <SEO title="Vote" description="Vote pour Valoria et grimpe dans le classement mensuel." keywords="vote, Valoria, Minecraft" url="/votes" />
      <section className="valoria-page-hero">
        <div className="valoria-page-container">
          <p className="valoria-page-kicker">Vote</p>
          <h1 className="valoria-page-title">Vote pour Valoria</h1>
          <p className="valoria-page-subtitle">Chaque vote te donne une récompense in-game (/fvote) et te fait grimper dans le classement mensuel.</p>
        </div>
      </section>

      <section className="valoria-page-section">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="valoria-card p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-[#f59e0b]/20 rounded-xl">
                  <Gift className="w-8 h-8 text-[#f59e0b]" />
                </div>
                <div>
                  <h2 className="font-display text-xl text-gray-900">Comment ça marche</h2>
                  <p className="valoria-text-muted text-sm">Vote avec ton pseudo Minecraft (1 fois par jour par site).</p>
                </div>
              </div>
              {isLoggedIn && profile && (
                <div className="p-4 bg-amber-50 rounded-xl text-sm text-stone-700">
                  <strong>Connecté en {profile.pseudo}.</strong> Utilise ce pseudo exact sur les sites de vote, sinon la récompense ne sera pas attribuée.
                  {stats && (
                    <div className="mt-2 text-stone-600">
                      Ce mois-ci : <strong className="text-amber-700">{stats.totalVotesMonth}</strong> vote{stats.totalVotesMonth > 1 ? 's' : ''}.
                    </div>
                  )}
                </div>
              )}
            </div>

            <h2 className="font-display text-2xl text-gray-900">Sites de vote</h2>
            {loading ? (
              <p className="text-stone-500">Chargement…</p>
            ) : (
              <div className="space-y-3">
                {sites.map((site, i) => {
                  const votedToday = todaySites.includes(site.key);
                  return (
                    <a
                      key={site.key}
                      href={site.voteUrl ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-200 group ${
                        site.voteUrl
                          ? 'bg-white border-gray-100 hover:border-[#f59e0b]/40 hover:shadow-lg hover:shadow-amber-500/5'
                          : 'bg-stone-50 border-stone-200 opacity-60 cursor-not-allowed pointer-events-none'
                      }`}
                      onClick={(e) => { if (!site.voteUrl) e.preventDefault(); }}
                    >
                      <div className="flex items-center gap-4">
                        <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#1e3a5f] text-white font-bold">
                          {i + 1}
                        </span>
                        <div>
                          <span className="font-medium text-gray-900 group-hover:text-[#1e3a5f]">{site.name}</span>
                          <span className="block text-sm text-[#f59e0b] font-medium">
                            {votedToday ? 'Déjà voté aujourd\'hui' : site.enabled ? '1 vote / 24h' : 'Bientôt'}
                          </span>
                        </div>
                      </div>
                      {votedToday ? (
                        <Check className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-[#1e3a5f]" />
                      )}
                    </a>
                  );
                })}
                {sites.length === 0 && <p className="text-stone-500">Aucun site de vote configuré pour le moment.</p>}
              </div>
            )}
          </div>

          <aside className="valoria-card p-6 h-fit">
            <div className="flex items-center gap-3 mb-4">
              <Medal className="w-6 h-6 text-[#f59e0b]" />
              <h3 className="font-display text-lg text-gray-900">Top voteurs du mois</h3>
            </div>
            {leaderboard.length === 0 ? (
              <p className="text-sm text-stone-500">Aucun vote ce mois-ci pour le moment.</p>
            ) : (
              <ol className="space-y-2">
                {leaderboard.slice(0, 10).map((e) => (
                  <li key={e.mcUsername} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        e.rank === 1 ? 'bg-amber-400 text-stone-900' :
                        e.rank === 2 ? 'bg-stone-300 text-stone-900' :
                        e.rank === 3 ? 'bg-amber-700/70 text-white' :
                        'bg-stone-100 text-stone-600'
                      }`}>{e.rank}</span>
                      <span className="font-medium text-gray-800">{e.mcUsername}</span>
                    </span>
                    <span className="text-amber-700 font-semibold">{e.totalVotes}</span>
                  </li>
                ))}
              </ol>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
