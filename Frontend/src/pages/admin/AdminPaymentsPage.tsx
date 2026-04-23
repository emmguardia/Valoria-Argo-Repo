import { useCallback, useEffect, useState } from 'react';
import { useUser } from '../../context/UserContext';
import { adminApi, type AdminPayment } from '../../lib/adminApi';

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleString('fr-FR'); } catch { return iso; }
}
function fmtEuros(cents: number, currency: string) {
  return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

export default function AdminPaymentsPage() {
  const { token } = useUser();
  const [items, setItems] = useState<AdminPayment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 30;

  const reload = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const data = await adminApi.listPayments(token, { page, limit });
      setItems(data.items); setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally { setLoading(false); }
  }, [token, page]);

  useEffect(() => { void reload(); }, [reload]);
  const pageCount = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-100 mb-6">Paiements Stripe ({total})</h1>
      {error && <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>}
      {loading ? <p className="text-stone-400">Chargement…</p> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-stone-400 border-b border-amber-900/20">
                <tr>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Joueur</th>
                  <th className="py-2 pr-4">MC</th>
                  <th className="py-2 pr-4">Produit</th>
                  <th className="py-2 pr-4">Écus</th>
                  <th className="py-2 pr-4">Montant</th>
                  <th className="py-2 pr-4">Session</th>
                </tr>
              </thead>
              <tbody className="text-stone-200">
                {items.map((p) => (
                  <tr key={p.id} className="border-b border-stone-800/50 hover:bg-stone-900/30">
                    <td className="py-2 pr-4 text-stone-400">{fmtDate(p.createdAt)}</td>
                    <td className="py-2 pr-4 font-medium">{p.userPseudo ?? p.userId}</td>
                    <td className="py-2 pr-4 text-stone-400">{p.mcUsername}</td>
                    <td className="py-2 pr-4">{p.rewardId}</td>
                    <td className="py-2 pr-4 text-amber-300">+{p.ecusAmount}</td>
                    <td className="py-2 pr-4">{fmtEuros(p.amountCents, p.currency)}</td>
                    <td className="py-2 pr-4 text-xs text-stone-500 font-mono truncate max-w-[12rem]">{p.stripeSessionId}</td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-stone-500">Aucun paiement.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-stone-400">
            <span>Page {page}/{pageCount}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 bg-stone-900 border border-stone-700 rounded disabled:opacity-40">Préc.</button>
              <button disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 bg-stone-900 border border-stone-700 rounded disabled:opacity-40">Suiv.</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
