import { ExternalLink, Gift } from 'lucide-react';
import SEO from '../components/SEO';

const VOTE_SITES = [
  { name: 'Minecraft-Serveur.com', url: 'https://www.minecraft-serveur.com/', reward: '1 vote' },
  { name: 'Serveurs-Minecraft.org', url: 'https://www.serveurs-minecraft.org/', reward: '1 vote' },
  { name: 'Top-Serveurs.net', url: 'https://www.top-serveurs.net/', reward: '1 vote' },
  { name: 'Minecraft-MP.com', url: 'https://www.minecraft-mp.com/', reward: '1 vote' },
];

export default function VotesPage() {
  return (
    <div className="min-h-screen bg-[#fefce8]">
      <SEO
        title="Vote"
        description="Vote pour Valoria et soutiens le serveur sur les sites listés."
        keywords="vote, Valoria, Minecraft"
        url="/votes"
      />
      <section className="relative py-20 bg-gradient-to-b from-[#1e3a5f] to-[#152a45] border-b border-[#f59e0b]/20">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="uppercase tracking-[0.35em] text-xs text-[#fbbf24]/90 font-medium">Vote</p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-white mt-2">
            Vote pour Valoria
          </h1>
          <p className="text-white/80 max-w-2xl mt-4">
            Chaque vote compte ! Soutiens le serveur en votant sur les sites listés.
          </p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-900/5 border border-gray-100 p-8 mb-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-[#f59e0b]/20 rounded-xl">
                <Gift className="w-8 h-8 text-[#f59e0b]" />
              </div>
              <div>
                <h2 className="font-display text-xl text-gray-900">Récompenses</h2>
                <p className="text-gray-600 text-sm">Vote sur chaque site (1 vote = 1 vote).</p>
              </div>
            </div>
            <p className="text-gray-600">
              Connecte-toi avec ton pseudo Minecraft, vote sur les sites ci-dessous, et ton vote sera comptabilisé automatiquement.
              Le vote est distinct des Écus (monnaie de la boutique).
            </p>
          </div>
          <h2 className="font-display text-2xl text-gray-900 mb-6">Sites de vote</h2>
          <div className="space-y-3">
            {VOTE_SITES.map((site, index) => (
              <a
                key={site.name}
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-100 hover:border-[#f59e0b]/40 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-200 group"
              >
                <div className="flex items-center gap-4">
                  <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#1e3a5f] text-white font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <span className="font-medium text-gray-900 group-hover:text-[#1e3a5f]">{site.name}</span>
                    <span className="block text-sm text-[#f59e0b] font-medium">{site.reward}</span>
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-[#1e3a5f]" />
              </a>
            ))}
          </div>
          <p className="mt-8 text-center text-gray-500 text-sm">
            Tu peux voter une fois par jour sur chaque site.
          </p>
        </div>
      </section>
    </div>
  );
}
