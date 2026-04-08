import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#0a0908] flex flex-col items-center justify-center px-4">
      <SEO title="Page introuvable" description="La page que tu cherches n'existe pas." />
      <div className="grain-overlay" aria-hidden="true" />
      <div className="relative text-center max-w-lg">
        <p className="text-[var(--gold)]/80 text-6xl sm:text-8xl font-bold mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          404
        </p>
        <h1 className="text-2xl sm:text-3xl text-stone-200 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
          Page introuvable
        </h1>
        <p className="text-stone-400 mb-10">
          La page que tu cherches n'existe pas ou a été déplacée.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[var(--gold)] text-[#0a0908] font-bold hover:bg-[var(--gold-light)] transition-all duration-300"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            <Home className="w-5 h-5" />
            Accueil
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-[var(--gold)]/50 text-[var(--gold-light)] hover:border-[var(--gold)] hover:bg-[var(--gold)]/10 transition-all duration-300"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>
        </div>
      </div>
    </div>
  );
}
