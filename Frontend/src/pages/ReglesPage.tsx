import { Shield, Swords, Ban, AlertTriangle } from 'lucide-react';
import SEO from '../components/SEO';

export default function ReglesPage() {
  return (
    <div className="min-h-screen bg-[#fefce8]">
      <SEO
        title="Règles"
        description="Règles du serveur Valoria. PvP, Factions, grief, respect. Tout ce qu'il faut savoir pour jouer correctement."
        keywords="règles, Valoria, Minecraft, PvP, Faction, serveur"
        url="/regles"
      />
      <section className="relative py-20 bg-gradient-to-b from-[#1e3a5f] to-[#152a45] border-b border-[#f59e0b]/20">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="uppercase tracking-[0.35em] text-xs text-[#fbbf24]/90 font-medium">Serveur</p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-white mt-2">Règles du serveur</h1>
          <p className="text-white/85 max-w-2xl mt-4 text-lg">
            Respecte ces règles pour une expérience de jeu équitable et agréable pour tous.
          </p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-8 h-8 text-[#1e3a5f]" />
                <h2 className="text-2xl font-bold text-gray-900">Règles générales</h2>
              </div>
              <ul className="space-y-3 text-gray-700 list-disc list-inside">
                <li>Respecte tous les joueurs et le staff. Pas d'insultes, de harcèlement ou de discrimination.</li>
                <li>Pas de triche, de hack ou d'utilisation de mods non autorisés (seuls les mods de performance type OptiFine sont acceptés).</li>
                <li>Pas de multi-comptes pour abuser des mécaniques (vote, kits, etc.).</li>
                <li>Le pseudo Minecraft doit être approprié : pas de caractères spéciaux abusifs, pas de contenu offensant.</li>
                <li>Pas de publicité pour d'autres serveurs en jeu ou sur le Discord.</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Swords className="w-8 h-8 text-[#1e3a5f]" />
                <h2 className="text-2xl font-bold text-gray-900">PvP et Factions</h2>
              </div>
              <ul className="space-y-3 text-gray-700 list-disc list-inside">
                <li>Le PvP est autorisé en zone de guerre. Pas de kill dans les zones protégées (spawn, etc.).</li>
                <li>Le grief et le raid des bases ennemies sont autorisés dans le cadre du gameplay Faction.</li>
                <li>Pas de triche, de glitch ou d'exploitation de bugs pour prendre l'avantage.</li>
                <li>Les alliés et ennemis sont définis par le système de factions. Respecte ces mécaniques.</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Ban className="w-8 h-8 text-red-500" />
                <h2 className="text-2xl font-bold text-gray-900">Interdictions</h2>
              </div>
              <ul className="space-y-3 text-gray-700 list-disc list-inside">
                <li>X-Ray, fly, kill aura, speed hacks ou tout autre cheat.</li>
                <li>Exploitation de bugs pour dupliquer des items, du pouvoir ou des ressources.</li>
                <li>Comportement toxique, spam, flood sur le chat ou le Discord.</li>
                <li>Vente ou revente de compte, d'Écus ou de produits en dehors des canaux officiels.</li>
              </ul>
            </div>
            <div className="bg-amber-50 rounded-2xl border border-amber-200/60 p-8">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
                <h2 className="text-xl font-bold text-gray-900">Sanctions</h2>
              </div>
              <p className="text-gray-700">
                En cas de non-respect des règles, le staff se réserve le droit d'appliquer des sanctions (avertissement, mute, kick, ban temporaire ou permanent) selon la gravité du manquement. Les décisions du staff sont souveraines.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
