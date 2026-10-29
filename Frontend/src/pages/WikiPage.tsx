import { Link } from 'react-router-dom';
import { Swords, Hammer, Coins, Sparkles, Fish, Book, Castle } from 'lucide-react';
import SEO from '../components/SEO';

const WIKI_SECTIONS = [
  {
    icon: Swords,
    title: "L'Appel des Nations",
    content: "Ta faction rejoint l'une des neuf nations, et tous ses membres profitent de son bonus permanent. Une nation accueille jusqu'à 10 factions.\n\nUne faction compte 15 membres au plus et peut avoir un seul allié, de n'importe quelle nation. Chaque membre apporte jusqu'à 10 de power (4 perdus par mort, 1 regagné toutes les 5 minutes) : une terre par point. Si ta faction a plus de terres que de power, les autres peuvent te les prendre (overclaim), sauf le cœur autour de ta bannière.\n\nFrancs : +4 % de dégâts\nAnglo-Saxons : +8 % de dégâts à l'arc\nVikings : +9 % de vitesse\nChine médiévale : Célérité I et vision nocturne\nBohémiens : -20 % de dégâts subis\nBretons : une potion d'invisibilité toutes les 48 h\nAragonais : +12 % de recul et résistance au feu\nTurcs seldjoukides : Chance IV et +8 % de dégâts critiques\nByzantins : -25 % de dégâts d'explosion",
  },
  {
    icon: Hammer,
    title: "L'Héritage de la Forge et des Champs",
    content: "Les métiers : bûcheron, chasseur, fermier, mineur et pêcheur, chacun jusqu'au niveau 100.\n\nLe bâton de vente revend le contenu d'un coffre d'un seul clic.\n\nLes armures de set : Farm (Vitesse II et vision nocturne), Combattant (Célérité II), Guerrier (+2 cœurs), Souverain (+2 cœurs et Célérité II).",
  },
  {
    icon: Castle,
    title: 'Les Sièges et le Trésor',
    content: "Ta bannière protège le cœur de ta base, ton Trésor rapporte des points chaque jour. Pour prendre une base, on déclare un siège 24 h à l'avance, on tient la bannière adverse, puis le vaincu paie une rançon ou se fait piller.",
    link: { to: '/wiki/sieges', label: 'Lire le guide des sièges' },
  },
  {
    icon: Coins,
    title: 'Le Commerce',
    content: "Vends et achète entre joueurs à l'Hôtel des Ventes (/ah), ou passe par la boutique du serveur (/shop). Le bâton de vente revend directement le contenu de tes coffres.",
  },
  {
    icon: Sparkles,
    title: 'Les Failles et le Chaos (bientôt)',
    content: "La Dimension Éphémère : une faille vers un lieu oublié, ses créatures et ses reliques.\n\nLes KOTH et l'arène FFA : se disputer une zone, ou survivre jusqu'au dernier.\n\nCes modes sont en préparation.",
  },
  {
    icon: Fish,
    title: 'Le Lien avec les Familiers (bientôt)',
    content: "Des poissons rares à pêcher pour nourrir des familiers qui combattent à tes côtés. En préparation.",
  },
  {
    icon: Book,
    title: 'Commandes utiles',
    content: '/menu - Tout le serveur en un menu\n/tuto - Le tutoriel et ses récompenses\n/creerfaction - Fonder une faction\n/f join <faction> - Rejoindre une faction\n/f home - Retour au QG\n/rangs - Monter de rang\n/siege aide - Les sièges expliqués\n/spawn - Retour au spawn',
  },
];

export default function WikiPage() {
  return (
    <div className="valoria-page-shell">
      <SEO
        title="Wiki"
        description="Wiki Valoria : les 9 nations et leurs bonus, les sièges et le Trésor, les métiers, les armures, le commerce et les commandes utiles."
        keywords="wiki, Valoria, Minecraft, guide, Chroniques"
        url="/wiki"
      />
      <section className="valoria-page-hero">
        <div className="valoria-page-container">
          <p className="valoria-page-kicker">Wiki</p>
          <h1 className="valoria-page-title">Wiki Valoria</h1>
          <p className="valoria-page-subtitle">Tout ce que tu dois savoir pour bien démarrer sur le serveur.</p>
        </div>
      </section>
      <section className="valoria-page-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {WIKI_SECTIONS.map((section) => (
              <article
                key={section.title}
                className="valoria-card p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#1e3a5f]/10 rounded-xl shrink-0">
                    <section.icon className="w-6 h-6 text-[#1e3a5f]" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl text-gray-900 mb-2">{section.title}</h2>
                    <p className="valoria-text-muted whitespace-pre-line">{section.content}</p>
                    {section.link && (
                      <Link to={section.link.to} className="inline-block mt-3 font-semibold text-[#1e3a5f] underline">
                        {section.link.label}
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
