import { Navigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, profile } = useUser();
  if (!isLoggedIn) return <Navigate to="/connexion" replace />;
  if (profile?.role !== 'admin') {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="text-3xl font-bold text-stone-100 mb-4">Accès refusé</h1>
        <p className="text-stone-400">Cette zone est réservée aux administrateurs.</p>
      </div>
    );
  }
  return <>{children}</>;
}
