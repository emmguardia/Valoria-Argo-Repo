import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Coins } from 'lucide-react';
import SEO from '../components/SEO';
import { useUser } from '../context/UserContext';

export default function ConnexionPage() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const { isLoggedIn, ecus, login, logout } = useUser();

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#fefce8]">
        <SEO title="Mon compte" description="Gère ton compte Valoria et tes Écus." url="/connexion" />
        <section className="relative py-20 bg-gradient-to-b from-[#1e3a5f] to-[#152a45] border-b border-[#f59e0b]/20">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="uppercase tracking-[0.35em] text-xs text-[#fbbf24]/90 font-medium">Compte</p>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-white mt-2">Mon compte</h1>
          </div>
        </section>
        <section className="py-16">
          <div className="max-w-md mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Coins className="w-10 h-10 text-amber-600" />
                <span className="text-3xl font-bold text-gray-900">{ecus} Écus</span>
              </div>
              <p className="text-gray-600 mb-8">Tu es connecté.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
                <Link
                  to="/profile"
                  className="px-6 py-3 rounded-xl bg-[#1e3a5f] text-white font-semibold hover:bg-[#152a45] transition-colors"
                >
                  Mon profil
                </Link>
                <Link
                  to="/boutique"
                  className="px-6 py-3 rounded-xl bg-[#1e3a5f] text-white font-semibold hover:bg-[#152a45] transition-colors"
                >
                  Boutique
                </Link>
                <Link
                  to="/ecus"
                  className="px-6 py-3 rounded-xl border-2 border-[#1e3a5f] text-[#1e3a5f] font-semibold hover:bg-[#1e3a5f]/5 transition-colors"
                >
                  Acheter des Écus
                </Link>
                <button
                  type="button"
                  onClick={() => { logout(); navigate('/'); }}
                  className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fefce8]">
      <SEO
        title={isLogin ? 'Connexion' : 'Inscription'}
        description={isLogin ? 'Connecte-toi pour accéder à ton profil et tes Écus.' : 'Crée un compte pour lier ton pseudo Minecraft et gérer tes achats.'}
        url="/connexion"
      />
      <section className="relative py-20 bg-gradient-to-b from-[#1e3a5f] to-[#152a45] border-b border-[#f59e0b]/20">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="uppercase tracking-[0.35em] text-xs text-[#fbbf24]/90 font-medium">Compte</p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-white mt-2">
            {isLogin ? 'Connexion' : 'Inscription'}
          </h1>
          <p className="text-white/80 max-w-2xl mt-4">
            {isLogin
              ? 'Connecte-toi pour accéder à ton profil et tes Écus.'
              : 'Crée un compte pour lier ton pseudo Minecraft et gérer tes achats.'}
          </p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          <div className="flex gap-2 mb-8">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-full font-medium transition-all duration-200 ${
                isLogin ? 'bg-[#1e3a5f] text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#1e3a5f] hover:text-[#1e3a5f]'
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-full font-medium transition-all duration-200 ${
                !isLogin ? 'bg-[#1e3a5f] text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#1e3a5f] hover:text-[#1e3a5f]'
              }`}
            >
              Inscription
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-900/5 border border-gray-100 p-8">
            {isLogin ? (
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const emailInput = form.querySelector<HTMLInputElement>('#email');
                  const pseudo = (emailInput?.value ?? '').trim();
                  login(150, { email: pseudo.includes('@') ? pseudo : '', pseudo: pseudo.includes('@') ? '' : pseudo });
                  navigate('/profile');
                }}
              >
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email ou pseudo
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="email"
                      type="text"
                      placeholder="ton@email.com ou pseudo"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn-valoria-secondary w-full py-3.5"
                >
                  Se connecter
                </button>
              </form>
            ) : (
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const pseudoInput = form.querySelector<HTMLInputElement>('#pseudo');
                  const emailInput = form.querySelector<HTMLInputElement>('#reg-email');
                  login(150, {
                    pseudo: pseudoInput?.value?.trim() ?? '',
                    email: emailInput?.value?.trim() ?? '',
                  });
                  navigate('/profile');
                }}
              >
                <div>
                  <label htmlFor="pseudo" className="block text-sm font-medium text-gray-700 mb-2">
                    Pseudo Minecraft
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="pseudo"
                      type="text"
                      placeholder="TonPseudo"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="reg-email"
                      type="email"
                      placeholder="ton@email.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="reg-password"
                      type="password"
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn-valoria-secondary w-full py-3.5"
                >
                  Créer mon compte
                </button>
              </form>
            )}
            <p className="mt-6 text-center text-sm text-gray-500">
              Démo : la connexion te crédite 150 Écus pour tester la boutique.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
