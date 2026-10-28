import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { DISCORD_URL, MC_VERSION, SERVER_IP } from '../data/site';

const columns = [
  {
    title: 'Jouer',
    links: [
      { to: '/wiki', label: 'Wiki' },
      { to: '/classement', label: 'Classement' },
      { to: '/votes', label: 'Vote' },
      { to: '/regles', label: 'Règles' },
    ],
  },
  {
    title: 'Compte',
    links: [
      { to: '/connexion', label: 'Connexion' },
      { to: '/boutique', label: 'Boutique' },
      { to: '/ecus', label: 'Acheter des Écus' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { to: '/mentions-legales', label: 'Mentions légales' },
      { to: '/cgv', label: 'CGV' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-ciel/15 bg-nuit-950 px-5 pb-10 pt-14">
      <div className="mx-auto grid max-w-[75rem] gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-3">
            <img src="/images/icon.webp" alt="" width={44} height={44} className="h-11 w-11" />
            <span className="font-display text-2xl text-or">Valoria</span>
          </div>
          <p className="mt-4 max-w-xs leading-relaxed text-brume-500">
            Serveur Minecraft faction médiéval. Java {MC_VERSION}, adresse{' '}
            <span className="font-extrabold text-brume-200">{SERVER_IP}</span>.
          </p>
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-3d btn-nuit mt-5 min-h-11 px-4 text-base"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            Discord
          </a>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-xs font-black uppercase tracking-[0.18em] text-brume-600 [font-family:var(--font-sans)]">
              {col.title}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="font-bold text-brume-300 transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="mx-auto mt-12 max-w-[75rem] border-t border-ciel/10 pt-6 text-sm text-brume-600">
        © 2026 Valoria · Serveur non affilié à Mojang ni à Microsoft.
      </p>
    </footer>
  );
}
