import { Link } from 'react-router-dom';
import { Fish, Flag, Hammer, MessageCircle, Plus, Shield, Sparkles, Swords, type LucideIcon } from 'lucide-react';
import SEO from '../components/SEO';
import CopyIpButton from '../components/CopyIpButton';
import { useInView } from '../hooks/useInView';
import { DISCORD_URL, MC_VERSION, SERVER_IP } from '../data/site';

const STATS = [
  { value: '9', label: 'Nations' },
  { value: '5', label: 'Métiers' },
  { value: '20', label: 'Poissons rares' },
  { value: '5', label: 'Familiers' },
  { value: '0', label: 'Hôtel des ventes' },
];

interface Pilier {
  tag: string;
  title: string;
  text: string;
  icon: LucideIcon;
  /** Capture en jeu ; tant qu'elle manque, l'icône prend la place */
  image?: string;
}

const PILIERS: Pilier[] = [
  {
    tag: '9 nations',
    title: "L'Appel des Nations",
    text: 'Rejoins une lignée, fonde ton village, protège tes frontières. Ta bannière se joue au jugement mensuel des vainqueurs.',
    icon: Flag,
  },
  {
    tag: '5 métiers · rangs',
    title: 'Grimpe les échelons',
    text: 'Monte tes métiers et tes rangs pour débloquer le monde de minage et le Nether. Outils de maître : marteau 3x3, houes de farm, bâton de vente.',
    icon: Hammer,
  },
  {
    tag: 'Armures',
    title: 'Les Parures de Guerre',
    text: "Combattant pour la vitesse d'attaque, Guerrier pour deux cœurs de plus, Souverain pour les deux. L'armure de farm, elle, se crafte.",
    icon: Shield,
  },
  {
    tag: 'Pêche · familiers',
    title: 'Pêche pour tes alliés',
    text: "20 poissons rares se cachent dans les eaux de Valoria. C'est la seule nourriture de tes familiers : sans tes prises, ils ne regagnent pas leurs forces.",
    icon: Fish,
  },
  {
    tag: 'Failles · boss',
    title: 'La Dimension Éphémère',
    text: "Une faille s'ouvre rarement vers un lieu oublié. Ses créatures relâchent des reliques introuvables sur les terres connues.",
    icon: Sparkles,
  },
  {
    tag: 'Events · PvP',
    title: 'KOTH, Totem et FFA',
    text: "Airdrops au spawn, arène FFA où les noms s'effacent, classement PvP mensuel. Seul le dernier debout réclame la gloire.",
    icon: Swords,
  },
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
    q: "Pourquoi il n'y a pas d'Hôtel des Ventes ?",
    a: 'Parce que chaque échange doit être une épreuve. Le troc se fait face à face, et un coffre plein se défend.',
  },
  {
    q: 'Comment nourrir mes familiers ?',
    a: 'Uniquement avec les poissons rares pêchés dans les eaux de Valoria.',
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
        <dl className="grid grid-cols-2 gap-1 rounded-3xl border-2 border-or/35 bg-nuit-800 p-2.5 shadow-[0_8px_0_#091127,0_24px_50px_rgb(0_0_0/0.4)] sm:grid-cols-3 lg:grid-cols-5">
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
            On le devient par le fer, la sueur et la loyauté envers son clan. Six piliers, tous liés entre eux.
          </p>
        </SectionReveal>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PILIERS.map((p, i) => {
            const Icon = p.icon;
            return (
              <SectionReveal key={p.title} delay={(i % 3) * 100}>
                <article className="carte carte-survol flex h-full flex-col overflow-hidden">
                  <div className="flex aspect-video items-center justify-center bg-nuit-700">
                    {p.image ? (
                      <img src={p.image} alt="" loading="lazy" className="h-full w-full object-cover" />
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

      {/* Pas d'Hôtel des Ventes */}
      <section className="mx-auto max-w-[75rem] px-5 py-20">
        <SectionReveal>
          <div className="flex flex-wrap items-center gap-10 rounded-[1.75rem] border-[3px] border-brique bg-cuir p-[clamp(1.75rem,5vw,3.5rem)] shadow-[0_8px_0_#160806]">
            <div className="min-w-0 flex-[1_1_26rem]">
              <p className="kicker text-or">La loi du commerce brut</p>
              <h2 className="titre-section mt-3.5 text-[clamp(2.25rem,5vw,3.9rem)] leading-[1.02] [text-shadow:0_4px_0_#160806]">
                Ici, pas d'Hôtel des Ventes.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[#f1d9c8]">
                Chaque échange se fait face à face, dans l'ombre des ruelles ou au cœur des plaines. Le vol et les traquenards font partie du jeu.
              </p>
            </div>
            <blockquote className="min-w-0 flex-[1_1_18rem] font-display text-[clamp(1.75rem,3vw,2.4rem)] leading-tight text-or">
              Un coffre plein ne se vend pas. Il se défend.
            </blockquote>
          </div>
        </SectionReveal>
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
