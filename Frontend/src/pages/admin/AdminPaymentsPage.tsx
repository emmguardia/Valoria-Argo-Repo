import { useCallback, useEffect, useState } from 'react';
import { useUser } from '../../context/UserContext';
import { adminApi, type AdminPayment } from '../../lib/adminApi';
import {
  AdminPageHeader, AdminTable, AdminTableHead, AdminTableRow,
  Empty, ErrorBanner, Pagination,
} from '../../components/admin/ui';

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }); }
  catch { return iso; }
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
    } catch (e) { setError(e instanceof Error ? e.message : 'Erreur'); }
    finally { setLoading(false); }
  }, [token, page]);

  useEffect(() => { void reload(); }, [reload]);
  const pageCount = Math.max(1, Math.ceil(total / limit));

  const totalRevenue = items.reduce((acc, p) => acc + p.amountCents, 0);

  return (
    <div>
      <AdminPageHeader
        title={`Paiements Stripe (${total})`}
        subtitle="Historique des achats de packs Écus."
        right={
          items.length > 0 ? (
            <div className="text-right">
              <div className="text-stone-500 text-xs uppercase tracking-wider">Total page</div>
              <div className="text-2xl font-bold text-amber-700">{fmtEuros(totalRevenue, items[0]?.currency || 'eur')}</div>
            </div>
          ) : undefined
        }
      />
      <ErrorBanner message={error} />
      {loading ? <p className="text-stone-500">Chargement…</p> : (
        <>
          <AdminTable>
            <AdminTableHead>
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Joueur</th>
                <th className="px-4 py-3">MC</th>
                <th className="px-4 py-3">Pack</th>
                <th className="px-4 py-3 text-right">Écus crédités</th>
                <th className="px-4 py-3 text-right">Montant</th>
                <th className="px-4 py-3">Session Stripe</th>
              </tr>
            </AdminTableHead>
            <tbody>
              {items.map((p) => (
                <AdminTableRow key={p.id}>
                  <td className="px-4 py-3 text-stone-600">{fmtDate(p.createdAt)}</td>
                  <td className="px-4 py-3 font-medium text-stone-900">{p.userPseudo ?? p.userId}</td>
                  <td className="px-4 py-3 text-stone-600">{p.mcUsername}</td>
                  <td className="px-4 py-3 text-stone-700">{p.rewardId}</td>
                  <td className="px-4 py-3 text-right font-semibold text-amber-700">+{p.ecusAmount}</td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-700">{fmtEuros(p.amountCents, p.currency)}</td>
                  <td className="px-4 py-3 text-xs text-stone-500 font-mono truncate max-w-[12rem]" title={p.stripeSessionId}>{p.stripeSessionId}</td>
                </AdminTableRow>
              ))}
              {items.length === 0 && <tr><td colSpan={7}><Empty message="Aucun paiement enregistré." /></td></tr>}
            </tbody>
          </AdminTable>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </>
      )}
    </div>
  );
}
