import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

const DISCORD_URL = 'https://discord.gg/Dvh7Pm53Yd';

export default function Footer() {
  return (
    <footer className="bg-[#f5f0e1] text-stone-700 py-20 border-t border-amber-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-12 mb-12">
          <div>
            <img
              src="/images/icon.png"
              alt=""
              className="h-16 w-16 object-contain mb-5 opacity-90"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <p className="text-stone-600 text-lg leading-relaxed">
              Serveur Minecraft Factions 1.21.4. Thème médiéval.
            </p>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-5 px-5 py-3 rounded-lg border border-stone-400/60 text-stone-600 hover:border-amber-500/60 hover:text-stone-800 transition-all duration-300 text-lg"
            >
              <MessageCircle className="w-5 h-5" />
              Discord
            </a>
          </div>
          <div>
            <h4 className="text-stone-800 font-semibold mb-5 text-base uppercase tracking-[0.2em]">
              Navigation
            </h4>
            <ul className="space-y-3 text-lg">
              <li><Link to="/boutique" className="text-stone-600 hover:text-stone-800 transition-colors">Boutique</Link></li>
              <li><Link to="/votes" className="text-stone-600 hover:text-stone-800 transition-colors">Vote</Link></li>
              <li><Link to="/classement" className="text-stone-600 hover:text-stone-800 transition-colors">Classement</Link></li>
              <li><Link to="/wiki" className="text-stone-600 hover:text-stone-800 transition-colors">Wiki</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-stone-800 font-semibold mb-5 text-base uppercase tracking-[0.2em]">
              Compte
            </h4>
            <ul className="space-y-3 text-lg">
              <li><Link to="/connexion" className="text-stone-600 hover:text-stone-800 transition-colors">Connexion</Link></li>
              <li><Link to="/ecus" className="text-stone-600 hover:text-stone-800 transition-colors">Acheter des Écus</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-stone-800 font-semibold mb-5 text-base uppercase tracking-[0.2em]">
              Légal
            </h4>
            <ul className="space-y-3 text-lg">
              <li><Link to="/mentions-legales" className="text-stone-600 hover:text-stone-800 transition-colors">Mentions légales</Link></li>
              <li><Link to="/cgv" className="text-stone-600 hover:text-stone-800 transition-colors">CGV</Link></li>
              <li><Link to="/regles" className="text-stone-600 hover:text-stone-800 transition-colors">Règles</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-stone-800 font-semibold mb-5 text-base uppercase tracking-[0.2em]">
              Serveur
            </h4>
            <p className="text-lg text-stone-600 font-mono">play.valoria.fr</p>
            <p className="text-lg text-stone-500 mt-1">1.21.4</p>
          </div>
        </div>
        <div className="border-t border-amber-200/60 pt-8 text-center">
          <p className="text-stone-500 text-lg">
            © 2026 · PvP Faction · Thème médiéval
          </p>
        </div>
      </div>
    </footer>
  );
}
