import { Shield, Swords, Ban, AlertTriangle, Flag } from 'lucide-react';
import SEO from '../components/SEO';

// Même règlement que /rules en jeu (plugins/Essentials/rules.txt du serveur), en détaillé.
// Le barème des sanctions est celui du menu /sanction du staff (section sanctions de ValoriaCore).
const SANCTIONS = [
  { faute: 'Insultes, manque de respect', paliers: 'mute 1 h → mute 24 h → ban 3 jours → ban 30 jours' },
  { faute: 'Harcèlement, discrimination', paliers: 'mute 24 h → ban 7 jours → ban définitif' },
  { faute: 'Triche, hack, mod interdit', paliers: 'ban 30 jours → ban définitif' },
  { faute: 'Multi-comptes', paliers: 'ban 7 jours → ban 30 jours → ban définitif' },
  { faute: 'Pseudo ou skin offensant', paliers: 'kick → ban 1 jour → ban définitif' },
  { faute: 'Publicité', paliers: 'mute 24 h → ban 7 jours → ban définitif' },
  { faute: 'Bug, glitch, duplication', paliers: 'ban 7 jours → ban 30 jours → ban définitif' },
  { faute: 'Spam, flood, toxicité', paliers: 'avertissement → mute 30 min → mute 6 h → mute 24 h' },
  { faute: 'Vente hors des canaux officiels', paliers: 'ban 7 jours → ban définitif' },
];

export default function ReglesPage() {
  return (
    <div className="valoria-page-shell">
      <SEO
        title="Règles"
        description="Règles du serveur Valoria : respect, triche, multi-comptes, PvP, raids et sièges, et le barème des sanctions."
        keywords="règles, Valoria, Minecraft, PvP, Faction, serveur, sanctions"
        url="/regles"
      />
      <section className="valoria-page-hero">
        <div className="valoria-page-container">
          <p className="valoria-page-kicker">Serveur</p>
          <h1 className="valoria-page-title">Règles du serveur</h1>
          <p className="valoria-page-subtitle">Les mêmes qu'en jeu (/rules). Respecte-les pour une partie équitable et agréable pour tous.</p>
        </div>
      </section>
      <section className="valoria-page-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="valoria-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-8 h-8 text-[#1e3a5f]" />
                <h2 className="text-2xl font-bold text-gray-900">Respect</h2>
              </div>
              <ul className="space-y-3 valoria-text-muted list-disc list-inside">
                <li>Respecte les joueurs et le staff : pas d'insultes, de harcèlement ni de discrimination.</li>
                <li>Un pseudo et un skin corrects, sans contenu offensant.</li>
                <li>Pas de spam, de flood ni de comportement toxique, en jeu comme sur le Discord.</li>
                <li>Pas de publicité pour d'autres serveurs.</li>
              </ul>
            </div>
            <div className="valoria-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <Ban className="w-8 h-8 text-red-500" />
                <h2 className="text-2xl font-bold text-gray-900">Triche et abus</h2>
              </div>
              <ul className="space-y-3 valoria-text-muted list-disc list-inside">
                <li>Pas de triche, de hack ni de mod non autorisé : X-Ray, fly, kill aura, auto-clic… Seuls les mods de performance (Sodium, OptiFine…) sont acceptés. Un anticheat surveille le serveur.</li>
                <li>Pas de bug, de glitch ni de duplication pour prendre l'avantage : si tu en trouves un, signale-le au staff.</li>
                <li>Pas de multi-comptes pour abuser des votes, des kits, des récompenses ou des sièges.</li>
                <li>Pas de vente de compte, d'Écus ou d'objets en dehors des canaux officiels.</li>
              </ul>
            </div>
            <div className="valoria-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <Swords className="w-8 h-8 text-[#1e3a5f]" />
                <h2 className="text-2xl font-bold text-gray-900">PvP</h2>
              </div>
              <ul className="space-y-3 valoria-text-muted list-disc list-inside">
                <li>Pas de PvP au spawn, dans le monde minage, ni dans la zone sûre de la warzone.</li>
                <li>La warzone (/warzone) et le monde des factions sont des zones de combat : l'airdrop y tombe chaque soir.</li>
                <li>Pendant un combat, les téléportations sont bloquées. Se déconnecter en combat tue ton personnage et laisse ton stuff au sol.</li>
              </ul>
            </div>
            <div className="valoria-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <Flag className="w-8 h-8 text-[#1e3a5f]" />
                <h2 className="text-2xl font-bold text-gray-900">Raids et sièges</h2>
              </div>
              <ul className="space-y-3 valoria-text-muted list-disc list-inside">
                <li>Raids et pillages font partie du jeu. Hors siège, on raide avec des creepers et des canons à TNT tirés de l'extérieur. Pendant un siège, les attaquants posent de la TNT chez la cible.</li>
                <li>Une base hors de tes terres n'est pas protégée : elle peut être pillée à toute heure.</li>
                <li>Le serveur gère seul ce qui est permis (claims, sièges, alliances) : tout ce que le jeu autorise est autorisé, sauf avec un bug.</li>
              </ul>
            </div>
            <div className="bg-amber-50 rounded-2xl border border-amber-200/60 p-8">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
                <h2 className="text-xl font-bold text-gray-900">Sanctions</h2>
              </div>
              <p className="valoria-text-muted mb-4">
                Chaque faute a son barème. La sanction monte d'un cran à chaque récidive sur 6 mois. Les décisions du staff sont souveraines.
                Un joueur triche ou t'insulte ? Préviens le staff en jeu avec <strong>/signaler &lt;joueur&gt;</strong>.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm valoria-text-muted">
                  <tbody>
                    {SANCTIONS.map((s) => (
                      <tr key={s.faute} className="border-t border-amber-200/60">
                        <td className="py-2 pr-4 font-semibold text-gray-900">{s.faute}</td>
                        <td className="py-2">{s.paliers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
