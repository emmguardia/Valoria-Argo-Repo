import { useEffect, useState } from 'react';
import { useUser } from '../../context/UserContext';
import { adminApi } from '../../lib/adminApi';

export default function AdminDashboardPage() {
  const { token } = useUser();
  const [stats, setStats] = useState({
    users: 0, products: 0, payments: 0, pendingJobs: 0, loading: true, error: '' as string | null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [users, products, payments, jobs] = await Promise.all([
          adminApi.listUsers(token, { limit: 1 }),
          adminApi.listProducts(token),
          adminApi.listPayments(token, { limit: 1 }),
          adminApi.listRewardJobs(token, { limit: 1, status: 'pending_claim' }),
        ]);
        if (cancelled) return;
        setStats({
          users: users.total,
          products: products.items.length,
          payments: payments.total,
          pendingJobs: jobs.total,
          loading: false,
          error: null,
        });
      } catch (e) {
        if (cancelled) return;
        setStats((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : 'Erreur' }));
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  if (stats.loading) return <p className="text-stone-400">Chargement…</p>;
  if (stats.error) return <p className="text-red-400">{stats.error}</p>;

  const cards = [
    { label: 'Utilisateurs', value: stats.users },
    { label: 'Produits actifs', value: stats.products },
    { label: 'Paiements Stripe', value: stats.payments },
    { label: 'Récompenses en attente', value: stats.pendingJobs },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-100 mb-6">Tableau de bord</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-stone-900/50 border border-amber-900/20 rounded-xl p-5">
            <div className="text-stone-400 text-sm mb-2">{c.label}</div>
            <div className="text-3xl font-bold text-amber-300">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
