import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import EcuIcon from './EcuIcon';
import type { EcusPack } from '../data/ecusPacks';

// Achat d'un pack d'Écus : la case des CGV (renonciation au droit de rétractation, art. L221-28 13°) est demandée ici,
// au moment où l'on clique sur un pack, puis on part sur la page de paiement Stripe.
interface PackCheckoutModalProps {
  pack: EcusPack | null;
  onClose: () => void;
  onPay: (ecus: number) => Promise<void>;
}

export default function PackCheckoutModal({ pack, onClose, onPay }: PackCheckoutModalProps) {
  const [accepte, setAccepte] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pack) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pack, busy, onClose]);

  if (!pack) return null;

  const pay = async () => {
    setBusy(true);
    setError(null);
    try {
      await onPay(pack.ecus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Paiement indisponible pour le moment.');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="pack-titre">
      <div className="absolute inset-0 bg-nuit-950/75 backdrop-blur-sm" onClick={busy ? undefined : onClose} />
      <div className="carte relative w-full max-w-lg overflow-hidden border-or/35 p-8 shadow-[0_8px_0_#091127,0_30px_60px_rgb(0_0_0/0.5)] animate-slideDown sm:p-10">
        <button
          onClick={onClose}
          disabled={busy}
          aria-label="Fermer"
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-xl bg-nuit-900/80 text-brume-100 transition-colors hover:bg-nuit-700"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="text-center">
          <EcuIcon className="mx-auto mb-5 h-16 w-16" />
          <h2 id="pack-titre" className="text-3xl text-white">{pack.ecus.toLocaleString('fr-FR')} Écus</h2>
          <p className="mt-2 text-lg font-extrabold text-or">{pack.price}{pack.bonus ? ` · bonus ${pack.bonus}` : ''}</p>
          <p className="mt-2 text-sm text-brume-500">Paiement par carte sur la page sécurisée de Stripe. Les Écus arrivent sur ton compte juste après.</p>
        </div>
        <label className="mt-7 flex cursor-pointer items-start gap-3 rounded-xl border-2 border-or/40 bg-nuit-850 px-5 py-4 text-left text-[15px] text-brume-200">
          <input
            type="checkbox"
            checked={accepte}
            onChange={(e) => setAccepte(e.target.checked)}
            className="mt-0.5 h-6 w-6 shrink-0 accent-[#f2b33d]"
          />
          <span>
            J'accepte les <Link to="/cgv" className="font-bold text-or underline" target="_blank">conditions générales de vente</Link> et
            je demande que mes Écus soient crédités tout de suite : je renonce ainsi à mon droit de rétractation de 14 jours.
          </span>
        </label>
        {error && <p className="mt-4 rounded-xl bg-red-500/15 p-3 text-sm text-red-200" role="alert">{error}</p>}
        <div className="mt-7 flex gap-4">
          <button onClick={onClose} disabled={busy} className="btn-3d btn-nuit flex-1">Annuler</button>
          <button onClick={pay} disabled={!accepte || busy} className="btn-3d btn-or flex-1 disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? 'Redirection…' : `Payer ${pack.price}`}
          </button>
        </div>
      </div>
    </div>
  );
}
