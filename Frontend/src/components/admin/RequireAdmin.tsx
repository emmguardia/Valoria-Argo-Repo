import { Navigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useUser } from '../../context/UserContext';

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, profile } = useUser();
  if (!isLoggedIn) return <Navigate to="/connexion" replace />;
  if (profile?.role !== 'admin') {
    return (
      <div className="valoria-page-shell">
        <section className="valoria-page-section">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="valoria-card p-12 text-center">
              <div className="inline-flex p-4 rounded-2xl bg-red-100 mb-4">
                <ShieldOff className="w-10 h-10 text-red-600" />
              </div>
              <h1 className="font-display text-3xl text-stone-900 mb-2">Accès refusé</h1>
              <p className="valoria-text-muted">Cette zone est réservée aux administrateurs.</p>
            </div>
          </div>
        </section>
      </div>
    );
  }
  return <>{children}</>;
}
