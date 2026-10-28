import { Link } from 'react-router-dom';
import { Fish, Flag, Gift, Hammer, MessageCircle, Plus, Shield, Sparkles, type LucideIcon } from 'lucide-react';
import SEO from '../components/SEO';
import CopyIpButton from '../components/CopyIpButton';
import { useInView } from '../hooks/useInView';
import { DISCORD_URL, MC_VERSION, SERVER_IP } from '../data/site';

// Chiffres et bonus relevés dans les configs du serveur (FactionsNations, FoxJobs, FoxArmors)
const STATS = [
  { value: '9', label: 'Nations' },
  { value: '5', label: 'Métiers' },
  { value: '100', label: 'Niveaux par métier' },
  { value: '4', label: 'Armures de set' },
];

interface Pilier {
  tag: string;
  title: string;
  text: string;
  icon: LucideIcon;
  /** Capture en jeu ; tant qu'elle manque, l'icône prend la place */
  image?: string;
  /** Pas encore en jeu : la carte affiche un badge « Bientôt » */
  soon?: boolean;
}

const PILIERS: Pilier[] = [
  {
    tag: '9 nations',
    title: "L'Appel des Nations",
    text: "Ta faction rejoint l'une des neuf nations et tous ses membres profitent de son bonus permanent. Jusqu'à 10 factions par nation.",
    icon: Flag,
    image: '/images/piliers/nations.webp',
  },
  {
    tag: '5 métiers · 100 niveaux',
    title: 'Grimpe les échelons',
    text: "Bûcheron, chasseur, fermier, mineur et pêcheur : monte chaque métier jusqu'au niveau 100. Revends ta récolte d'un coup avec le bâton de vente.",
    icon: Hammer,
    image: '/images/piliers/metiers.webp',
  },
  {
    tag: '4 armures',
    title: 'Les Parures de Guerre',
    text: 'Farm pour la vitesse et la vision nocturne, Combattant pour la Célérité, Guerrier pour deux cœurs de plus, Souverain pour les deux.',
    icon: Shield,
    image: '/images/piliers/armures.webp',
  },
  {
    tag: 'Events · Battle Pass',
    title: 'Airdrops et Battle Pass',
    text: 'Des largages de 7 à 20 coffres tombent sur la carte, le Battle Pass propose des quêtes chaque jour, et chaque connexion quotidienne rapporte une récompense.',
    icon: Gift,
    image: '/images/piliers/events.webp',
  },
  {
    tag: 'Pêche · familiers',
    title: 'Pêche pour tes alliés',
    text: 'Des poissons rares à pêcher pour nourrir des familiers qui combattent à tes côtés. En préparation.',
    icon: Fish,
    image: '/images/piliers/peche.webp',
    soon: true,
  },
  {
    tag: 'Failles · KOTH',
    title: 'Dimension Éphémère et KOTH',
    text: "Une faille vers un lieu oublié et ses boss, puis des KOTH pour se disputer le contrôle d'une zone. En préparation.",
    icon: Sparkles,
    image: '/images/piliers/failles.webp',
    soon: true,
  },
];

const NATIONS = [
  { name: 'Francs', bonus: '+4 % de dégâts' },
  { name: 'Anglo-Saxons', bonus: "+8 % de dégâts à l'arc" },
  { name: 'Vikings', bonus: '+9 % de vitesse' },
  { name: 'Chine médiévale', bonus: 'Célérité I et vision nocturne' },
  { name: 'Bohémiens', bonus: '-20 % de dégâts subis' },
  { name: 'Bretons', bonus: "Une potion d'invisibilité toutes les 48 h" },
  { name: 'Aragonais', bonus: '+12 % de recul et résistance au feu' },
  { name: 'Turcs seldjoukides', bonus: 'Chance IV et +8 % de dégâts critiques' },
  { name: 'Byzantins', bonus: "-25 % de dégâts d'explosion" },
];

const ETAPES = [
  { title: `Lance Minecraft Java ${MC_VERSION}`, text: `Depuis le launcher officiel, choisis la version ${MC_VERSION}.` },
  { title: 'Multijoueur, puis Ajouter', text: 'Clique sur Multijoueur, puis sur Ajouter un serveur.' },
  { title: "Colle l'adresse et entre", text: `Adresse : ${SERVER_IP}. Enregistre, puis rejoins le royaume.` },
];

const FAQ = [
  {
    q: 'Le serveur est-il gratuit ?',
    a: 'Oui. La boutique propose des grades et des cosmétiques, payés en Écus.',
  },
  {
    q: 'Quelle différence entre Écus et votes ?',
    a: "Les votes se gagnent en votant une fois par jour sur chaque site partenaire. Les Écus s'achètent sur le site et servent dans la boutique.",
  },
  {
    q: 'Comment fonctionnent les nations ?',
    a: "C'est ta faction qui rejoint une nation. Son bonus s'applique alors à tous ses membres, et une nation accueille jusqu'à 10 factions.",
  },
  {
    q: 'Les métiers ont-ils une limite ?',
    a: "Oui, chacun des 5 métiers monte jusqu'au niveau 100.",
  },
];

function SectionReveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, isInView } = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${className}`}
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

function DiscordButton({ label = 'Rejoindre le Discord' }: { label?: string }) {
  return (
    <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="btn-3d btn-nuit">
      <MessageCircle className="h-5 w-5" aria-hidden="true" />
      {label}
    </a>
  );
}

export default function HomePage() {
  return (
    <>
      <SEO
        title="Valoria — Serveur Minecraft faction médiéval"
        description={`Serveur Minecraft faction médiéval ${MC_VERSION}. Rejoins l'une des neuf nations, maîtrise tes métiers, forge ton armure et défends ton coffre.`}
        keywords="Valoria, Minecraft, serveur, faction, PvP, médiéval, nations, métiers"
        url="/"
      />

      {/* Hero */}
      <section className="bandeau-nuit -mt-24 flex flex-col items-center px-5 pb-36 pt-36 text-center">
        <img
          src="/images/logo.webp"
          alt="Valoria"
          width={1400}
          height={1417}
          fetchPriority="high"
          className="animate-fadeInUp h-auto w-[min(460px,78vw)] drop-shadow-[0_18px_30px_rgb(0_0_0/0.45)]"
        />
        <h1 className="animate-fadeInUp-delay-1 mt-1 text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.05] text-white [text-shadow:0_4px_0_#0a1228,0_10px_30px_rgb(0_0_0/0.5)]">
          Neuf nations. Un seul trône.
        </h1>
        <p className="animate-fadeInUp-delay-1 mt-4 max-w-xl text-lg font-semibold leading-relaxed text-brume-200 [text-shadow:0_2px_10px_rgb(0_0_0/0.6)]">
          Serveur Minecraft faction médiéval. Fonde ta ville, maîtrise tes métiers, forge ton armure et défends ton coffre.
        </p>
        <div className="animate-fadeInUp-delay-2 mt-8 flex flex-wrap justify-center gap-4">
          <CopyIpButton className="min-h-[3.75rem] px-7 text-[1.375rem]" />
          <DiscordButton />
        </div>
        <p className="animate-fadeInUp-delay-2 mt-5 rounded-full border border-ciel/20 bg-nuit-900/70 px-4 py-2 text-sm font-extrabold text-brume-300">
          Minecraft Java {MC_VERSION}
        </p>
      </section>

      {/* Chiffres */}
      <section aria-label="Valoria en chiffres" className="relative z-10 mx-auto -mt-[70px] max-w-[69rem] px-5">
        <dl className="grid grid-cols-2 gap-1 rounded-3xl border-2 border-or/35 bg-nuit-800 p-2.5 shadow-[0_8px_0_#091127,0_24px_50px_rgb(0_0_0/0.4)] sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col-reverse px-3 py-4 text-center">
              <dt className="mt-2 text-[13px] font-black uppercase tracking-[0.14em] text-brume-300">{s.label}</dt>
              <dd className="font-display text-5xl leading-none text-or [text-shadow:0_3px_0_var(--color-brique)]">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Piliers */}
      <section id="piliers" className="mx-auto max-w-[75rem] scroll-mt-28 px-5 pb-10 pt-28">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <p className="kicker">Ce qui t'attend</p>
          <h2 className="titre-section mt-3 text-[clamp(2.1rem,4.2vw,3.1rem)]">Personne ne naît héros à Valoria</h2>
          <p className="mt-4 text-lg leading-relaxed text-brume-500">
            On le devient par le fer, la sueur et la loyauté envers son clan. Quatre piliers dès l'ouverture, deux autres en préparation.
          </p>
        </SectionReveal>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PILIERS.map((p, i) => {
            const Icon = p.icon;
            return (
              <SectionReveal key={p.title} delay={(i % 3) * 100}>
                <article className="carte carte-survol flex h-full flex-col overflow-hidden">
                  <div className="relative flex aspect-video items-center justify-center bg-nuit-700">
                    {p.image ? (
                      <>
                        <img
                          src={p.image}
                          alt=""
                          width={960}
                          height={540}
                          loading="lazy"
                          className={`h-full w-full object-cover ${p.soon ? 'opacity-60 saturate-50' : ''}`}
                        />
                        {p.soon && (
                          <span className="absolute right-3 top-3 rounded-lg bg-ciel px-2.5 py-1 text-xs font-black tracking-[0.12em] text-[#062033]">
                            BIENTÔT
                          </span>
                        )}
                        <span className="absolute bottom-3 left-3 flex h-11 w-11 items-center justify-center rounded-xl bg-nuit-900/85 shadow-[0_3px_0_#050b1c]">
                          <Icon className="h-6 w-6 text-or" strokeWidth={2.2} aria-hidden="true" />
                        </span>
                      </>
                    ) : (
                      <Icon className="h-16 w-16 text-or drop-shadow-[0_4px_0_var(--color-brique)]" strokeWidth={2} aria-hidden="true" />
                    )}
                  </div>
                  <div className="p-6 pb-7">
                    <span className="inline-block rounded-lg bg-or/15 px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] text-or">
                      {p.tag}
                    </span>
                    <h3 className="mt-3 text-[1.625rem] text-white">{p.title}</h3>
                    <p className="mt-2.5 leading-relaxed text-brume-400">{p.text}</p>
                  </div>
                </article>
              </SectionReveal>
            );
          })}
        </div>
      </section>

      {/* Nations */}
      <section id="nations" className="mx-auto max-w-[75rem] scroll-mt-28 px-5 py-20">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <p className="kicker">Choisis ton camp</p>
          <h2 className="titre-section mt-3 text-[clamp(2.1rem,4.2vw,3.1rem)]">Neuf nations, neuf façons de combattre</h2>
          <p className="mt-4 text-lg leading-relaxed text-brume-500">
            Chaque nation donne un bonus permanent à tous ses membres et accueille jusqu'à 10 factions.
          </p>
        </SectionReveal>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NATIONS.map((n) => (
            <li key={n.name} className="carte flex items-center gap-4 p-5">
              <span
                aria-hidden="true"
                className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-or font-display text-2xl text-encre shadow-[0_4px_0_var(--color-or-fonce)]"
              >
                {n.name[0]}
              </span>
              <div className="min-w-0">
                <h3 className="text-[1.375rem] text-white">{n.name}</h3>
                <p className="mt-0.5 font-bold text-brume-400">{n.bonus}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Rejoindre */}
      <section id="rejoindre" className="mx-auto max-w-[75rem] scroll-mt-28 px-5 pb-20 pt-14">
        <SectionReveal className="text-center">
          <p className="kicker">En 2 minutes</p>
          <h2 className="titre-section mt-3 text-[clamp(2.1rem,4.2vw,3.1rem)]">Comment nous rejoindre</h2>
        </SectionReveal>
        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {ETAPES.map((e, i) => (
            <li key={e.title} className="carte p-7">
              <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-or font-display text-3xl text-encre shadow-[0_4px_0_var(--color-or-fonce)]">
                {i + 1}
              </span>
              <h3 className="mt-5 text-[1.375rem] text-white">{e.title}</h3>
              <p className="mt-2 leading-relaxed text-brume-400">{e.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-dashed border-or/40 bg-nuit-850 px-6 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brume-600">Adresse du serveur</p>
            <p className="mt-1 font-display text-3xl tracking-wide text-white">{SERVER_IP}</p>
          </div>
          <CopyIpButton label="Copier l'adresse" />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-[54rem] px-5 pb-24 pt-10">
        <h2 className="titre-section text-center text-[clamp(2rem,4vw,2.75rem)]">Questions fréquentes</h2>
        <div className="mt-9 flex flex-col gap-3">
          {FAQ.map((f) => (
            <details key={f.q} className="carte group px-5">
              <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-3 text-[17px] font-extrabold text-white [&::-webkit-details-marker]:hidden">
                {f.q}
                <Plus className="h-6 w-6 shrink-0 text-or transition-transform group-open:rotate-45" strokeWidth={3} aria-hidden="true" />
              </summary>
              <p className="pb-5 leading-relaxed text-brume-400">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Appel final */}
      <section className="px-5 pb-24">
        <div className="mx-auto flex max-w-[62rem] flex-col items-center rounded-[1.75rem] border-2 border-or/35 bg-nuit-800 px-6 py-[clamp(2rem,5vw,3.75rem)] text-center shadow-[0_8px_0_#091127]">
          <img src="/images/icon.webp" alt="" width={96} height={96} loading="lazy" className="h-24 w-24" />
          <h2 className="titre-section mt-4 text-[clamp(2rem,4vw,3rem)]">Ta bannière t'attend.</h2>
          <p className="mt-3 text-lg text-brume-500">Choisis ta nation et entre dans le royaume.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3.5">
            <CopyIpButton />
            <DiscordButton label="Discord" />
            <Link to="/votes" className="btn-3d btn-contour">
              Voter
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
