import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';

const HomePage = lazy(() => import('./pages/HomePage'));
const BoutiquePage = lazy(() => import('./pages/BoutiquePage'));
const VotesPage = lazy(() => import('./pages/VotesPage'));
const ClassementPage = lazy(() => import('./pages/ClassementPage'));
const WikiPage = lazy(() => import('./pages/WikiPage'));
const WikiSiegesPage = lazy(() => import('./pages/WikiSiegesPage'));
const WikiNationsPage = lazy(() => import('./pages/WikiNationsPage'));
const ConnexionPage = lazy(() => import('./pages/ConnexionPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const MentionsLegalesPage = lazy(() => import('./pages/MentionsLegalesPage'));
const CGVPage = lazy(() => import('./pages/CGVPage'));
const ReglesPage = lazy(() => import('./pages/ReglesPage'));
const RejoindrePage = lazy(() => import('./pages/RejoindrePage'));
const VerifierEmailPage = lazy(() => import('./pages/VerifierEmailPage'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminPaymentsPage = lazy(() => import('./pages/admin/AdminPaymentsPage'));
const AdminRewardJobsPage = lazy(() => import('./pages/admin/AdminRewardJobsPage'));
const AdminServerPage = lazy(() => import('./pages/admin/AdminServerPage'));
const AdminStatsPage = lazy(() => import('./pages/admin/AdminStatsPage'));
const RequireAdmin = lazy(() => import('./components/admin/RequireAdmin'));

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    // Ancre (ex. /boutique#recharger) : la page est chargée en différé, on attend que la section existe
    let tries = 0;
    const timer = window.setInterval(() => {
      const target = document.getElementById(hash.slice(1));
      if (target || ++tries > 30) {
        window.clearInterval(timer);
        target?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [pathname, hash]);
  return null;
}

// Ancienne page /ecus (liens et retours Stripe d'avant) : la recharge d'Écus est sur la boutique
function EcusRedirect() {
  const { search } = useLocation();
  return <Navigate to={search ? `/boutique${search}` : '/boutique#recharger'} replace />;
}

// Mesure d'audience anonyme : une page vue envoyée au site, sans cookie ni identifiant (Backend statsService).
// Rien n'est envoyé si le navigateur demande à ne pas être suivi, ni pour les pages admin.
function PageViews() {
  const { pathname } = useLocation();
  useEffect(() => {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === '1' || nav.globalPrivacyControl || pathname.startsWith('/admin')) return;
    const body = JSON.stringify({ p: pathname, r: document.referrer });
    try {
      if (!navigator.sendBeacon('/api/stats/v', new Blob([body], { type: 'application/json' }))) throw new Error();
    } catch {
      fetch('/api/stats/v', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
    }
  }, [pathname]);
  return null;
}

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-[var(--gold)]/30 border-t-[var(--gold)] animate-spin" />
        <p className="text-brume-500">Chargement...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-nuit-900">
        <ScrollToTop />
        <PageViews />
        <Header />
        <div className="pt-24">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/boutique" element={<BoutiquePage />} />
              <Route path="/votes" element={<VotesPage />} />
              <Route path="/classement" element={<ClassementPage />} />
              <Route path="/wiki" element={<WikiPage />} />
              <Route path="/wiki/sieges" element={<WikiSiegesPage />} />
              <Route path="/wiki/nations" element={<WikiNationsPage />} />
              <Route path="/connexion" element={<ConnexionPage />} />
              {/* Ancienne page des Écus (et retours Stripe d'avant) : tout est sur la boutique */}
              <Route path="/ecus" element={<EcusRedirect />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
              <Route path="/cgv" element={<CGVPage />} />
              <Route path="/regles" element={<ReglesPage />} />
              <Route path="/rejoindre" element={<RejoindrePage />} />
              <Route path="/verifier-email" element={<VerifierEmailPage />} />
              <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="products" element={<AdminProductsPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="payments" element={<AdminPaymentsPage />} />
                <Route path="reward-jobs" element={<AdminRewardJobsPage />} />
                <Route path="serveur" element={<AdminServerPage />} />
                <Route path="statistiques" element={<AdminStatsPage />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </div>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}

export default App;
