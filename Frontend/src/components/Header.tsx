import { Coins, User, Menu, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const navLinks = [
  { to: '/', label: 'Accueil' },
  { to: '/boutique', label: 'Boutique' },
  { to: '/votes', label: 'Vote' },
  { to: '/classement', label: 'Classement' },
  { to: '/wiki', label: 'Wiki' },
  { to: '/regles', label: 'Règles' },
];

const DISCORD_URL = 'https://discord.gg/Dvh7Pm53Yd';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { isLoggedIn, ecus } = useUser();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const allowTransparentTop = location.pathname === '/';
  const isSolid = !allowTransparentTop || isScrolled || isMenuOpen;
  const topTextClass = isSolid ? 'text-stone-600' : 'text-white drop-shadow';
  const topTextHoverClass = isSolid ? 'hover:text-stone-800 hover:bg-amber-50/80' : 'hover:text-white hover:bg-white/10';
  const topTextStrongClass = isSolid ? 'text-stone-800' : 'text-white drop-shadow';

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-50 transition-colors duration-300',
        isSolid
          ? 'bg-[#f5f0e1]/98 backdrop-blur-xl border-b border-amber-200/60 shadow-sm'
          : 'bg-transparent border-b border-transparent shadow-none backdrop-blur-0',
      ].join(' ')}
    >
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24 min-h-[88px]">
          <Link to="/" className="flex items-center group py-4">
            <img src="/images/icon.png" alt="Valoria Realm" className="h-20 w-20 sm:h-24 sm:w-24 object-contain transition-transform group-hover:scale-105" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`text-lg sm:text-xl font-medium transition-all duration-300 px-6 py-5 rounded-lg ${
                  location.pathname === to
                    ? `${topTextStrongClass} ${isSolid ? 'bg-amber-100/70' : 'bg-white/10'}`
                    : `${topTextClass} ${topTextHoverClass}`
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`hidden sm:flex items-center gap-3 px-6 py-4 rounded-lg transition-all duration-300 text-lg sm:text-xl ${topTextClass} ${topTextHoverClass}`}
            >
              <MessageCircle className="w-6 h-6" />
              <span>Discord</span>
            </a>
            <Link
              to="/ecus"
              className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-100/80 border border-amber-300/60 text-stone-800 font-semibold hover:bg-amber-200/80 transition-all duration-300 text-sm sm:text-base"
            >
              <Coins className="w-5 h-5 text-amber-600" />
              <span className="whitespace-nowrap">{isLoggedIn ? `${ecus} Écus` : 'Acheter des Écus'}</span>
            </Link>
            <Link
              to={isLoggedIn ? '/profile' : '/connexion'}
              className={`flex items-center gap-3 px-6 py-4 rounded-lg transition-all duration-300 text-lg sm:text-xl ${topTextClass} ${topTextHoverClass}`}
            >
              <User className="w-6 h-6" />
              <span className="hidden sm:inline">{isLoggedIn ? 'Profil' : 'Connexion'}</span>
            </Link>
            <button
              className={`md:hidden p-5 rounded-lg ${topTextClass} ${topTextHoverClass}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-7 h-7" />
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-amber-200/60 flex flex-col gap-1 animate-slideDown">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setIsMenuOpen(false)}
                className={`py-5 px-6 rounded-lg text-lg font-medium transition-colors ${
                  location.pathname === to ? 'text-stone-800 bg-amber-100/70' : 'text-stone-600'
                }`}
              >
                {label}
              </Link>
            ))}
            <Link
              to="/ecus"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 py-5 px-6 text-stone-600 rounded-lg text-lg font-semibold"
            >
              <Coins className="w-5 h-5" />
              <span className="whitespace-nowrap">{isLoggedIn ? `${ecus} Écus` : 'Acheter des Écus'}</span>
            </Link>
            <Link
              to={isLoggedIn ? '/profile' : '/connexion'}
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 py-5 px-6 text-stone-600 rounded-lg text-lg font-medium"
            >
              <User className="w-5 h-5" />
              {isLoggedIn ? 'Profil' : 'Connexion'}
            </Link>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 py-5 px-6 text-stone-600 rounded-lg text-lg"
            >
              <MessageCircle className="w-6 h-6" />
              Discord
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}
