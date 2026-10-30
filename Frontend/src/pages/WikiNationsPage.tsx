import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';
import SEO from '../components/SEO';

// Lore des nations : même texte que docs/lore-nations.md du dépôt du serveur.
// Les bonus sont ceux de FactionsNations (nations.yml) et de ValoriaCore (feu des Aragonais).
const NATIONS = [
  {
    name: 'Francs',
    devise: "Par l'épée et par la foi",
    histoire:
      "Héritiers des rois qui unirent les tribus sous une seule couronne, les Francs ont débarqué en longues colonnes de chevaliers. Ils croient que la victoire revient à celui qui frappe le premier, et le plus fort. Là où flotte leur bannière aux lys, une forteresse finit toujours par s'élever.",
    bonus: '+6 % de dégâts',
  },
  {
    name: 'Anglo-Saxons',
    devise: "L'arc avant l'épée",
    histoire:
      "Venus des brumes d'une île aux sept royaumes, les Anglo-Saxons ont appris la guerre dans les forêts et les marais. Leurs archers brisent une charge avant qu'elle n'atteigne la palissade. Peuple patient, ils bâtissent sur les hauteurs, d'où chaque flèche porte plus loin.",
    bonus: "+10 % de dégâts à l'arc",
  },
  {
    name: 'Vikings',
    devise: 'Le vent pour seul maître',
    histoire:
      "Marins et pillards du Grand Nord, les Vikings ont accosté sur leurs drakkars, attirés par la rumeur des trésors de Valoria. Ils frappent là où personne ne les attend et sont déjà loin quand sonne l'alarme. Pour eux, tomber au combat ouvre les portes du Valhalla.",
    bonus: '+8 % de vitesse',
  },
  {
    name: 'Chine médiévale',
    devise: 'Le savoir est une lame',
    histoire:
      "Arrivés au bout de la route de la soie, ils ont apporté la poudre, la boussole et l'art des grandes mines. Infatigables bâtisseurs, ils creusent plus vite que quiconque et voient dans le noir des galeries comme en plein jour. Leurs généraux disent qu'une guerre se gagne avant d'être livrée.",
    bonus: 'Célérité I et vision nocturne',
  },
  {
    name: 'Bohémiens',
    devise: 'Plier sans rompre',
    histoire:
      "Peuple des montagnes et des mines d'argent, les Bohémiens ont survécu à toutes les invasions de leur royaume. Leurs armuriers forgent des plates réputées sur tout le continent, et leurs chariots de guerre tiennent face aux charges les plus lourdes. On ne les abat pas : on s'épuise contre eux.",
    bonus: '-6 % de dégâts subis',
  },
  {
    name: 'Bretons',
    devise: 'Plutôt la mort que la souillure',
    histoire:
      "Gens de la lande et des légendes, les Bretons ont gardé les secrets des druides et des forêts profondes. Leurs éclaireurs disparaissent dans la brume au moment voulu, grâce à une potion dont la recette se transmet de génération en génération. Fiers et indépendants, ils ne s'inclinent devant aucun roi.",
    bonus: "Une potion d'invisibilité toutes les 24 h",
  },
  {
    name: 'Aragonais',
    devise: 'Nés du feu et de la pierre',
    histoire:
      "Forgés sous un soleil brûlant et dans les guerres de reconquête, les Aragonais sont des guerriers de choc. Leurs charges renversent les lignes ennemies, et les incendies de leurs terres arides les ont endurcis aux flammes. Leur couronne règne aussi sur la mer : on les dit aussi bons marchands que soldats.",
    bonus: '+12 % de recul et -50 % de dégâts de feu',
  },
  {
    name: 'Turcs seldjoukides',
    devise: 'La fortune sourit aux audacieux',
    histoire:
      "Cavaliers venus des steppes, les Seldjoukides ont bâti un empire du désert jusqu'aux portes de Byzance. Archers montés redoutables, ils frappent au point faible et repartent chargés de butin. La chance, disent-ils, n'est qu'une affaire d'œil exercé et de patience.",
    bonus: 'Chance II et +8 % de dégâts critiques',
  },
  {
    name: 'Byzantins',
    devise: 'Tenir, toujours tenir',
    histoire:
      "Héritiers d'un empire millénaire, les Byzantins défendent depuis des siècles une cité qu'on dit imprenable. Leurs ingénieurs maîtrisent le feu grégeois et l'art des murailles : aucune explosion ne les fait reculer longtemps. Diplomates retors, ils préfèrent acheter la paix que risquer une guerre.",
    bonus: "-30 % de dégâts d'explosion",
  },
];

export default function WikiNationsPage() {
  return (
    <div className="valoria-page-shell">
      <SEO
        title="Les nations"
        description="Les neuf nations de Valoria : leur histoire, leur devise et leur bonus."
        keywords="nations, lore, francs, vikings, byzantins, bretons, Valoria, faction"
        url="/wiki/nations"
      />
      <section className="valoria-page-hero">
        <div className="valoria-page-container">
          <p className="valoria-page-kicker">
            <Link to="/wiki">Wiki</Link>
          </p>
          <h1 className="valoria-page-title">Les neuf nations</h1>
          <p className="valoria-page-subtitle">
            Chaque faction jure fidélité à l'une d'elles, pour toujours, et tous ses membres portent son bonus.
          </p>
        </div>
      </section>
      <section className="valoria-page-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <article className="valoria-card p-8 mb-8">
            <h2 className="font-display text-xl text-gray-900 mb-2">Le royaume brisé</h2>
            <p className="valoria-text-muted whitespace-pre-line">
              {"Il y a longtemps, Valoria avait un roi. Quand il mourut sans héritier, sa couronne se brisa en neuf éclats, et la nouvelle traversa les mers et les montagnes : une terre riche, sans maître, attendait celui qui saurait la prendre.\n\nNeuf peuples répondirent à l'appel. Ils arrivèrent par la mer, par la steppe et par les cols enneigés, chacun avec ses armes, ses croyances et sa façon de faire la guerre. Aucun n'a encore réuni le royaume."}
            </p>
          </article>
          <div className="space-y-8">
            {NATIONS.map((nation) => (
              <article key={nation.name} className="valoria-card p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#1e3a5f]/10 rounded-xl shrink-0">
                    <Crown className="w-6 h-6 text-[#1e3a5f]" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl text-gray-900">{nation.name}</h2>
                    <p className="italic text-[#b8860b] mb-2">« {nation.devise} »</p>
                    <p className="valoria-text-muted">{nation.histoire}</p>
                    <p className="mt-3 font-semibold text-[#1e3a5f]">Bonus : {nation.bonus}</p>
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
