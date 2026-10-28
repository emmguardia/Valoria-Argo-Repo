import { useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const { isLoggedIn, ecus, spendEcus, addPurchase } = useUser();
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen || !product) return null;

  const canAfford = isLoggedIn && ecus >= product.price;

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

  const handleConfirm = () => {
    if (spendEcus(product.price)) {
      addPurchase({
        productId: product.id,
        productName: product.name,
        price: product.price,
        date: new Date().toISOString(),
      });
      setShowConfirm(false);
      onClose();
      onPurchaseSuccess?.();
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
                Tu es sur le point d'acheter <strong>{product.name}</strong> pour <strong>{product.price} Écus</strong>.
              </p>
              <p className="mt-2 text-sm text-brume-600">Les Écus seront débités de ton solde.</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleCancelConfirm}
                className="btn-3d btn-nuit flex-1"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                className="btn-3d btn-or flex-1"
              >
                Confirmer
              </button>
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
                  {product.price}
                  <span className="sr-only">Écus</span>
                </span>
                <button type="button" onClick={handleBuyClick} className="btn-3d btn-or">
                  {!isLoggedIn ? 'Se connecter' : canAfford ? 'Acheter' : 'Acheter des Écus'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
