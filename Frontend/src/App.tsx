import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';

const HomePage = lazy(() => import('./pages/HomePage'));
const BoutiquePage = lazy(() => import('./pages/BoutiquePage'));
const VotesPage = lazy(() => import('./pages/VotesPage'));
const ClassementPage = lazy(() => import('./pages/ClassementPage'));
const WikiPage = lazy(() => import('./pages/WikiPage'));
const ConnexionPage = lazy(() => import('./pages/ConnexionPage'));
const EcusPage = lazy(() => import('./pages/EcusPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const MentionsLegalesPage = lazy(() => import('./pages/MentionsLegalesPage'));
const CGVPage = lazy(() => import('./pages/CGVPage'));
const ReglesPage = lazy(() => import('./pages/ReglesPage'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-[var(--gold)]/30 border-t-[var(--gold)] animate-spin" />
        <p className="text-stone-500">Chargement...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#0a0908]">
        <div className="grain-overlay" aria-hidden="true" />
        <ScrollToTop />
        <Header />
        <div className="pt-24">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/boutique" element={<BoutiquePage />} />
              <Route path="/votes" element={<VotesPage />} />
              <Route path="/classement" element={<ClassementPage />} />
              <Route path="/wiki" element={<WikiPage />} />
              <Route path="/connexion" element={<ConnexionPage />} />
              <Route path="/ecus" element={<EcusPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
              <Route path="/cgv" element={<CGVPage />} />
              <Route path="/regles" element={<ReglesPage />} />
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
