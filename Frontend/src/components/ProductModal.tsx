import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import type { Product } from '../data/products';
import EcuIcon from './EcuIcon';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onPurchaseSuccess?: () => void;
}

export default function ProductModal({ product, isOpen, onClose, onPurchaseSuccess }: ProductModalProps) {
  const navigate = useNavigate();
  const { isLoggedIn, ecus, token, refreshUserData } = useUser();
  const [showConfirm, setShowConfirm] = useState(false);
  // Prix pour ce joueur (montée en gamme VIP -> VIP+, déjà possédé), donné par le serveur
  const [offer, setOffer] = useState<{ price: number; owned: boolean; upgrade: boolean } | null>(null);
  // Un identifiant par ouverture : un double clic ou un renvoi ne paie jamais deux fois
  const [requestId, setRequestId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; needsLink: boolean } | null>(null);
  const [done, setDone] = useState<{ price: number; balance: number } | null>(null);

  useEffect(() => {
    if (!isOpen || !product) return;
    setRequestId(`site-${crypto.randomUUID()}`);
    setOffer(null);
    setError(null);
    setDone(null);
    setShowConfirm(false);
    if (!token || !product.slug) return;
    let cancelled = false;
    fetch('/api/shop/catalog', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((payload) => {
        const p = payload?.products?.find((x: { slug: string }) => x.slug === product.slug);
        if (!cancelled && p) setOffer({ price: p.price, owned: p.owned, upgrade: p.upgrade });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isOpen, product, token]);

  if (!isOpen || !product) return null;

  const price = offer?.price ?? product.price;
  const canAfford = isLoggedIn && ecus >= price;

  const handleBuyClick = () => {
    if (!isLoggedIn) {
      onClose();
      navigate('/connexion');
      return;
    }
    if (!canAfford) {
      onClose();
      navigate('/ecus');
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!token || !product.slug || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slug: product.slug, requestId }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({ text: payload?.error || `Erreur ${res.status}`, needsLink: payload?.code === 'compte_non_lie' });
        return;
      }
      setDone({ price: payload.price, balance: payload.balance });
      await refreshUserData();
      onPurchaseSuccess?.();
    } catch {
      // Réponse perdue : le serveur sait si l'achat est passé (même identifiant), rien n'est payé deux fois
      setError({ text: 'Le serveur n\'a pas répondu. Vérifie tes achats sur ton profil avant de réessayer.', needsLink: false });
    } finally {
      setBusy(false);
    }
  };

  const handleCancelConfirm = () => setShowConfirm(false);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="produit-titre">
      <div className="absolute inset-0 bg-nuit-950/75 backdrop-blur-sm" onClick={showConfirm ? handleCancelConfirm : onClose} />
      <div className="carte relative w-full max-w-lg overflow-hidden border-or/35 shadow-[0_8px_0_#091127,0_30px_60px_rgb(0_0_0/0.5)] animate-slideDown">
        <button
          onClick={showConfirm ? handleCancelConfirm : onClose}
          aria-label="Fermer"
          className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-xl bg-nuit-900/80 text-brume-100 transition-colors hover:bg-nuit-700"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        {showConfirm ? (
          <div className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <EcuIcon className="mx-auto mb-5 h-16 w-16" />
              <h2 id="produit-titre" className="mb-2 text-3xl text-white">Confirmer l'achat</h2>
              <p className="text-brume-300">
                Tu es sur le point d'acheter <strong>{product.name}</strong> pour <strong>{price} Écus</strong>
                {offer?.upgrade ? ' (montée en gamme : tu ne paies que la différence)' : ''}.
              </p>
              <p className="mt-2 text-sm text-brume-600">Les Écus sont débités tout de suite ; la livraison se fait en jeu, dès que tu es connecté.</p>
              {error && (
                <p className="mt-4 rounded-xl bg-red-500/15 p-3 text-sm text-red-200" role="alert">
                  {error.text}
                  {error.needsLink && (
                    <> <Link to="/profile" className="font-bold underline" onClick={onClose}>Lier mon compte</Link></>
                  )}
                </p>
              )}
              {done && (
                <p className="mt-4 rounded-xl bg-emerald-500/15 p-3 text-sm text-emerald-200" role="status">
                  Payé {done.price} Écus (reste {done.balance}). Livraison en jeu dans quelques secondes si tu es connecté, sinon à ta prochaine connexion.
                </p>
              )}
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleCancelConfirm}
                className="btn-3d btn-nuit flex-1"
              >
                {done ? 'Fermer' : 'Annuler'}
              </button>
              {!done && (
                <button
                  onClick={handleConfirm}
                  disabled={busy}
                  className="btn-3d btn-or flex-1 disabled:opacity-60"
                >
                  {busy ? 'Paiement…' : 'Confirmer'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="aspect-[4/3] bg-nuit-700">
              <img
                src={product.image}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-8 space-y-5">
              <div>
                {product.isNew && (
                  <span className="mb-2 inline-block rounded-lg bg-ciel px-2.5 py-1 text-xs font-black tracking-[0.12em] text-[#062033]">
                    NOUVEAU
                  </span>
                )}
                <h2 id="produit-titre" className="text-3xl text-white">{product.name}</h2>
                {product.description && (
                  <p className="mt-2 leading-relaxed text-brume-400">{product.description}</p>
                )}
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-ciel/15 pt-5">
                <span className="inline-flex items-center gap-2 font-display text-3xl text-or">
                  <EcuIcon className="h-7 w-7" />
                  {price}
                  <span className="sr-only">Écus</span>
                </span>
                {offer?.owned ? (
                  <span className="font-bold text-emerald-300">Déjà à toi</span>
                ) : (
                  <button type="button" onClick={handleBuyClick} className="btn-3d btn-or">
                    {!isLoggedIn ? 'Se connecter' : canAfford ? 'Acheter' : 'Acheter des Écus'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
