import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Coins, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const hasHandledCheckout = useRef(false);
  const { isLoggedIn, createEcusCheckout, confirmEcusCheckout } = useUser();
  const [selectedPack, setSelectedPack] = useState<number | null>(null);
  const [status, setStatus] = useState<{
    tone: 'success' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);

  const handleBuyPack = async (ecus: number) => {
    if (!isLoggedIn) {
      navigate('/connexion');
      return;
    }
    try {
      setSelectedPack(ecus);
      setStatus({
        tone: 'info',
        title: 'Redirection vers le paiement sécurisé',
        message: 'Tu vas être redirigé vers Stripe pour finaliser ton achat.',
      });
      const checkoutUrl = await createEcusCheckout(ecus);
      window.location.assign(checkoutUrl);
    } catch (err) {
      setStatus({
        tone: 'error',
        title: 'Paiement indisponible',
        message: err instanceof Error ? err.message : 'Une erreur est survenue.',
      });
    } finally {
      setSelectedPack(null);
    }
  };

  useEffect(() => {
    const checkoutState = searchParams.get('checkout');
    const sessionId = searchParams.get('session_id');
    if (!checkoutState || hasHandledCheckout.current) return;
    hasHandledCheckout.current = true;

    if (checkoutState === 'cancel') {
      setStatus({
        tone: 'info',
        title: 'Paiement annulé',
        message: 'Aucun souci, ton compte n’a pas été débité.',
      });
      setSearchParams({}, { replace: true });
      return;
    }

    if (checkoutState === 'success' && sessionId) {
      void confirmEcusCheckout(sessionId)
        .then((result) => {
          setStatus({
            tone: 'success',
            title: 'Merci pour ton achat !',
            message: result.duplicated
              ? `Ta commande était déjà validée. Solde actuel: ${result.ecus} Écus.`
              : `${result.credited} Écus ont été ajoutés. Nouveau solde: ${result.ecus} Écus.`,
          });
        })
        .catch((err) =>
          setStatus({
            tone: 'error',
            title: 'Validation du paiement impossible',
            message: err instanceof Error ? err.message : 'Paiement non validé.',
          })
        )
        .finally(() => setSearchParams({}, { replace: true }));
      return;
    }

    setSearchParams({}, { replace: true });
  }, [confirmEcusCheckout, searchParams, setSearchParams]);

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
          {status && (
            <div
              className={`mb-8 rounded-2xl border px-5 py-4 ${
                status.tone === 'success'
                  ? 'bg-green-100 border-green-500 text-green-900 shadow-sm shadow-green-200/70'
                  : status.tone === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-start gap-3">
                {status.tone === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 mt-0.5" />
                ) : status.tone === 'error' ? (
                  <AlertCircle className="w-5 h-5 mt-0.5" />
                ) : (
                  <Sparkles className="w-5 h-5 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{status.title}</p>
                  <p className="text-sm opacity-90 mt-1">{status.message}</p>
                </div>
              </div>
            </div>
          )}
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
                disabled={selectedPack !== null}
                onClick={() => handleBuyPack(pack.ecus)}
                className={`relative p-8 rounded-2xl border-2 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  pack.popular
                    ? 'border-[#f59e0b] bg-amber-50/80 shadow-lg shadow-amber-500/10'
                    : 'border-gray-200 bg-white hover:border-[#1e3a5f]/40 hover:shadow-slate-900/5'
                } ${selectedPack !== null ? 'opacity-70 cursor-not-allowed' : ''}`}
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
                <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                  {selectedPack === pack.ecus ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {selectedPack === pack.ecus ? 'Préparation du paiement...' : 'Paiement direct'}
                </p>
              </button>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-gray-500">
            Paiement sécurisé via Stripe.
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
