import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function CGVPage() {
  return (
    <div className="min-h-screen bg-[#fefce8]">
      <SEO
        title="Conditions Générales de Vente"
        description="CGV Valoria Realm. Conditions de vente des Écus et produits de la boutique."
        url="/cgv"
      />
      <section className="relative py-20 bg-gradient-to-b from-[#1e3a5f] to-[#152a45] border-b border-[#f59e0b]/20">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="uppercase tracking-[0.35em] text-xs text-[#fbbf24]/90 font-medium">Légal</p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-white mt-2">Conditions Générales de Vente</h1>
          <p className="text-white/85 max-w-2xl mt-4 text-lg">
            Conditions de vente et d'utilisation des services Valoria. Même prestataire que Zenix Web.
          </p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">I. Identification des Parties</h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>Prestataire :</strong> Enzo Monnet-Mata</p>
                <p><strong>Adresse :</strong> 69830 Saint-Georges-de-Reneins, France</p>
                <p><strong>SIRET :</strong> 991 413 600</p>
                <p><strong>Email :</strong> contact@zenixweb.fr</p>
                <p><strong>Site web :</strong> www.zenixweb.fr</p>
                <p><strong>TVA :</strong> TVA non applicable – article 293 B du CGI</p>
                <p className="mt-4"><strong>Client</strong></p>
                <p>Toute personne morale ou physique ayant acheté des Écus ou des produits sur la boutique Valoria.</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">II. Objet</h2>
              <p className="text-gray-700">
                Les présentes CGV définissent les conditions de vente des Écus (monnaie virtuelle de la boutique) et des produits proposés sur le site Valoria Realm. Les Écus sont utilisés exclusivement sur le serveur Minecraft Valoria et ne peuvent être échangés contre de l'argent réel.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">III. Commande et Paiement</h2>
              <div className="space-y-3 text-gray-700">
                <p>Les achats d'Écus et de produits se font en ligne. Le paiement est effectué au moment de la commande. Les achats sont définitifs et non remboursables, sauf en cas d'erreur technique avérée.</p>
                <p>Les prix sont indiqués en euros (€). Les Écus sont une monnaie virtuelle sans valeur monétaire en dehors du serveur.</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">IV. Livraison</h2>
              <p className="text-gray-700">
                Les Écus sont crédités instantanément sur le compte après validation du paiement. Les produits de la boutique (cosmétiques, grades, kits) sont livrés sur le serveur Minecraft après achat.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">V. Réclamations</h2>
              <p className="text-gray-700">
                Toute réclamation ou problème doit être signalé en ouvrant un ticket sur notre Discord. Décrivez le problème de manière précise. Les réclamations seront traitées dans les meilleurs délais.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">VI. Droit applicable</h2>
              <p className="text-gray-700">
                Les présentes CGV sont soumises au droit français. Tout litige sera de la compétence exclusive des tribunaux de Lyon.
              </p>
            </div>
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
