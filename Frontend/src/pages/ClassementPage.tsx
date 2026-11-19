import { useEffect, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { Crown, Banknote, Briefcase, Target, Vote } from 'lucide-react';
import SEO from '../components/SEO';

/** Une ligne : rang, nom, valeur principale, et une colonne en plus (membres, K/D, métiers). */
type Rank = { rank: number; name: string; value: number; extra?: string };

type Rankings = {
  factions: { name: string; score: number; members: number }[];
  kills: { name: string; kills: number; deaths: number }[];
  metiers: { name: string; total: number; jobs: string[] }[];
  updatedAt: string | null;
};

const RANK_STYLE: Record<number, string> = {
  1: 'bg-[#f59e0b] text-white',
  2: 'bg-gray-300 text-gray-700',
  3: 'bg-amber-700/80 text-white',
};

/** Un classement : titre, colonne de valeur, lignes (ou message d'attente tant qu'il n'y a pas de données réelles). */
function Board({ icon: Icon, title, nameLabel = 'Joueur', valueLabel, extraLabel, rows, empty }: {
  icon: ComponentType<{ className?: string }>; title: string; nameLabel?: string; valueLabel: string; extraLabel?: string;
  rows: Rank[] | null; empty: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Icon className="w-6 h-6 text-[#f59e0b]" />
        <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="valoria-card overflow-hidden">
        {rows && rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#1e3a5f] text-white">
                  <th className="px-6 py-4 text-left text-sm font-medium">#</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">{nameLabel}</th>
                  {extraLabel && <th className="px-6 py-4 text-left text-sm font-medium">{extraLabel}</th>}
                  <th className="px-6 py-4 text-right text-sm font-medium">{valueLabel}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.name} className="border-t border-gray-100 hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${RANK_STYLE[r.rank] ?? 'bg-gray-100 text-gray-600'}`}>
                        {r.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{r.name}</td>
                    {extraLabel && <td className="px-6 py-4 text-gray-600">{r.extra}</td>}
                    <td className="px-6 py-4 text-right text-gray-600">{r.value.toLocaleString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-6 py-10 text-center text-gray-500">{empty}</p>
        )}
      </div>
    </div>
  );
}

export default function ClassementPage() {
  // Top vote : vrai classement du mois (votes vérifiés par le site). null = chargement.
  const [topVotes, setTopVotes] = useState<Rank[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/votes/leaderboard/monthly')
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data) => {
        if (cancelled) return;
        const items = Array.isArray(data?.items) ? data.items : [];
        setTopVotes(items.slice(0, 5).map((e: { rank: number; mcUsername: string; totalVotes: number }) => ({
          rank: Number(e.rank), name: String(e.mcUsername), value: Number(e.totalVotes),
        })));
      })
      .catch(() => { if (!cancelled) setTopVotes([]); });
    return () => { cancelled = true; };
  }, []);

  // Factions, kills et métiers : envoyés par le serveur Minecraft une fois par heure. null = chargement.
  const [rankings, setRankings] = useState<Rankings | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/classements')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (!cancelled) setRankings(data ?? { factions: [], kills: [], metiers: [], updatedAt: null }); })
      .catch(() => { if (!cancelled) setRankings({ factions: [], kills: [], metiers: [], updatedAt: null }); });
    return () => { cancelled = true; };
  }, []);

  const top = <T,>(list: T[] | undefined, row: (item: T, rank: number) => Rank) =>
    rankings === null ? null : (list ?? []).slice(0, 5).map((item, i) => row(item, i + 1));
  const factions = top(rankings?.factions, (f, rank) => ({
    rank, name: f.name, value: f.score, extra: `${f.members} membre${f.members > 1 ? 's' : ''}`,
  }));
  const kills = top(rankings?.kills, (k, rank) => ({
    rank, name: k.name, value: k.kills, extra: `K/D ${(k.kills / Math.max(1, k.deaths)).toFixed(2)}`,
  }));
  const jobs = top(rankings?.metiers, (j, rank) => ({ rank, name: j.name, value: j.total, extra: j.jobs.join(', ') }));
  const waiting = rankings === null ? 'Chargement…' : 'Pas encore de classement : il se met à jour toutes les heures.';
  const updated = rankings?.updatedAt
    ? new Date(rankings.updatedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
    : null;

  return (
    <div className="valoria-page-shell">
      <SEO
        title="Classement"
        description="Classements PvP Valoria : top joueurs et factions. Cash prizes mensuels."
        keywords="classement, Valoria, PvP, top joueurs, factions"
        url="/classement"
      />
      <section className="valoria-page-hero">
        <div className="valoria-page-container">
          <p className="valoria-page-kicker">Classement</p>
          <h1 className="valoria-page-title">Classements PvP</h1>
          <p className="valoria-page-subtitle">Top des joueurs et des factions. Montre qui domine le serveur. Classement à points, reset mensuel.</p>
          <div className="mt-10 p-6 sm:p-8 rounded-2xl bg-white/10 backdrop-blur-sm border border-[#f59e0b]/30">
            <div className="flex items-center gap-2 mb-4">
              <Banknote className="w-6 h-6 text-[#fbbf24]" />
              <h2 className="text-xl sm:text-2xl font-bold text-white">Cash prizes</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-white/95">
              <div>
                <p className="text-[#fbbf24] font-semibold mb-2 text-sm uppercase tracking-wider">Meilleure faction</p>
                <ul className="space-y-1">
                  <li><span className="font-bold text-[#fbbf24]">Top 1</span> — 20€</li>
                  <li><span className="font-bold text-gray-300">Top 2</span> — 10€</li>
                  <li><span className="font-bold text-amber-700/90">Top 3</span> — 5€</li>
                </ul>
              </div>
              <div>
                <p className="text-[#fbbf24] font-semibold mb-2 text-sm uppercase tracking-wider">Tops individuels (5€ chacun)</p>
                <ul className="space-y-1 flex flex-wrap gap-x-4 gap-y-1">
                  <li className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> Top métier</li>
                  <li className="flex items-center gap-1.5"><Target className="w-4 h-4" /> Top kill</li>
                  <li className="flex items-center gap-1.5"><Vote className="w-4 h-4" /> Top vote</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="valoria-page-section">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <Board icon={Crown} title="Top Factions" nameLabel="Faction" valueLabel="Score de saison" extraLabel="Membres"
              rows={factions} empty={waiting} />
            <Board icon={Target} title="Top Kill de la saison" valueLabel="Kills" extraLabel="K/D" rows={kills} empty={waiting} />
            <Board
              icon={Vote}
              title="Top Vote du mois"
              valueLabel="Votes"
              rows={topVotes}
              empty={topVotes === null ? 'Chargement…' : 'Aucun vote ce mois-ci pour le moment : la première place est libre.'}
            />
            <Board icon={Briefcase} title="Top Métier (tout confondu)" valueLabel="Niveau cumulé" extraLabel="Meilleurs métiers"
              rows={jobs} empty={waiting} />
          </div>
          {updated && <p className="mt-8 text-center text-sm text-gray-500">Classements du serveur mis à jour le {updated} (toutes les heures).</p>}
        </div>
      </section>
    </div>
  );
}
