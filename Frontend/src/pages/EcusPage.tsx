import { Link, useNavigate } from 'react-router-dom';
import { Coins } from 'lucide-react';
import SEO from '../components/SEO';
import { useUser } from '../context/UserContext';

const ECUS_PACKS = [
  { ecus: 50, price: '0,99 €', popular: false },
  { ecus: 150, price: '2,49 €', popular: true, bonus: '+20%' },
  { ecus: 350, price: '4,99 €', popular: false, bonus: '+40%' },
  { ecus: 750, price: '9,99 €', popular: false, bonus: '+50%' },
  { ecus: 1650, price: '19,99 €', popular: false, bonus: '+65%' },
];

export default function EcusPage() {
  const navigate = useNavigate();
  const { isLoggedIn, profile } = useUser();

  const handleBuyPack = async (ecus: number) => {
    if (!isLoggedIn) {
      navigate('/connexion');
      return;
    }

    const username = profile?.pseudo?.trim();
    if (!username) {
      window.alert('Pseudo manquant. Reconnecte-toi.');
      navigate('/connexion');
      return;
    }

    const response = await fetch('/api/tebex/checkout-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pack: ecus,
        username
      }),
    });
    if (!response.ok) {
      window.alert("Le paiement Tebex n'est pas disponible pour ce pack pour le moment.");
      return;
    }
    const data = (await response.json()) as { url?: string };
    if (!data.url) {
      window.alert('Réponse Tebex invalide.');
      return;
    }
    window.location.assign(data.url);
  };

  return (
    <div className="min-h-screen bg-[#fefce8]">
      <SEO
        title="Acheter des Écus"
        description="Les Écus sont la monnaie de la boutique Valoria. Choisis un pack pour recharger ton compte."
        keywords="Écus, Valoria, boutique, monnaie, achat"
        url="/ecus"
      />
      <section className="relative py-20 bg-gradient-to-b from-[#1e3a5f] to-[#152a45] border-b border-[#f59e0b]/20">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="uppercase tracking-[0.35em] text-xs text-[#fbbf24]/90 font-medium">Boutique</p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-white mt-2">
            Acheter des Écus
          </h1>
          <p className="text-white/85 max-w-2xl mt-4 text-lg">
            Les Écus sont la monnaie de la boutique Valoria. Clique sur un pack pour acheter — paiement direct, pas de panier.
          </p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {!isLoggedIn && (
            <div className="mb-8 p-4 bg-amber-50 rounded-xl border border-amber-200/60">
              <p className="text-gray-700 text-sm">
                <Link to="/connexion" className="text-[#1e3a5f] font-semibold hover:underline">Connecte-toi</Link> pour acheter des Écus.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ECUS_PACKS.map((pack) => (
              <button
                key={pack.ecus}
                type="button"
                onClick={() => handleBuyPack(pack.ecus)}
                className={`relative p-8 rounded-2xl border-2 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  pack.popular
                    ? 'border-[#f59e0b] bg-amber-50/80 shadow-lg shadow-amber-500/10'
                    : 'border-gray-200 bg-white hover:border-[#1e3a5f]/40 hover:shadow-slate-900/5'
                }`}
              >
                {pack.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#f59e0b] text-white text-xs font-bold rounded-full">
                    Populaire
                  </span>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-[#1e3a5f]/10 flex items-center justify-center">
                    <Coins className="w-7 h-7 text-[#1e3a5f]" />
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-gray-900">{pack.ecus}</span>
                    <span className="text-gray-600 ml-1">Écus</span>
                    {pack.bonus && (
                      <span className="block text-sm text-[#f59e0b] font-semibold">{pack.bonus}</span>
                    )}
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#1e3a5f]">{pack.price}</p>
                <p className="text-sm text-gray-500 mt-2">Paiement direct</p>
              </button>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-gray-500">
            Paiement géré par Tebex via backend sécurisé.
          </p>
          <div className="mt-8 text-center">
            <Link to="/boutique" className="text-[#1e3a5f] font-semibold hover:underline">
              ← Retour à la boutique
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
