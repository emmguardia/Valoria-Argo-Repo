import { NavLink, Outlet } from 'react-router-dom';
import { Package, Users, CreditCard, Gift, LayoutDashboard, Shield } from 'lucide-react';
import SEO from '../SEO';

const links = [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Produits', icon: Package },
  { to: '/admin/users', label: 'Utilisateurs', icon: Users },
  { to: '/admin/payments', label: 'Paiements', icon: CreditCard },
  { to: '/admin/reward-jobs', label: 'Livraisons', icon: Gift },
];

export default function AdminLayout() {
  return (
    <div className="valoria-page-shell">
      <SEO title="Administration" description="Panel d'administration Valoria." url="/admin" />
      <section className="valoria-page-hero">
        <div className="valoria-page-container flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#f59e0b]/20 border border-[#f59e0b]/40">
            <Shield className="w-7 h-7 text-[#fbbf24]" />
          </div>
          <div>
            <p className="valoria-page-kicker">Administration</p>
            <h1 className="valoria-page-title">Panel Valoria</h1>
          </div>
        </div>
      </section>

      <section className="valoria-page-section">
        <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          <aside className="valoria-card p-4 h-fit lg:sticky lg:top-28">
            <nav className="flex flex-col gap-1">
              {links.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-[#1e3a5f] text-white shadow-sm'
                        : 'text-stone-700 hover:bg-amber-50 hover:text-stone-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </aside>
          <main className="valoria-card p-6 sm:p-8 min-h-[60vh]">
            <Outlet />
          </main>
        </div>
      </section>
    </div>
  );
}
