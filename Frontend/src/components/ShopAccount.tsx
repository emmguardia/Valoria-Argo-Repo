import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Link2, ShoppingBag, Coins, RefreshCw } from 'lucide-react';
import { useUser } from '../context/UserContext';

// Profil : liaison du compte au jeu (/lier), achats avec l'état de leur livraison, registre des Écus.
// Tout vient du serveur (GET /api/shop/me) : c'est la trace de référence en cas de souci.

interface Purchase {
  id: number; name: string; price: number; origin: 'site' | 'jeu'; createdAt: string;
  commandId: number | null; delivery: string; attempts: number; deliveredAt: string | null; lastError: string | null;
}
interface LedgerLine {
  id: number; delta: number; balanceAfter: number; reason: string; origin: string; detail: string | null; createdAt: string;
}
interface ShopMe { pseudo: string; ecus: number; linked: boolean; linkedAt: string | null; purchases: Purchase[]; ledger: LedgerLine[] }

const DELIVERY: Record<string, { label: string; className: string }> = {
  done: { label: 'Livré', className: 'bg-emerald-100 text-emerald-800' },
  pending: { label: 'En attente de ta connexion', className: 'bg-amber-100 text-amber-800' },
  sent: { label: 'En cours de livraison', className: 'bg-sky-100 text-sky-800' },
  failed: { label: 'Problème : contacte le staff', className: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Annulé', className: 'bg-gray-200 text-gray-700' },
};
const REASONS: Record<string, string> = {
  paiement_stripe: 'Achat d\'Écus',
  achat_produit: 'Achat en boutique',
  ajustement_admin: 'Ajustement du staff',
  remboursement: 'Remboursement',
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function ShopAccount() {
  const { token } = useUser();
  const [data, setData] = useState<ShopMe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<{ code: string; expiresAt: string } | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/shop/me', { headers: { Authorization: `Bearer ${token}` } });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || `Erreur ${res.status}`);
      setData(payload);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const askCode = async () => {
    if (!token) return;
    const res = await fetch('/api/shop/link-code', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const payload = await res.json().catch(() => ({}));
    if (res.ok) setCode(payload);
    else setError(payload?.error || `Erreur ${res.status}`);
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-900/5 border border-gray-100 p-8">
        <h2 className="font-display text-xl text-gray-900 mb-4 flex items-center gap-2">
          <Link2 className="w-6 h-6 text-[#1e3a5f]" />
          Compte Minecraft
        </h2>
        {data?.linked ? (
          <p className="text-gray-700">
            Lié au joueur <strong>{data.pseudo}</strong>{data.linkedAt ? ` depuis le ${formatDateTime(data.linkedAt)}` : ''}.
            Tes achats sont livrés en jeu, et tu peux payer avec tes Écus dans <code>/boutique</code>.
          </p>
        ) : (
          <div className="space-y-4 text-gray-700">
            <p>Pour recevoir tes achats en jeu, relie ton compte au joueur <strong>{data?.pseudo ?? '…'}</strong> :</p>
            {code ? (
              <p className="rounded-xl bg-[#1e3a5f]/5 p-4">
                En jeu, tape <code className="font-bold text-[#1e3a5f]">/lier {code.code}</code> (valable jusqu'à{' '}
                {new Date(code.expiresAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}).
              </p>
            ) : (
              <button type="button" onClick={askCode} className="px-6 py-3 rounded-xl bg-[#1e3a5f] text-white font-semibold hover:bg-[#152a45]">
                Obtenir mon code de liaison
              </button>
            )}
            <button type="button" onClick={load} className="ml-2 inline-flex items-center gap-1 text-sm text-[#1e3a5f] underline">
              <RefreshCw className="w-4 h-4" /> J'ai tapé le code
            </button>
          </div>
        )}
        {error && <p className="mt-4 text-sm text-red-600" role="alert">{error}</p>}
      </div>

      <div className="bg-white rounded-2xl shadow-lg shadow-slate-900/5 border border-gray-100 p-8">
        <h2 className="font-display text-xl text-gray-900 mb-6 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-[#1e3a5f]" />
          Mes achats
        </h2>
        {data && data.purchases.length > 0 ? (
          <ul className="space-y-3">
            {data.purchases.map((p) => {
              const d = DELIVERY[p.delivery] ?? { label: p.delivery, className: 'bg-gray-100 text-gray-700' };
              return (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatDateTime(p.createdAt)} · {p.origin === 'jeu' ? 'acheté en jeu' : 'acheté sur le site'} · achat n°{p.id}
                      {p.commandId ? `, livraison n°${p.commandId}` : ''}
                    </p>
                    {p.deliveredAt && <p className="text-xs text-gray-400">Livré le {formatDateTime(p.deliveredAt)}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${d.className}`}>{d.label}</span>
                    <span className="font-semibold text-[#1e3a5f]">{p.price} Écus</span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-gray-500 py-8 text-center">Aucun achat pour le moment.</p>
        )}
        <Link to="/boutique" className="mt-6 inline-block px-6 py-3 rounded-xl bg-[#1e3a5f] text-white font-semibold hover:bg-[#152a45] transition-colors">
          Voir la boutique
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-lg shadow-slate-900/5 border border-gray-100 p-8">
        <h2 className="font-display text-xl text-gray-900 mb-6 flex items-center gap-2">
          <Coins className="w-6 h-6 text-[#1e3a5f]" />
          Mouvements d'Écus
        </h2>
        {data && data.ledger.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Opération</th>
                  <th className="py-2 pr-4 font-medium text-right">Écus</th>
                  <th className="py-2 font-medium text-right">Solde</th>
                </tr>
              </thead>
              <tbody>
                {data.ledger.map((l) => (
                  <tr key={l.id} className="border-t border-gray-100">
                    <td className="py-2 pr-4 text-gray-500 whitespace-nowrap">{formatDateTime(l.createdAt)}</td>
                    <td className="py-2 pr-4 text-gray-800">{REASONS[l.reason] ?? l.reason}{l.detail ? ` : ${l.detail}` : ''}</td>
                    <td className={`py-2 pr-4 text-right font-semibold ${l.delta >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {l.delta >= 0 ? '+' : ''}{l.delta}
                    </td>
                    <td className="py-2 text-right text-gray-800">{l.balanceAfter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 py-8 text-center">Aucun mouvement pour le moment.</p>
        )}
      </div>
    </>
  );
}
