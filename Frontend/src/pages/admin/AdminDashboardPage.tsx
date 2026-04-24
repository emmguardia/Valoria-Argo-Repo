import { useEffect, useState } from 'react';
import { Users, Package, CreditCard, Gift } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { adminApi } from '../../lib/adminApi';
import { AdminPageHeader, ErrorBanner } from '../../components/admin/ui';

export default function AdminDashboardPage() {
  const { token } = useUser();
  const [stats, setStats] = useState({
    users: 0, products: 0, payments: 0, pendingJobs: 0, loading: true, error: null as string | null,
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

  const cards = [
    { label: 'Utilisateurs', value: stats.users, icon: Users, accent: 'from-blue-500 to-blue-600' },
    { label: 'Produits actifs', value: stats.products, icon: Package, accent: 'from-amber-500 to-amber-600' },
    { label: 'Paiements Stripe', value: stats.payments, icon: CreditCard, accent: 'from-emerald-500 to-emerald-600' },
    { label: 'Récompenses en attente', value: stats.pendingJobs, icon: Gift, accent: 'from-rose-500 to-rose-600' },
  ];

  return (
    <div>
      <AdminPageHeader title="Tableau de bord" subtitle="Vue d'ensemble de l'activité Valoria." />
      <ErrorBanner message={stats.error} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 hover:shadow-lg hover:shadow-stone-200/50 transition">
            <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${accent} opacity-10`} />
            <div className="relative">
              <div className={`inline-flex p-2.5 rounded-lg bg-gradient-to-br ${accent} text-white mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-stone-500 text-xs uppercase tracking-wider font-semibold">{label}</div>
              <div className="text-3xl font-bold text-stone-900 mt-1">
                {stats.loading ? <span className="inline-block w-12 h-8 bg-stone-200 rounded animate-pulse" /> : value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
