import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import {
  Copy,
  ArrowRight,
  ChevronDown,
  Swords,
  Hammer,
  Shield,
  Coins,
  Sparkles,
  Fish,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { useState } from 'react';
import { useInView } from '../hooks/useInView';

const SERVER_IP = 'play.valoria.fr';
const DISCORD_URL = 'https://discord.gg/Dvh7Pm53Yd';

function SectionReveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, isInView } = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(24px)',
        transitionDelay: isInView ? `${delay}ms` : '0ms',
      }}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const [copied, setCopied] = useState(false);

  const handleCopyIp = async () => {
    try {
      await navigator.clipboard.writeText(SERVER_IP);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const scrollToNext = () => {
    document.getElementById('chroniques')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <SEO
        title="Valoria Realm"
        description="Serveur Minecraft PvP Faction 1.21.4, thème médiéval. Rejoins les neuf Grandes Nations, forge ton destin et domine le royaume."
        keywords="Valoria, Minecraft, serveur, PvP, Faction, 1.21.4, médiéval, factions"
        url="/"
      />
      {/* Hero - tout sur le background */}
      <section className="relative min-h-screen overflow-hidden -mt-24">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/images/background.png)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0908]/30 via-transparent to-[#0a0908]/90" />

        {/* Contraste renforcé derrière le titre pour le rendre lisible */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 45% at 50% 42%, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 50%, transparent 75%)',
          }}
        />

        <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-24 text-center">
          {/* Titre + sous-titre - Valoria Realm bien mis en avant */}
          <div className="animate-fadeInUp mb-16">
            <h1
              className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-[var(--gold-light)] mb-5 tracking-[0.04em]"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                textShadow:
                  '0 0 100px rgba(212,175,55,0.6), 0 0 50px rgba(212,175,55,0.5), 0 4px 20px rgba(0,0,0,1), 0 2px 4px rgba(0,0,0,0.9), 0 0 0 3px rgba(0,0,0,0.8), 0 0 0 6px rgba(212,175,55,0.25)',
                WebkitTextStroke: '2px rgba(0,0,0,0.5)',
              }}
            >
              Valoria Realm
            </h1>
            <p
              className="text-xl sm:text-2xl md:text-3xl text-stone-300 tracking-[0.25em] uppercase"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 500,
                letterSpacing: '0.25em',
                textShadow: '0 2px 12px rgba(0,0,0,0.6)',
              }}
            >
              Serveur PvP Faction 1.21.4
            </p>
          </div>

          {/* Boutons et infos */}
          <div className="animate-fadeInUp-delay-1 flex flex-wrap items-center justify-center gap-4 sm:gap-5">
            <button
              onClick={handleCopyIp}
              className="group flex items-center gap-3 px-7 py-4 rounded-xl bg-black/40 backdrop-blur-sm border border-[var(--gold)]/40 text-[var(--gold-light)] hover:border-[var(--gold)]/70 hover:bg-black/50 transition-all duration-300"
            >
              {copied ? (
                <span className="font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Copié
                </span>
              ) : (
                <>
                  <span className="font-mono text-lg sm:text-xl tracking-widest">{SERVER_IP}</span>
                  <Copy className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
                </>
              )}
            </button>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-8 py-4 rounded-xl bg-[#5865F2] text-white font-bold hover:bg-[#4752C4] transition-all duration-300 shadow-lg hover:-translate-y-1"
              style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: '0.08em' }}
            >
              <MessageCircle className="w-6 h-6" />
              <span className="uppercase tracking-wider text-base sm:text-lg">Discord</span>
              <ExternalLink className="w-4 h-4 opacity-80" />
            </a>
            <Link
              to="/boutique"
              className="group flex items-center gap-3 px-10 py-4 rounded-xl bg-[var(--gold)] text-[#0a0908] font-bold hover:bg-[var(--gold-light)] transition-all duration-300 shadow-[0_0_40px_rgba(212,175,55,0.35)] hover:shadow-[0_0_50px_rgba(212,175,55,0.45)] hover:-translate-y-1"
              style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: '0.08em' }}
            >
              <span className="uppercase tracking-wider text-base sm:text-lg">Boutique</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Indicateur scroll */}
          <button
            onClick={scrollToNext}
            className="absolute bottom-16 sm:bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[var(--gold-light)]/90 hover:text-[var(--gold-light)] transition-colors cursor-pointer group"
            aria-label="Découvrir"
          >
            <span className="text-sm uppercase tracking-[0.3em]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Découvrir
            </span>
            <ChevronDown className="w-10 h-10 animate-bounceDown group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </section>

      {/* Section Chroniques - Intro avec image */}
      <section id="chroniques" className="relative py-24 sm:py-32 overflow-hidden scroll-mt-20 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-800">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/40 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <SectionReveal>
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              <div className="flex-shrink-0 w-full lg:w-2/5 max-w-sm">
                <div className="relative rounded-2xl overflow-hidden border-2 border-[var(--gold)]/30 shadow-2xl">
                  <img src="/images/background.png" alt="Valoria" className="w-full h-64 sm:h-80 object-cover object-center" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-[var(--gold-light)] font-bold text-lg" style={{ fontFamily: "'Oswald', sans-serif" }}>Valoria Realm</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 text-center lg:text-left">
                <p className="text-amber-400/90 text-sm sm:text-base uppercase tracking-[0.2em] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                  📜 Chroniques de Valoria
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-[var(--gold-light)] mb-8 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Le Nouveau Règne
                </h2>
                <p className="text-stone-200 text-lg sm:text-xl leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  Le silence a duré trop longtemps sur ces terres. Autrefois fragmenté, le monde de Valoria
                  s'éveille sous l'égide de neuf Grandes Nations. Ici, personne ne naît héros ; on le devient
                  par le fer, la sueur et la loyauté envers son clan.
                </p>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Section L'Appel des Nations */}
      <section className="relative py-24 sm:py-32 overflow-hidden bg-gradient-to-b from-slate-800 via-slate-900 to-slate-800">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d4af37\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
        <div className="relative max-w-4xl mx-auto px-6">
          <SectionReveal>
            <div className="flex items-center justify-center gap-3 mb-8">
              <Swords className="w-10 h-10 text-[var(--gold)]" />
              <h2
                className="text-3xl sm:text-4xl md:text-5xl font-semibold text-[var(--gold-light)]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                L'Appel des Nations
              </h2>
            </div>
            <p
              className="text-stone-200 text-lg sm:text-xl leading-relaxed text-center max-w-3xl mx-auto"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Le continent n'appartient à personne, mais tous se battent pour l'arracher à l'oubli. Valoria
              est régie par un équilibre fragile : neuf lignées dominantes, capables d'accueillir chacune les
              plus puissantes factions de guerriers. Votre but est simple : fonder votre village, protéger vos
              frontières et grimper les échelons de la hiérarchie pour que le nom de votre bannière résonne
              lors du jugement mensuel des vainqueurs.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Section L'Héritage de la Forge et des Champs */}
      <section className="relative py-24 sm:py-32 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/40 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-6">
          <SectionReveal>
            <div className="flex items-center justify-center gap-3 mb-16">
              <Hammer className="w-10 h-10 text-[var(--gold)]" />
              <h2
                className="text-3xl sm:text-4xl md:text-5xl font-semibold text-[var(--gold-light)]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                L'Héritage de la Forge et des Champs
              </h2>
            </div>
            <p
              className="text-stone-200 text-lg sm:text-xl leading-relaxed text-center mb-14 max-w-2xl mx-auto"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              À Valoria, votre équipement définit votre destin. Si les paysans se contentent de fer, les
              seigneurs, eux, traquent des reliques spécifiques :
            </p>
          </SectionReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <SectionReveal delay={0}>
              <div className="p-8 rounded-2xl bg-slate-800/60 border border-slate-600/50 hover:border-[var(--gold)]/40 hover:-translate-y-1 transition-all duration-300 h-full">
                <div className="w-14 h-14 rounded-xl bg-[var(--gold)]/20 flex items-center justify-center mb-6">
                  <Hammer className="w-7 h-7 text-[var(--gold)]" />
                </div>
                <h3 className="text-xl font-bold text-[var(--gold-light)] mb-4" style={{ fontFamily: "'Oswald', sans-serif" }}>
                  Les Outils de Maître
                </h3>
                <p className="text-stone-300 leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  Le Marteau 3x3 pour éventrer la roche, le Bâton de vente pour échanger vos ressources, et les
                  Houes de farm pour dompter la terre.
                </p>
              </div>
            </SectionReveal>
            <SectionReveal delay={100}>
              <div className="p-8 rounded-2xl bg-slate-800/60 border border-slate-600/50 hover:border-[var(--gold)]/40 hover:-translate-y-1 transition-all duration-300 h-full">
                <div className="w-14 h-14 rounded-xl bg-[var(--gold)]/20 flex items-center justify-center mb-6">
                  <Shield className="w-7 h-7 text-[var(--gold)]" />
                </div>
                <h3 className="text-xl font-bold text-[var(--gold-light)] mb-4" style={{ fontFamily: "'Oswald', sans-serif" }}>
                  L'Armure de Farm
                </h3>
                <p className="text-stone-300 leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  Seule parure accessible par le craft, elle confère la Célérité et la Vision Nocturne pour
                  travailler sans relâche, même dans les ténèbres.
                </p>
              </div>
            </SectionReveal>
            <SectionReveal delay={200}>
              <div className="p-8 rounded-2xl bg-slate-800/60 border border-slate-600/50 hover:border-[var(--gold)]/40 hover:-translate-y-1 transition-all duration-300 h-full">
                <div className="w-14 h-14 rounded-xl bg-[var(--gold)]/20 flex items-center justify-center mb-6">
                  <Swords className="w-7 h-7 text-[var(--gold)]" />
                </div>
                <h3 className="text-xl font-bold text-[var(--gold-light)] mb-4" style={{ fontFamily: "'Oswald', sans-serif" }}>
                  Les Parures de Guerre
                </h3>
                <ul className="text-stone-300 leading-relaxed space-y-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  <li><strong className="text-[var(--gold-light)]">Combattant</strong> : vitesse d'attaque décuplée.</li>
                  <li><strong className="text-[var(--gold-light)]">Guerrier</strong> : deux cœurs de vitalité supplémentaires.</li>
                  <li><strong className="text-[var(--gold-light)]">Souverain</strong> : fusion ultime, bonus de vie et vitesse.</li>
                </ul>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* Section La Loi du Commerce Brut - image à droite comme Chroniques */}
      <section className="relative py-24 sm:py-32 overflow-hidden bg-gradient-to-b from-slate-800 via-slate-900 to-slate-800">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/40 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <SectionReveal>
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              <div className="flex-1 text-center lg:text-left order-2 lg:order-1">
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
                  <Coins className="w-10 h-10 text-[var(--gold)]" />
                  <h2
                    className="text-3xl sm:text-4xl md:text-5xl font-semibold text-[var(--gold-light)]"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    La Loi du Commerce Brut
                  </h2>
                </div>
                <p
                  className="text-stone-200 text-lg sm:text-xl leading-relaxed"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Oubliez la sécurité des marchés protégés : à Valoria, l'Hôtel des Ventes n'existe pas. Chaque
                  échange est une épreuve de force. Les trocs se font face à face, dans l'ombre des ruelles ou au
                  cœur des plaines, là où le vol et les traquenards font partie intégrante du commerce. Ici, un
                  coffre plein ne se vend pas, il se défend.
                </p>
              </div>
              <div className="flex-shrink-0 w-full lg:w-2/5 max-w-sm order-1 lg:order-2">
                <div className="relative rounded-2xl overflow-hidden border-2 border-[var(--gold)]/30 shadow-2xl">
                  <img src="/images/background.png" alt="Valoria" className="w-full h-64 sm:h-80 object-cover object-center" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-[var(--gold-light)] font-bold text-lg" style={{ fontFamily: "'Oswald', sans-serif" }}>Commerce & Troc</span>
                  </div>
                </div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Section Les Failles et le Chaos */}
      <section className="relative py-24 sm:py-32 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/40 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-6">
          <SectionReveal>
            <div className="flex items-center justify-center gap-3 mb-16">
              <Sparkles className="w-10 h-10 text-[var(--gold)]" />
              <h2
                className="text-3xl sm:text-4xl md:text-5xl font-semibold text-[var(--gold-light)]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Les Failles et le Chaos
              </h2>
            </div>
            <p
              className="text-stone-200 text-lg sm:text-xl leading-relaxed text-center mb-14 max-w-2xl mx-auto"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Le monde est instable et laisse parfois place à des phénomènes inexpliqués :
            </p>
          </SectionReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <SectionReveal delay={0}>
              <div className="p-8 rounded-2xl bg-slate-800/60 border border-slate-600/50 hover:border-[var(--gold)]/40 hover:-translate-y-1 transition-all duration-300">
                <h3 className="text-xl font-bold text-[var(--gold-light)] mb-4" style={{ fontFamily: "'Oswald', sans-serif" }}>
                  La Dimension Éphémère
                </h3>
                <p className="text-stone-300 leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  Une faille s'ouvre rarement, menant vers un lieu oublié. Ceux qui osent y entrer peuvent
                  traquer des créatures relâchant des reliques mystérieuses, bien loin de ce que l'on trouve
                  sur les terres connues.
                </p>
              </div>
            </SectionReveal>
            <SectionReveal delay={150}>
              <div className="p-8 rounded-2xl bg-slate-800/60 border border-slate-600/50 hover:border-[var(--gold)]/40 hover:-translate-y-1 transition-all duration-300">
                <h3 className="text-xl font-bold text-[var(--gold-light)] mb-4" style={{ fontFamily: "'Oswald', sans-serif" }}>
                  L'Épreuve du FFA
                </h3>
                <p className="text-stone-300 leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  Une arène de sang où chaque guerrier devient un inconnu. Les noms s'effacent, les identités
                  disparaissent ; seul le dernier survivant pourra réclamer la gloire.
                </p>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* Section Le Lien avec les Familiers */}
      <section className="relative py-24 sm:py-32 overflow-hidden bg-gradient-to-b from-slate-800 via-slate-900 to-slate-800">
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <SectionReveal>
            <div className="flex items-center justify-center gap-3 mb-8">
              <Fish className="w-10 h-10 text-[var(--gold)]" />
              <h2
                className="text-3xl sm:text-4xl md:text-5xl font-semibold text-[var(--gold-light)]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Le Lien avec les Familiers
              </h2>
            </div>
            <p
              className="text-stone-200 text-lg sm:text-xl leading-relaxed"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Dans les eaux de Valoria se cachent des espèces de poissons rares. La pêche est vitale : c'est le
              seul moyen de nourrir vos Familiers, ces compagnons qui vous épaulent dans vos aventures. Sans
              ces prises spécifiques, vos alliés ne pourront pas regagner leurs forces.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative py-24 sm:py-32 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-[#0a0908]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d4af37\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
        <div className="relative max-w-2xl mx-auto px-6 text-center">
          <SectionReveal>
            <h2
              className="text-3xl sm:text-4xl font-semibold text-[var(--gold-light)] mb-10"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Prêt à rejoindre le royaume ?
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <button
                onClick={handleCopyIp}
                className="group flex items-center gap-3 px-8 py-4 rounded-xl bg-black/50 backdrop-blur-sm border border-[var(--gold)]/50 text-[var(--gold-light)] hover:border-[var(--gold)] hover:bg-black/60 transition-all duration-300"
              >
                {copied ? (
                  <span style={{ fontFamily: "'Playfair Display', serif" }}>Copié</span>
                ) : (
                  <>
                    <span className="font-mono text-lg tracking-widest">{SERVER_IP}</span>
                    <Copy className="w-5 h-5 opacity-70 group-hover:opacity-100" />
                  </>
                )}
              </button>
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 px-10 py-4 rounded-xl bg-[#5865F2] text-white font-bold hover:bg-[#4752C4] transition-all duration-300 hover:-translate-y-1"
                style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: '0.08em' }}
              >
                <MessageCircle className="w-5 h-5" />
                <span className="uppercase tracking-wider">Discord</span>
                <ExternalLink className="w-4 h-4 opacity-80" />
              </a>
              <Link
                to="/boutique"
                className="group flex items-center gap-3 px-10 py-4 rounded-xl bg-[var(--gold)] text-[#0a0908] font-bold hover:bg-[var(--gold-light)] transition-all duration-300 shadow-[0_0_40px_rgba(212,175,55,0.35)] hover:shadow-[0_0_50px_rgba(212,175,55,0.45)] hover:-translate-y-1"
                style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: '0.08em' }}
              >
                <span className="uppercase tracking-wider">Boutique</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/votes"
                className="px-10 py-4 rounded-xl border-2 border-[var(--gold)]/50 text-[var(--gold-light)] hover:border-[var(--gold)] hover:bg-[var(--gold)]/10 transition-all duration-300 font-semibold"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Voter
              </Link>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Bouton Discord flottant - toujours visible */}
      <a
        href={DISCORD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-3 px-5 py-3 rounded-full bg-[#5865F2] text-white font-bold shadow-lg hover:bg-[#4752C4] hover:scale-105 transition-all duration-300 hover:shadow-[0_10px_30px_-5px_rgba(88,101,242,0.5)]"
        style={{ fontFamily: "'Oswald', sans-serif" }}
        aria-label="Rejoindre le Discord"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="hidden sm:inline">Discord</span>
      </a>
    </>
  );
}
