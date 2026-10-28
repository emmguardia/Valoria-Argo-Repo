import { Coins, LogOut, Menu, MessageCircle, Shield, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { DISCORD_URL } from '../data/site';

const navLinks = [
  { to: '/wiki', label: 'Wiki' },
  { to: '/classement', label: 'Classement' },
  { to: '/votes', label: 'Vote' },
  { to: '/regles', label: 'Règles' },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 font-extrabold transition-colors ${
    isActive ? 'text-white underline decoration-or decoration-[3px] underline-offset-8' : 'text-brume-300 hover:text-white'
  }`;

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, ecus, logout, profile } = useUser();
  const isAdmin = profile?.role === 'admin';
  const onBoutique = location.pathname === '/boutique';

  // Le menu mobile se referme à chaque changement de page
  const [menuPath, setMenuPath] = useState(location.pathname);
  if (menuPath !== location.pathname) {
    setMenuPath(location.pathname);
    setIsMenuOpen(false);
  }

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <div className="mx-auto max-w-[75rem] rounded-2xl border border-ciel/20 bg-nuit-900/80 shadow-[0_10px_30px_rgb(0_0_0/0.3)] backdrop-blur-md">
        <div className="flex min-h-16 items-center justify-between gap-4 px-3 py-2">
          <Link to="/" className="flex items-center gap-2.5 rounded-lg">
            <img src="/images/icon.webp" alt="" width={40} height={40} className="h-10 w-10" />
            <span className="font-display text-2xl tracking-wide text-or">Valoria</span>
          </Link>

          <nav aria-label="Navigation principale" className="hidden items-center gap-2 text-[15px] lg:flex">
            {navLinks.map(({ to, label }) => (
              <NavLink key={to} to={to} className={navLinkClass}>
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Rejoindre le Discord (nouvel onglet)"
              className="hidden h-11 w-11 items-center justify-center rounded-xl text-brume-300 transition-colors hover:bg-ciel/10 hover:text-white sm:flex"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </a>
            <Link
              to="/boutique"
              aria-current={onBoutique ? 'page' : undefined}
              className={`hidden h-11 items-center rounded-xl px-4 text-[15px] font-black transition-colors sm:inline-flex ${
                onBoutique ? 'bg-or text-encre' : 'border-2 border-or/60 text-or hover:bg-or/10'
              }`}
            >
              Boutique
            </Link>
            {isLoggedIn && (
              <Link
                to="/ecus"
                className="hidden h-11 items-center gap-2 rounded-xl bg-nuit-800 px-3 text-[15px] font-extrabold text-or transition-colors hover:bg-nuit-700 md:inline-flex"
              >
                <Coins className="h-5 w-5" aria-hidden="true" />
                <span className="whitespace-nowrap">{ecus} Écus</span>
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden h-11 items-center gap-2 rounded-xl border border-or/40 px-3 text-[15px] font-extrabold text-or hover:bg-or/10 lg:inline-flex"
              >
                <Shield className="h-5 w-5" aria-hidden="true" />
                Admin
              </Link>
            )}
            <Link
              to={isLoggedIn ? '/profile' : '/connexion'}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-ciel/12 px-4 text-[15px] font-extrabold text-brume-100 transition-colors hover:bg-ciel/20"
            >
              <User className="h-[18px] w-[18px]" strokeWidth={2.4} aria-hidden="true" />
              <span className="hidden sm:inline">{isLoggedIn ? (profile?.pseudo ?? 'Profil') : 'Connexion'}</span>
              <span className="sm:hidden">{isLoggedIn ? 'Profil' : 'Connexion'}</span>
            </Link>
            {isLoggedIn && (
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Se déconnecter"
                className="hidden h-11 w-11 items-center justify-center rounded-xl text-brume-300 transition-colors hover:bg-ciel/10 hover:text-white lg:flex"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-expanded={isMenuOpen}
              aria-controls="menu-mobile"
              aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-brume-100 hover:bg-ciel/10 lg:hidden"
            >
              {isMenuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <nav
            id="menu-mobile"
            aria-label="Menu mobile"
            className="animate-slideDown flex flex-col gap-1 border-t border-ciel/15 p-3 text-lg lg:hidden"
          >
            {[{ to: '/', label: 'Accueil' }, ...navLinks, { to: '/boutique', label: 'Boutique' }].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-3 font-extrabold ${isActive ? 'bg-nuit-800 text-or' : 'text-brume-200 hover:bg-nuit-800'}`
                }
              >
                {label}
              </NavLink>
            ))}
            <Link to="/ecus" className="flex items-center gap-3 rounded-xl px-4 py-3 font-extrabold text-or hover:bg-nuit-800">
              <Coins className="h-5 w-5" aria-hidden="true" />
              {isLoggedIn ? `${ecus} Écus` : 'Acheter des Écus'}
            </Link>
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-3 rounded-xl px-4 py-3 font-extrabold text-or hover:bg-nuit-800">
                <Shield className="h-5 w-5" aria-hidden="true" />
                Admin
              </Link>
            )}
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl px-4 py-3 font-extrabold text-brume-200 hover:bg-nuit-800"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              Discord
            </a>
            {isLoggedIn && (
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-left font-extrabold text-brume-200 hover:bg-nuit-800"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
                Déconnexion
              </button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
