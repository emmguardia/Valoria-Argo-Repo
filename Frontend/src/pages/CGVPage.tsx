import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { ECUS_PACKS } from '../data/ecusPacks';

// CGV de la boutique : Écus achetés en euros (Stripe), produits achetés en Écus (livrés en jeu par la file du serveur).
// La renonciation au droit de rétractation est recueillie par la case à cocher des pages /ecus et /boutique.
const SECTIONS: { title: string; body: ReactNode }[] = [
  {
    title: 'I. Identification des parties',
    body: (
      <>
        <p><strong>Prestataire :</strong> Enzo Monnet-Mata (Zenix Web), entrepreneur individuel</p>
        <p><strong>Adresse :</strong> 69830 Saint-Georges-de-Reneins, France</p>
        <p><strong>SIRET :</strong> 991 413 600</p>
        <p><strong>Email :</strong> contact@zenixweb.fr</p>
        <p><strong>TVA :</strong> TVA non applicable, article 293 B du CGI</p>
        <p className="mt-4"><strong>Client :</strong> toute personne qui achète des Écus ou des produits sur la boutique Valoria.</p>
      </>
    ),
  },
  {
    title: 'II. Objet',
    body: (
      <>
        <p>
          Les présentes CGV encadrent la vente des Écus (monnaie virtuelle de Valoria) et des produits de la boutique
          (grades, avantages, objets) du serveur Minecraft Valoria. Tout achat implique leur acceptation, cochée avant le paiement.
        </p>
        <p>Valoria n'est pas un produit officiel Minecraft. Valoria n'est ni approuvé par Mojang ou Microsoft, ni associé à eux.</p>
      </>
    ),
  },
  {
    title: 'III. Compte et mineurs',
    body: (
      <>
        <p>Un compte sur le site est nécessaire pour acheter. Les produits sont livrés sur le compte Minecraft lié à ce compte (commande /lier en jeu).</p>
        <p>Un mineur ne peut acheter qu'avec l'accord de son représentant légal, qui reste responsable du moyen de paiement utilisé.</p>
      </>
    ),
  },
  {
    title: 'IV. Prix et paiement des Écus',
    body: (
      <>
        <p>Les Écus sont vendus par packs, prix en euros toutes taxes comprises :</p>
        <ul className="list-disc list-inside">
          {ECUS_PACKS.map((p) => (
            <li key={p.ecus}>{p.ecus.toLocaleString('fr-FR')} Écus : {p.price}</li>
          ))}
        </ul>
        <p>
          Le paiement se fait par carte bancaire sur la page sécurisée de Stripe, au moment de la commande. Valoria n'a jamais
          accès aux données de la carte.
        </p>
      </>
    ),
  },
  {
    title: 'V. Les Écus',
    body: (
      <>
        <p>
          Les Écus sont une monnaie virtuelle utilisable uniquement dans la boutique Valoria. Ils n'ont aucune valeur monétaire :
          ils ne peuvent être ni échangés contre de l'argent, ni remboursés, ni transférés à un autre compte.
        </p>
        <p>Ils n'expirent pas et sont conservés d'une saison du serveur à l'autre.</p>
      </>
    ),
  },
  {
    title: 'VI. Produits de la boutique',
    body: (
      <>
        <p>
          Les produits s'achètent avec des Écus. Leur prix et leur contenu exacts sont indiqués sur leur fiche dans
          la <Link to="/boutique" className="font-semibold text-[#1e3a5f] underline">boutique</Link> au moment de l'achat.
        </p>
        <p>
          Les grades (VIP, VIP+) sont acquis à vie : ils restent valables tant que le serveur est exploité et sont conservés à chaque
          nouvelle saison. Passer de VIP à VIP+ coûte la différence de prix entre les deux grades.
        </p>
        <p>Les produits de saison (pass de saison) valent pour la saison en cours. Les objets (clés, box) sont consommés à l'usage.</p>
      </>
    ),
  },
  {
    title: 'VII. Livraison',
    body: (
      <>
        <p>Les Écus sont crédités sur le compte dès que Stripe confirme le paiement, en général en quelques secondes.</p>
        <p>
          Les produits sont livrés sur le serveur au personnage lié au compte. Un joueur hors ligne les reçoit à sa prochaine
          connexion. L'état de chaque livraison est visible sur le profil du site.
        </p>
      </>
    ),
  },
  {
    title: 'VIII. Droit de rétractation',
    body: (
      <>
        <p>
          Les Écus et les produits sont des contenus numériques fournis immédiatement après l'achat. Avant de payer, le client
          demande expressément cette fourniture immédiate et reconnaît perdre son droit de rétractation de 14 jours
          (article L221-28 13° du Code de la consommation), en cochant la case prévue.
        </p>
        <p>En cas d'erreur technique avérée (Écus non crédités, produit non livré), Valoria recrédite ou rembourse le client.</p>
      </>
    ),
  },
  {
    title: 'IX. Règlement du serveur',
    body: (
      <p>
        Les achats ne dispensent pas de respecter les <Link to="/regles" className="font-semibold text-[#1e3a5f] underline">règles du serveur</Link>.
        Un joueur sanctionné ou banni pour une infraction aux règles ne peut pas obtenir le remboursement de ses Écus ou de ses produits.
      </p>
    ),
  },
  {
    title: 'X. Disponibilité du service',
    body: (
      <p>
        Le serveur peut être interrompu pour maintenance ou en cas de panne. Un arrêt définitif du serveur serait annoncé au
        moins 30 jours à l'avance sur le site et sur le Discord.
      </p>
    ),
  },
  {
    title: 'XI. Réclamations',
    body: (
      <p>
        Toute réclamation peut être faite en ouvrant un ticket sur le Discord de Valoria ou par email à contact@zenixweb.fr, en
        décrivant le problème (pseudo, date, achat concerné). Elle est traitée dans les meilleurs délais.
      </p>
    ),
  },
  {
    title: 'XII. Droit applicable',
    body: (
      <p>
        Les présentes CGV sont soumises au droit français. À défaut de solution amiable, le litige est porté devant le tribunal
        compétent selon les règles du droit commun.
      </p>
    ),
  },
];

export default function CGVPage() {
  return (
    <div className="min-h-screen bg-[#fefce8]">
      <SEO
        title="Conditions Générales de Vente"
        description="CGV Valoria Realm : vente des Écus et des produits de la boutique, livraison, droit de rétractation."
        url="/cgv"
      />
      <section className="relative py-20 bg-gradient-to-b from-[#1e3a5f] to-[#152a45] border-b border-[#f59e0b]/20">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="uppercase tracking-[0.35em] text-xs text-[#fbbf24]/90 font-medium">Légal</p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-white mt-2">Conditions Générales de Vente</h1>
          <p className="text-white/85 max-w-2xl mt-4 text-lg">Vente des Écus et des produits de la boutique Valoria.</p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {SECTIONS.map((s) => (
              <div key={s.title} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{s.title}</h2>
                <div className="space-y-3 text-gray-700">{s.body}</div>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              to="/"
              className="inline-block px-8 py-3 rounded-xl bg-[#1e3a5f] text-white font-semibold hover:bg-[#152a45] transition-colors"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
