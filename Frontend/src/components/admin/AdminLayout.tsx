import { NavLink, Outlet } from 'react-router-dom';
import { Package, Users, CreditCard, Gift, LayoutDashboard } from 'lucide-react';

const links = [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Produits', icon: Package },
  { to: '/admin/users', label: 'Utilisateurs', icon: Users },
  { to: '/admin/payments', label: 'Paiements', icon: CreditCard },
  { to: '/admin/reward-jobs', label: 'Livraisons', icon: Gift },
];

export default function AdminLayout() {
  return (
    <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
      <aside className="bg-[#14110f] border border-amber-900/30 rounded-xl p-4 h-fit sticky top-28">
        <div className="text-amber-400 font-bold text-lg mb-4 px-3">Admin Valoria</div>
        <nav className="flex flex-col gap-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-600/30'
                    : 'text-stone-400 hover:bg-stone-800/40 hover:text-stone-200'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="bg-[#14110f] border border-amber-900/30 rounded-xl p-6 min-h-[60vh]">
        <Outlet />
      </main>
    </div>
  );
}
