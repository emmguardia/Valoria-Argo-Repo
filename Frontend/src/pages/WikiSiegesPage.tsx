import { Link } from 'react-router-dom';
import { Flag, Gem, Bomb, CalendarClock, Swords, Coins, Trophy, ShieldAlert } from 'lucide-react';
import SEO from '../components/SEO';

// Guide des sièges : même contenu que /siege aide en jeu, en détaillé.
// Les durées et montants sont ceux de la config du serveur au lancement ; ils peuvent évoluer.
const SECTIONS = [
  {
    icon: Flag,
    title: '1. La bannière, le cœur de ta base',
    content:
      "Avant de claim, le chef ou un officier pose la bannière de la faction (/banniere). Son chunk devient le premier claim, et les 3×3 chunks autour forment le cœur : aucune autre faction ne peut les claim.\n\nLa bannière et le bloc qui la porte sont incassables. Le bloc dessous ne peut pas être un coffre ou un autre stockage.",
  },
  {
    icon: Gem,
    title: '2. Le Trésor',
    content:
      "Tape /tresor pour recevoir le tonneau du Trésor, et pose-le dans tes terres à moins de 8 blocs de la bannière. Un tonneau normal ne compte pas.\n\nChaque jour, ce que tu y ranges rapporte des points de saison à ta faction (selon le prix de vente au shop, avec un plafond). Les reliques, comme l'œuf du dragon, rapportent des points en plus. Le Trésor est incassable : seul un siège gagné permet de l'ouvrir. Dès qu'un siège commence contre ta faction, il est scellé : tu ne peux plus le vider, ni à la main ni avec un entonnoir, jusqu'à la fin.",
  },
  {
    icon: Bomb,
    title: '3. Le raid, sans siège',
    content:
      "Hors siège, un claim ennemi se raide comme sur tout serveur faction : creepers (les œufs de creeper s'utilisent chez l'ennemi) et canons à TNT tirés de l'extérieur. On ne peut rien poser ni ouvrir chez l'ennemi.\n\nUne base sans obsidienne et facile d'accès peut donc se faire piller sans siège. La bannière, son support et le Trésor restent intacts.\n\nPour trouver une base, achète un détecteur au shop (Divers). Clic droit : le pourcentage monte quand tu t'approches du coffre le plus proche, et il te dit s'il est en dessous ou au-dessus de toi. Le basique cherche à 16 blocs, l'avancé à 32.",
  },
  {
    icon: CalendarClock,
    title: '4. Déclarer un siège',
    content:
      "Le chef ou un officier ouvre /siege, choisit la faction, le jour et l'heure (au moins 24 h à l'avance), puis les alliés qui participent. La déclaration coûte des pièces d'or et tout le serveur est prévenu, en jeu et sur le Discord.\n\nImpossible d'assiéger une faction de sa nation, une faction trop petite ou trop récente, ou une faction beaucoup plus petite que la tienne (sauf si elle est mieux classée). Deux sièges par semaine au maximum.\n\nChaque camp peut ajouter une autre faction de sa nation en renfort avec /siege renfort. Les joueurs qui rejoignent une faction après la déclaration ne combattent pas.",
  },
  {
    icon: Swords,
    title: '5. Le jour du siège (2 h)',
    content:
      "Un cercle rouge de particules entoure la bannière de la faction assiégée. Les attaquants gagnent s'ils restent dans ce cercle, sans défenseur dedans, assez longtemps (la barre en haut de l'écran montre la capture). Un défenseur dans le cercle bloque la capture ; un cercle vide la fait redescendre.\n\nPendant le siège, les attaquants posent de la TNT chez la cible et l'obsidienne cède à la 4e explosion. Seuls les participants se battent dans la zone. Un défenseur mort revient à son /f home, un attaquant au spawn.\n\nSi la bannière tient jusqu'au bout, la défense gagne.",
  },
  {
    icon: Coins,
    title: '6. Après une victoire : rançon ou pillage',
    content:
      "La base vaincue est gelée : ses membres ne cassent, ne posent et n'ouvrent plus rien chez eux.\n\nLe chef ou un officier vaincu a 10 minutes pour proposer une rançon (/siege rancon <montant>), et peut monter son offre. L'attaquant accepte (il prend l'argent, pas de pillage) ou refuse.\n\nSans rançon acceptée : 2 h de pillage. Les attaquants cassent, posent et ouvrent tout dans les terres de la cible, Trésor compris. Seule la bannière reste intouchable.",
  },
  {
    icon: Trophy,
    title: '7. Points et protection',
    content:
      "Victoire et défense réussie rapportent des points de saison. Les kills, les blocs et les coffres cassés en rapportent aussi aux deux camps, même en cas d'échec.\n\nAprès un siège, la faction visée est protégée : une semaine après une défaite, deux jours après avoir repoussé l'attaque. La dernière semaine de la saison est la semaine des sièges : plus de limite et des points doublés.",
  },
  {
    icon: ShieldAlert,
    title: '8. Ce qui est interdit pendant un siège',
    content:
      "Du moment où un siège est déclaré jusqu'à la fin du pillage, la faction ne peut ni se dissoudre, ni abandonner ses terres, et personne ne la quitte. Pendant le siège, la rançon et le pillage, les défenseurs n'ont plus accès à leur ender chest ni à leur Trésor. Leurs coffres normaux, eux, peuvent être vidés tant que le siège n'est pas perdu.",
  },
];

export default function WikiSiegesPage() {
  return (
    <div className="valoria-page-shell">
      <SEO
        title="Les sièges"
        description="Guide des sièges de Valoria : bannière, Trésor, raid, déclaration, capture de la bannière, rançon et pillage."
        keywords="siège, raid, bannière, trésor, rançon, pillage, Valoria, faction"
        url="/wiki/sieges"
      />
      <section className="valoria-page-hero">
        <div className="valoria-page-container">
          <p className="valoria-page-kicker">
            <Link to="/wiki">Wiki</Link>
          </p>
          <h1 className="valoria-page-title">Les sièges</h1>
          <p className="valoria-page-subtitle">
            Prendre une base, la défendre, payer ou piller. En jeu, tape /siege aide pour le résumé.
          </p>
        </div>
      </section>
      <section className="valoria-page-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {SECTIONS.map((section) => (
              <article key={section.title} className="valoria-card p-8">
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
