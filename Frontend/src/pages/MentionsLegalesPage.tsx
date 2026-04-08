import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-[#fefce8]">
      <SEO
        title="Mentions Légales"
        description="Mentions légales du site Valoria Realm. Informations légales et conditions d'utilisation."
        url="/mentions-legales"
      />
      <section className="relative py-20 bg-gradient-to-b from-[#1e3a5f] to-[#152a45] border-b border-[#f59e0b]/20">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="uppercase tracking-[0.35em] text-xs text-[#fbbf24]/90 font-medium">Légal</p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-white mt-2">Mentions Légales</h1>
          <p className="text-white/85 max-w-2xl mt-4 text-lg">
            Informations légales concernant le site Valoria Realm. Même hébergeur et propriétaire que Zenix Web.
          </p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">I. INFORMATIONS LÉGALES DE L'ÉDITEUR ET DE L'HÉBERGEUR</h2>
              <div className="space-y-3 text-gray-700">
                <p>Le site web Valoria Realm est édité et hébergé par :</p>
                <p><strong>Nom et Prénom :</strong> Enzo Monnet-Mata</p>
                <p><strong>Statut juridique :</strong> Entrepreneur Individuel (Micro-Entrepreneur)</p>
                <p><strong>Numéro d'immatriculation (SIRET) :</strong> 991 413 600</p>
                <p><strong>Domiciliation et Lieu d'Hébergement :</strong> 69830 Saint-Georges-de-Reneins, France</p>
                <p><strong>Contact :</strong></p>
                <p><strong>Adresse e-mail :</strong> contact@zenixweb.fr</p>
                <p><strong>Site web :</strong> www.zenixweb.fr</p>
                <p><strong>Directeur de la publication :</strong> Enzo Monnet-Mata</p>
                <p><strong>Exonération de TVA :</strong></p>
                <p>TVA non applicable – article 293 B du Code Général des Impôts (CGI).</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">II. STATUT DE L'HÉBERGEMENT</h2>
              <p className="text-gray-700">
                Enzo Monnet-Mata assure lui-même l'hébergement du site. Les coordonnées de l'hébergeur sont les mêmes que celles de l'Éditeur.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">III. PROPRIÉTÉ INTELLECTUELLE</h2>
              <div className="space-y-3 text-gray-700">
                <p>L'ensemble de ce site (structure, contenu, images) est soumis à la législation française et internationale sur le droit d'auteur et la propriété intellectuelle.</p>
                <p>Tous les droits de reproduction sont réservés. La reproduction, intégrale ou partielle, du contenu de ce site, sur quelque support que ce soit, est formellement interdite sans l'autorisation expresse et écrite du directeur de la publication.</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">IV. COLLECTE ET TRAITEMENT DES DONNÉES PERSONNELLES (RGPD)</h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>Finalité du traitement :</strong></p>
                <p>Les informations recueillies (email, pseudo Minecraft) sont utilisées pour la gestion des comptes, des achats et des Écus.</p>
                <p><strong>Vos droits :</strong></p>
                <p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition aux données personnelles vous concernant.</p>
                <p><strong>Exercice des droits :</strong></p>
                <p>Pour exercer ces droits, ouvrez un ticket sur notre Discord.</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">V. COOKIES</h2>
              <p className="text-gray-700">
                Ce site n'utilise pas de cookies de traçage, d'analyse ou de marketing. Seuls des cookies strictement techniques, nécessaires au bon fonctionnement du site, peuvent être utilisés.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">VI. LIMITATION DE RESPONSABILITÉ</h2>
              <p className="text-gray-700">
                L'éditeur s'efforce d'assurer l'exactitude des informations diffusées sur le site. Si vous constatez une lacune ou une erreur, merci d'ouvrir un ticket sur notre Discord.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">VII. DROIT APPLICABLE ET JURIDICTION</h2>
              <p className="text-gray-700">
                Tout litige en relation avec l'utilisation du site Valoria Realm est soumis au droit français. Compétence exclusive est attribuée aux tribunaux compétents de Lyon.
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
