import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import SEO from '../components/SEO';
import { useUser } from '../context/UserContext';

// Lien reçu par e-mail à l'inscription : /verifier-email?jeton=… confirme l'adresse du compte.
export default function VerifierEmailPage() {
  const [searchParams] = useSearchParams();
  const jeton = searchParams.get('jeton') ?? '';
  const { isLoggedIn, refreshUserData } = useUser();
  const done = useRef(false);
  const [state, setState] = useState<{ tone: 'wait' | 'ok' | 'error'; text: string }>(() =>
    /^[0-9a-f]{64}$/.test(jeton)
      ? { tone: 'wait', text: 'Vérification en cours…' }
      : { tone: 'error', text: 'Ce lien est incomplet. Ouvre le lien de l\'e-mail tel quel, ou demande-en un nouveau depuis ton profil.' },
  );

  useEffect(() => {
    if (done.current || !/^[0-9a-f]{64}$/.test(jeton)) return;
    done.current = true;
    void fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: jeton }),
    })
      .then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload?.error || 'Lien invalide');
        setState({ tone: 'ok', text: 'Ton adresse e-mail est confirmée. Tu peux maintenant acheter des Écus.' });
        if (isLoggedIn) await refreshUserData().catch(() => {});
      })
      .catch((err) => setState({ tone: 'error', text: err instanceof Error ? err.message : 'Lien invalide' }));
  }, [jeton, isLoggedIn, refreshUserData]);

  const Icon = state.tone === 'ok' ? CheckCircle2 : state.tone === 'error' ? AlertCircle : Loader2;
  return (
    <div className="valoria-page-shell">
      <SEO title="Confirmer mon e-mail" description="Confirmation de l'adresse e-mail de ton compte Valoria." url="/verifier-email" />
      <section className="valoria-page-section">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="valoria-card p-8 text-center">
            <Icon
              className={`mx-auto h-12 w-12 ${state.tone === 'ok' ? 'text-emerald-600' : state.tone === 'error' ? 'text-red-600' : 'animate-spin text-[#1e3a5f]'}`}
              aria-hidden="true"
            />
            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              {state.tone === 'ok' ? 'Adresse confirmée' : state.tone === 'error' ? 'Lien non valide' : 'Un instant…'}
            </h1>
            <p className="mt-3 valoria-text-muted" role="status">{state.text}</p>
            <div className="mt-6 flex justify-center gap-3">
              {state.tone === 'ok' && <Link to="/boutique" className="btn-3d btn-or">Aller à la boutique</Link>}
              <Link to={isLoggedIn ? '/profile' : '/connexion'} className="btn-3d btn-nuit">{isLoggedIn ? 'Mon profil' : 'Connexion'}</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
