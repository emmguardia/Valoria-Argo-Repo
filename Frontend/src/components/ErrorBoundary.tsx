import { Component, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0908] flex flex-col items-center justify-center px-4">
          <div className="grain-overlay" aria-hidden="true" />
          <div className="relative text-center max-w-lg">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl text-stone-200 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Une erreur est survenue
            </h1>
            <p className="text-stone-400 mb-10">
              Désolé, quelque chose s'est mal passé. Recharge la page ou retourne à l'accueil.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[var(--gold)] text-[#0a0908] font-bold hover:bg-[var(--gold-light)] transition-all duration-300"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                <RefreshCw className="w-5 h-5" />
                Recharger
              </button>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-[var(--gold)]/50 text-[var(--gold-light)] hover:border-[var(--gold)] hover:bg-[var(--gold)]/10 transition-all duration-300"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Accueil
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
