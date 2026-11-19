import { useEffect, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { Crown, Banknote, Briefcase, Target, Vote } from 'lucide-react';
import SEO from '../components/SEO';

type Rank = { rank: number; name: string; value: number };

const RANK_STYLE: Record<number, string> = {
  1: 'bg-[#f59e0b] text-white',
  2: 'bg-gray-300 text-gray-700',
  3: 'bg-amber-700/80 text-white',
};

/** Un classement : titre, colonne de valeur, lignes (ou message d'attente tant qu'il n'y a pas de données réelles). */
function Board({ icon: Icon, title, valueLabel, rows, empty }: {
  icon: ComponentType<{ className?: string }>; title: string; valueLabel: string; rows: Rank[] | null; empty: ReactNode;
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
                  <th className="px-6 py-4 text-left text-sm font-medium">Joueur</th>
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

  // Factions, kills et métiers : pas encore remontés du serveur, aucun faux classement n'est affiché
  const soon = 'Classement affiché dès l’ouverture de la saison.';

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
            <Board icon={Crown} title="Top Factions" valueLabel="Puissance" rows={null} empty={soon} />
            <Board icon={Target} title="Top Kill" valueLabel="Kills" rows={null} empty={soon} />
            <Board
              icon={Vote}
              title="Top Vote du mois"
              valueLabel="Votes"
              rows={topVotes}
              empty={topVotes === null ? 'Chargement…' : 'Aucun vote ce mois-ci pour le moment : la première place est libre.'}
            />
            <Board icon={Briefcase} title="Top Métier (tout confondu)" valueLabel="Niveau cumulé" rows={null} empty={soon} />
          </div>
        </div>
      </section>
    </div>
  );
}
