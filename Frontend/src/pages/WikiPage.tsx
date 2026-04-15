import { Swords, Hammer, Coins, Sparkles, Fish, Book } from 'lucide-react';
import SEO from '../components/SEO';

const WIKI_SECTIONS = [
  {
    icon: Swords,
    title: "L'Appel des Nations",
    content: "Le continent n'appartient à personne, mais tous se battent pour l'arracher à l'oubli. Valoria est régie par un équilibre fragile : neuf lignées dominantes, capables d'accueillir chacune les plus puissantes factions de guerriers. Votre but : fonder votre village, protéger vos frontières et grimper les échelons pour que le nom de votre bannière résonne lors du jugement mensuel des vainqueurs.",
  },
  {
    icon: Hammer,
    title: "L'Héritage de la Forge et des Champs",
    content: "Les Outils de Maître : Marteau 3x3 pour éventrer la roche, Bâton de vente pour échanger vos ressources, Houes de farm pour dompter la terre.\n\nL'Armure de Farm : Célérité et Vision Nocturne (craft).\n\nLes Parures de Guerre : Combattant (vitesse d'attaque), Guerrier (+2 cœurs), Souverain (fusion des deux).",
  },
  {
    icon: Coins,
    title: 'La Loi du Commerce Brut',
    content: "À Valoria, l'Hôtel des Ventes n'existe pas. Chaque échange est une épreuve de force. Les trocs se font face à face, dans l'ombre des ruelles ou au cœur des plaines. Ici, un coffre plein ne se vend pas, il se défend.",
  },
  {
    icon: Sparkles,
    title: 'Les Failles et le Chaos',
    content: "La Dimension Éphémère : une faille s'ouvre rarement vers un lieu oublié. Traque des créatures relâchant des reliques mystérieuses.\n\nL'Épreuve du FFA : arène où chaque guerrier devient un inconnu. Seul le dernier survivant réclame la gloire.",
  },
  {
    icon: Fish,
    title: 'Le Lien avec les Familiers',
    content: "Dans les eaux de Valoria se cachent des poissons rares. La pêche est vitale : c'est le seul moyen de nourrir vos Familiers, ces compagnons qui vous épaulent. Sans ces prises, vos alliés ne pourront pas regagner leurs forces.",
  },
  {
    icon: Book,
    title: 'Commandes utiles',
    content: '/f create <nom> - Créer une faction\n/f join <faction> - Rejoindre une faction\n/f home - Retour au QG\n/spawn - Retour au spawn\n/kit starter - Kit de démarrage (cooldown)',
  },
];

export default function WikiPage() {
  return (
    <div className="valoria-page-shell">
      <SEO
        title="Wiki"
        description="Wiki Valoria : Chroniques, Nations, Forge, Commerce, Failles, Familiers. Tout pour bien démarrer."
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
