import { useState } from 'react';
import { X, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import type { Product } from '../data/products';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={showConfirm ? handleCancelConfirm : onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-slideDown border border-gray-100">
        <button
          onClick={showConfirm ? handleCancelConfirm : onClose}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 z-10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {showConfirm ? (
          <div className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
                <Coins className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="font-display text-2xl text-gray-900 mb-2">Confirmer l'achat</h2>
              <p className="text-gray-600">
                Tu es sur le point d'acheter <strong>{product.name}</strong> pour <strong>{product.price} Écus</strong>.
              </p>
              <p className="text-gray-500 text-sm mt-2">Êtes-vous sûr ?</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleCancelConfirm}
                className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3.5 rounded-xl bg-[#1e3a5f] text-white font-semibold hover:bg-[#152a45] transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="h-72 bg-[#1e3a5f]/5">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-8 space-y-5">
              <div>
                {product.isNew && (
                  <span className="inline-block px-3 py-1 bg-[#f59e0b] text-[#1e3a5f] text-xs font-bold rounded-full mb-2">
                    Nouveau
                  </span>
                )}
                <h2 className="font-display text-2xl text-gray-900">{product.name}</h2>
                {product.description && (
                  <p className="text-gray-600 mt-2 leading-relaxed">{product.description}</p>
                )}
              </div>
              <div className="flex items-center justify-between pt-5 border-t border-gray-100">
                <span className="text-2xl font-bold text-[#1e3a5f]">{product.price} Écus</span>
                <button onClick={handleBuyClick} className="px-6 py-3 rounded-xl bg-[#1e3a5f] text-white font-semibold hover:bg-[#152a45] transition-colors">
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
