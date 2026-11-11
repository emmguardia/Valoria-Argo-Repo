import { Gamepad2, Info, Link2, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import CopyIpButton from '../components/CopyIpButton';
import { DISCORD_URL, MC_VERSION, SERVER_IP } from '../data/site';

// Comment rejoindre le serveur. Tant que l'adresse passe par playit (gratuit), la liste des serveurs de Minecraft
// affiche « Impossible de se connecter » alors que la connexion directe marche : on l'explique ici.
const ETAPES = [
  { title: `Lance Minecraft Java ${MC_VERSION}`, text: `Depuis le launcher officiel, choisis la version ${MC_VERSION} (Java Edition, pas Bedrock).` },
  { title: 'Multijoueur, puis Connexion directe', text: 'Sur l\'écran Multijoueur, clique sur « Connexion directe ».' },
  { title: "Colle l'adresse et rejoins", text: `Adresse : ${SERVER_IP}, puis « Rejoindre le serveur ».` },
  { title: 'Accepte le pack de ressources', text: 'Il apporte les textures, les menus et les objets de Valoria. Il se télécharge une seule fois.' },
];

export default function RejoindrePage() {
  return (
    <div className="valoria-page-shell">
      <SEO
        title="Rejoindre"
        description={`Rejoindre Valoria : Minecraft Java ${MC_VERSION}, adresse ${SERVER_IP}, en connexion directe.`}
        keywords="rejoindre, adresse, IP, Valoria, Minecraft, serveur, faction"
        url="/rejoindre"
      />
      <section className="valoria-page-hero">
        <div className="valoria-page-container">
          <p className="valoria-page-kicker">Serveur</p>
          <h1 className="valoria-page-title">Rejoindre Valoria</h1>
          <p className="valoria-page-subtitle">Minecraft Java {MC_VERSION}, gratuit. Quatre étapes et tu es dans le royaume.</p>
        </div>
      </section>
      <section className="valoria-page-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="valoria-card p-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-500">Adresse du serveur</p>
              <p className="mt-1 text-3xl font-bold text-gray-900 break-all">{SERVER_IP}</p>
              <p className="mt-1 text-sm valoria-text-muted">Version {MC_VERSION}, Java Edition</p>
            </div>
            <CopyIpButton label="Copier l'adresse" />
          </div>

          <ol className="grid gap-5 sm:grid-cols-2">
            {ETAPES.map((e, i) => (
              <li key={e.title} className="valoria-card p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1e3a5f] text-lg font-bold text-white">{i + 1}</span>
                <h2 className="mt-4 text-xl font-bold text-gray-900">{e.title}</h2>
                <p className="mt-2 valoria-text-muted">{e.text}</p>
              </li>
            ))}
          </ol>

          <div className="valoria-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <Info className="w-8 h-8 text-[#1e3a5f]" />
              <h2 className="text-2xl font-bold text-gray-900">Bon à savoir</h2>
            </div>
            <ul className="space-y-3 valoria-text-muted list-disc list-inside">
              <li>
                Si tu ajoutes le serveur à ta liste, Minecraft peut afficher « Impossible de se connecter » : passe par
                « Connexion directe », ça fonctionne.
              </li>
              <li>Pendant la bêta fermée, seuls les joueurs invités peuvent entrer. L'ouverture sera annoncée sur le Discord.</li>
              <li>Les mods de performance (Sodium, OptiFine…) sont acceptés, pas les mods de triche : voir les <Link to="/regles" className="font-bold text-[#1e3a5f] underline">règles</Link>.</li>
            </ul>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="valoria-card p-6">
              <div className="flex items-center gap-3">
                <Link2 className="w-7 h-7 text-[#1e3a5f]" />
                <h2 className="text-xl font-bold text-gray-900">Lie ton compte</h2>
              </div>
              <p className="mt-3 valoria-text-muted">
                Crée ton compte sur le site, récupère ton code sur ton <Link to="/profile" className="font-bold text-[#1e3a5f] underline">profil</Link>,
                puis tape <code className="font-bold text-[#1e3a5f]">/lier &lt;code&gt;</code> en jeu : tes achats et tes Écus arrivent sur ton personnage.
              </p>
            </div>
            <div className="valoria-card p-6">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-7 h-7 text-[#1e3a5f]" />
                <h2 className="text-xl font-bold text-gray-900">Le Discord</h2>
              </div>
              <p className="mt-3 valoria-text-muted">Annonces, events, aide et recrutement de factions.</p>
              <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 font-bold text-[#1e3a5f] underline">
                <Gamepad2 className="w-5 h-5" aria-hidden="true" /> Rejoindre le Discord<span className="sr-only"> (nouvel onglet)</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
