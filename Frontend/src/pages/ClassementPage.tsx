import { Swords, Crown, Banknote, Briefcase, Target, Vote } from 'lucide-react';
import SEO from '../components/SEO';

const MOCK_PLAYERS = [
  { rank: 1, name: 'Herobrine42', kills: 1250, deaths: 320, kd: 3.91 },
  { rank: 2, name: 'DragonSlayer', kills: 980, deaths: 280, kd: 3.50 },
  { rank: 3, name: 'ShadowKing', kills: 890, deaths: 250, kd: 3.56 },
  { rank: 4, name: 'IronFist', kills: 756, deaths: 210, kd: 3.60 },
  { rank: 5, name: 'NetherLord', kills: 654, deaths: 195, kd: 3.35 },
  { rank: 6, name: 'DiamondPick', kills: 520, deaths: 180, kd: 2.89 },
  { rank: 7, name: 'CreeperHunt', kills: 445, deaths: 165, kd: 2.70 },
  { rank: 8, name: 'EndWalker', kills: 398, deaths: 142, kd: 2.80 },
  { rank: 9, name: 'RedstonePro', kills: 356, deaths: 138, kd: 2.58 },
  { rank: 10, name: 'VillageHero', kills: 312, deaths: 125, kd: 2.50 },
];

const MOCK_FACTIONS = [
  { rank: 1, name: 'Les Dragons', power: 15420, members: 12 },
  { rank: 2, name: 'Ordre du Nether', power: 12890, members: 10 },
  { rank: 3, name: 'Garde de Fer', power: 11200, members: 15 },
  { rank: 4, name: 'Conseil des Ombres', power: 9870, members: 8 },
  { rank: 5, name: 'Légion Dorée', power: 8450, members: 11 },
];

const MOCK_VOTES = [
  { rank: 1, name: 'VoteMaster', votes: 215 },
  { rank: 2, name: 'LoyalPlayer', votes: 188 },
  { rank: 3, name: 'DailyClick', votes: 172 },
  { rank: 4, name: 'Supporter', votes: 160 },
  { rank: 5, name: 'NightOwl', votes: 149 },
];

// Top Métier "tout confondu" :
// on regroupe tous les métiers par joueur et on additionne les niveaux.
const MOCK_PLAYER_JOBS = [
  { player: 'Herobrine42', job: 'Mineur', level: 92 },
  { player: 'Herobrine42', job: 'Forgeron', level: 77 },
  { player: 'DragonSlayer', job: 'Chasseur', level: 88 },
  { player: 'DragonSlayer', job: 'Bûcheron', level: 80 },
  { player: 'ShadowKing', job: 'Fermier', level: 84 },
  { player: 'ShadowKing', job: 'Pêcheur', level: 82 },
  { player: 'IronFist', job: 'Forgeron', level: 90 },
  { player: 'IronFist', job: 'Mineur', level: 71 },
  { player: 'NetherLord', job: 'Bûcheron', level: 83 },
  { player: 'NetherLord', job: 'Mineur', level: 69 },
  { player: 'CreeperHunt', job: 'Pêcheur', level: 80 },
  { player: 'CreeperHunt', job: 'Fermier', level: 66 },
];

export default function ClassementPage() {
  const topKills = [...MOCK_PLAYERS].sort((a, b) => b.kills - a.kills).slice(0, 5);
  const topFactions = MOCK_FACTIONS.slice(0, 5);
  const topVotes = MOCK_VOTES.slice(0, 5);
  const jobTotals = (() => {
    const totals = new Map<
      string,
      {
        name: string;
        totalLevel: number;
        jobs: Set<string>;
      }
    >();

    for (const entry of MOCK_PLAYER_JOBS) {
      const existing =
        totals.get(entry.player) ??
        ({
          name: entry.player,
          totalLevel: 0,
          jobs: new Set<string>(),
        } satisfies {
          name: string;
          totalLevel: number;
          jobs: Set<string>;
        });

      existing.totalLevel += entry.level;
      existing.jobs.add(entry.job);
      totals.set(entry.player, existing);
    }

    return [...totals.values()]
      .sort((a, b) => b.totalLevel - a.totalLevel)
      .slice(0, 5)
      .map((t, idx) => ({
        rank: idx + 1,
        name: t.name,
        jobs: [...t.jobs],
        totalLevel: t.totalLevel,
      }));
  })();

  return (
    <div className="min-h-screen bg-[#fefce8]">
      <SEO
        title="Classement"
        description="Classements PvP Valoria : top joueurs et factions. Cash prizes mensuels."
        keywords="classement, Valoria, PvP, top joueurs, factions"
        url="/classement"
      />
      <section className="relative py-20 bg-gradient-to-b from-[#1e3a5f] to-[#152a45] border-b border-[#f59e0b]/20">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="uppercase tracking-[0.35em] text-xs text-[#fbbf24]/90 font-medium">Classement</p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-white mt-2">
            Classements PvP
          </h1>
          <p className="text-white/80 max-w-2xl mt-4">
            Top des joueurs et des factions. Montre qui domine le serveur. Classement à points, reset mensuel.
          </p>
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
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Top Faction */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Crown className="w-6 h-6 text-[#f59e0b]" />
                <h2 className="text-2xl font-semibold text-gray-900">Top Factions</h2>
              </div>
              <div className="bg-white rounded-2xl shadow-lg shadow-slate-900/5 border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#1e3a5f] text-white">
                        <th className="px-6 py-4 text-left text-sm font-medium">#</th>
                        <th className="px-6 py-4 text-left text-sm font-medium">Faction</th>
                        <th className="px-6 py-4 text-right text-sm font-medium">Puissance</th>
                        <th className="px-6 py-4 text-right text-sm font-medium">Membres</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topFactions.map((f) => (
                        <tr key={f.rank} className="border-t border-gray-100 hover:bg-gray-50/50">
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                                f.rank === 1
                                  ? 'bg-[#f59e0b] text-white'
                                  : f.rank === 2
                                    ? 'bg-gray-300 text-gray-700'
                                    : f.rank === 3
                                      ? 'bg-amber-700/80 text-white'
                                      : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {f.rank}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">{f.name}</td>
                          <td className="px-6 py-4 text-right text-gray-600">{f.power.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right text-gray-600">{f.members}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Top Kill */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Target className="w-6 h-6 text-[#f59e0b]" />
                <h2 className="text-2xl font-semibold text-gray-900">Top Kill</h2>
              </div>
              <div className="bg-white rounded-2xl shadow-lg shadow-slate-900/5 border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#1e3a5f] text-white">
                        <th className="px-6 py-4 text-left text-sm font-medium">#</th>
                        <th className="px-6 py-4 text-left text-sm font-medium">Joueur</th>
                        <th className="px-6 py-4 text-right text-sm font-medium">Kills</th>
                        <th className="px-6 py-4 text-right text-sm font-medium">K/D</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topKills.map((p) => (
                        <tr key={p.rank} className="border-t border-gray-100 hover:bg-gray-50/50">
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                                p.rank === 1
                                  ? 'bg-[#f59e0b] text-white'
                                  : p.rank === 2
                                    ? 'bg-gray-300 text-gray-700'
                                    : p.rank === 3
                                      ? 'bg-amber-700/80 text-white'
                                      : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {p.rank}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                          <td className="px-6 py-4 text-right text-gray-600">{p.kills}</td>
                          <td className="px-6 py-4 text-right font-semibold text-[#1e3a5f]">{p.kd}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Top Vote */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Vote className="w-6 h-6 text-[#f59e0b]" />
                <h2 className="text-2xl font-semibold text-gray-900">Top Vote</h2>
              </div>
              <div className="bg-white rounded-2xl shadow-lg shadow-slate-900/5 border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#1e3a5f] text-white">
                        <th className="px-6 py-4 text-left text-sm font-medium">#</th>
                        <th className="px-6 py-4 text-left text-sm font-medium">Joueur</th>
                        <th className="px-6 py-4 text-right text-sm font-medium">Votes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topVotes.map((v) => (
                        <tr key={v.rank} className="border-t border-gray-100 hover:bg-gray-50/50">
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                                v.rank === 1
                                  ? 'bg-[#f59e0b] text-white'
                                  : v.rank === 2
                                    ? 'bg-gray-300 text-gray-700'
                                    : v.rank === 3
                                      ? 'bg-amber-700/80 text-white'
                                      : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {v.rank}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">{v.name}</td>
                          <td className="px-6 py-4 text-right text-gray-600">{v.votes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Top Métier */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Briefcase className="w-6 h-6 text-[#f59e0b]" />
                <h2 className="text-2xl font-semibold text-gray-900">Top Métier (tout confondu)</h2>
              </div>
              <div className="bg-white rounded-2xl shadow-lg shadow-slate-900/5 border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#1e3a5f] text-white">
                        <th className="px-6 py-4 text-left text-sm font-medium">#</th>
                        <th className="px-6 py-4 text-left text-sm font-medium">Joueur</th>
                        <th className="px-6 py-4 text-left text-sm font-medium">Métiers</th>
                        <th className="px-6 py-4 text-right text-sm font-medium">Niveau cumulé</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobTotals.map((j) => (
                        <tr key={j.rank} className="border-t border-gray-100 hover:bg-gray-50/50">
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                                j.rank === 1
                                  ? 'bg-[#f59e0b] text-white'
                                  : j.rank === 2
                                    ? 'bg-gray-300 text-gray-700'
                                    : j.rank === 3
                                      ? 'bg-amber-700/80 text-white'
                                      : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {j.rank}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">{j.name}</td>
                          <td className="px-6 py-4 text-gray-600">{j.jobs.join(', ')}</td>
                          <td className="px-6 py-4 text-right text-gray-600">{j.totalLevel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
