import { useEffect, useMemo, useState } from 'react';
import { useUser } from '../../context/UserContext';
import { adminApi, type StatsData } from '../../lib/adminApi';
import { AdminPageHeader, ErrorBanner, inputCls } from '../../components/admin/ui';
import { BarList, LineChart, StatTile, type Point } from '../../components/admin/charts';
import { fmt } from '../../components/admin/format';

// Statistiques anonymes : fréquentation du site (sans cookie ni IP), rétention des joueurs et santé du serveur
// Minecraft, boutique et communauté. Aucune donnée ne permet de retrouver une personne (voir Backend statsService).

const PERIODS = [7, 30, 90] as const;

const dayLabel = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;
const daily = (rows: { day: string; value: number }[]): Point[] => rows.map((r) => ({ label: dayLabel(r.day), value: r.value }));
const sum = (rows: { value: number }[]) => rows.reduce((a, r) => a + r.value, 0);
const pct = (n: number | null, of: number) => (n === null ? '—' : of ? `${fmt((n / of) * 100)} %` : '—');

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-display text-xl text-stone-900">{title}</h3>
        <p className="text-sm text-stone-500">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

export default function AdminStatsPage() {
  const { token } = useUser();
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<StatsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await adminApi.stats(token, days);
        if (!cancelled) { setData(d); setError(null); }
      } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur'); }
    })();
    return () => { cancelled = true; };
  }, [token, days]);

  const hourly = useMemo(() => (data?.server.hourly ?? []).map((h) => ({ ...h, label: `${h.hour.slice(8, 10)}/${h.hour.slice(5, 7)} ${h.hour.slice(11, 13)}h` })), [data]);

  if (!data) {
    return (
      <div>
        <AdminPageHeader title="Statistiques" subtitle="Site, serveur et boutique, en anonyme." />
        <ErrorBanner message={error} />
        {!error && <p className="text-stone-500">Chargement…</p>}
      </div>
    );
  }

  const { site, server, business } = data;
  const visitors = sum(site.visitors);
  const views = sum(site.views);
  const now = server.now;
  const snap = server.snapshot?.data as { factions?: number; factionsParNation?: Record<string, number>; joueursInscrits?: number; siegesEnCours?: number; voteParty?: number } | undefined;
  const cohorts = server.retention;
  const rateHint = (key: 'd1' | 'd7' | 'd30') => {
    const done = cohorts.filter((c) => c[key] !== null);
    return done.length ? `${fmt(done.reduce((a, c) => a + (c[key] ?? 0), 0))} sur ${fmt(done.reduce((a, c) => a + c.arrivals, 0))} nouveaux joueurs` : 'pas encore assez de recul';
  };
  const rateTile = (v: number | null) => (v === null ? '—' : `${fmt(v, 1)} %`);
  const playtime = sum(server.playtimeHours);
  const sessions = sum(server.sessions);

  return (
    <div className="space-y-10">
      <AdminPageHeader
        title="Statistiques"
        subtitle="Tout est anonyme : aucun cookie, aucune IP, aucun pseudo enregistrés pour ces chiffres."
        right={
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className={`${inputCls} w-auto`} aria-label="Période">
            {PERIODS.map((p) => <option key={p} value={p}>{p} derniers jours</option>)}
          </select>
        }
      />
      <ErrorBanner message={error} />

      <Section title="Site" subtitle="Visiteurs comptés une fois par jour ; ceux qui demandent à ne pas être suivis ne sont pas comptés.">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="Visiteurs (somme des jours)" value={fmt(visitors)} />
          <StatTile label="Pages vues" value={fmt(views)} />
          <StatTile label="Pages par visiteur" value={visitors ? fmt(views / visitors, 1) : '—'} />
          <StatTile label="Visiteurs aujourd'hui" value={fmt(site.visitors[site.visitors.length - 1]?.value ?? 0)} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <LineChart title="Visiteurs par jour" points={daily(site.visitors)} />
          <LineChart title="Pages vues par jour" points={daily(site.views)} />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <BarList title="Pages les plus vues" items={site.pages.map((p) => ({ label: p.label, value: p.views }))} />
          <BarList title="D'où viennent les visiteurs" items={site.referrers.map((p) => ({ label: p.label, value: p.visitors }))} />
          <BarList title="Pays" items={site.countries.map((p) => ({ label: p.label, value: p.visitors }))} />
          <BarList title="Appareils" items={site.devices.map((p) => ({ label: p.label, value: p.visitors }))} />
          <BarList title="Navigateurs" items={site.browsers.map((p) => ({ label: p.label, value: p.visitors }))} />
          <BarList title="Systèmes" items={site.systems.map((p) => ({ label: p.label, value: p.visitors }))} />
        </div>
      </Section>

      <Section title="Joueurs : est-ce qu'ils reviennent ?" subtitle="Un nouveau joueur est suivi par une empreinte stable faite sur le serveur ; sa clé ne quitte jamais la VM, le site ne sait pas qui c'est.">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="Nouveaux joueurs" value={fmt(sum(server.newPlayers))} hint={`sur les ${data.days} derniers jours`} />
          <StatTile label="Revenus le lendemain" value={rateTile(server.retentionRates.d1)} hint={rateHint('d1')} />
          <StatTile label="Revenus dans la semaine" value={rateTile(server.retentionRates.d7)} hint={rateHint('d7')} />
          <StatTile label="Revenus dans le mois" value={rateTile(server.retentionRates.d30)} hint={rateHint('d30')} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <LineChart title="Revenus le lendemain, par jour d'arrivée" unit=" %" max={100}
                     points={cohorts.filter((c) => c.d1 !== null && c.arrivals).map((c) => ({ label: dayLabel(c.day), value: Math.round(((c.d1 ?? 0) / c.arrivals) * 100) }))} />
          <LineChart title="Nouveaux joueurs par jour" points={daily(server.newPlayers)} />
        </div>
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-sm text-stone-900">
            <caption className="px-4 pt-3 text-left text-sm font-semibold text-stone-900">Détail par jour d'arrivée</caption>
            <thead>
              <tr className="text-xs text-stone-500">
                <th className="px-4 py-2 text-left font-medium">Arrivés le</th>
                <th className="px-4 py-2 text-right font-medium">Nouveaux</th>
                <th className="px-4 py-2 text-right font-medium">Revenus le lendemain</th>
                <th className="px-4 py-2 text-right font-medium">Dans la semaine</th>
                <th className="px-4 py-2 text-right font-medium">Dans le mois</th>
                <th className="px-4 py-2 text-right font-medium">Jeu le 1er jour</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-stone-500">Pas encore de nouveaux joueurs.</td></tr>
              )}
              {[...cohorts].reverse().map((c) => (
                <tr key={c.day} className="border-t border-stone-100">
                  <td className="px-4 py-2 text-stone-700">{dayLabel(c.day)}</td>
                  <td className="px-4 py-2 text-right font-medium text-stone-900">{fmt(c.arrivals)}</td>
                  <td className="px-4 py-2 text-right">{pct(c.d1, c.arrivals)}{c.d1 !== null && <span className="text-stone-500"> ({fmt(c.d1)})</span>}</td>
                  <td className="px-4 py-2 text-right">{pct(c.d7, c.arrivals)}</td>
                  <td className="px-4 py-2 text-right">{pct(c.d30, c.arrivals)}</td>
                  <td className="px-4 py-2 text-right">{fmt(c.firstDayMinutes)} min</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-4 pb-3 text-xs text-stone-500">« — » : la fenêtre n'est pas encore écoulée (un joueur arrivé hier ne peut pas encore être revenu dans la semaine).</p>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="Joueurs uniques (somme des jours)" value={fmt(sum(server.uniquePlayers))} />
          <StatTile label="Anciens joueurs revenus (somme des jours)" value={fmt(sum(server.returningPlayers))} />
          <StatTile label="Heures jouées" value={fmt(playtime, 1)} />
          <StatTile label="Durée moyenne d'une session" value={sessions ? `${fmt((playtime * 60) / sessions)} min` : '—'} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <LineChart title="Joueurs en ligne (maximum par heure)" points={hourly.map((h) => ({ label: h.label, value: h.online }))} />
          <LineChart title="Joueurs uniques par jour" points={daily(server.uniquePlayers)} />
          <LineChart title="Anciens joueurs revenus par jour" points={daily(server.returningPlayers)} />
          <LineChart title="Heures jouées par jour" points={daily(server.playtimeHours)} digits={1} unit=" h" />
        </div>
      </Section>

      <Section title="Santé du serveur" subtitle="Mesures envoyées par le serveur chaque minute.">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatTile label="En ligne maintenant" value={now ? fmt(now.online) : '—'} hint={now ? `mesuré le ${new Date(now.at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}` : 'serveur éteint ou pas encore de mesure'} />
          <StatTile label="TPS" value={now ? fmt(now.tps, 1) : '—'} tone={now ? (now.tps >= 19 ? 'good' : 'bad') : undefined} hint="20 = parfait" />
          <StatTile label="MSPT" value={now ? fmt(now.mspt, 1) : '—'} tone={now ? (now.mspt <= 40 ? 'good' : 'bad') : undefined} hint="ms par tick, sous 50 = fluide" />
          <StatTile label="Mémoire" value={now ? `${fmt(now.memoryUsedMb / 1024, 1)} / ${fmt(now.memoryMaxMb / 1024, 1)} Go` : '—'} />
          <StatTile label="Processeur" value={now?.cpuPercent != null ? `${fmt(now.cpuPercent, 0)} %` : '—'} hint={now ? `${fmt(now.chunks)} chunks, ${fmt(now.entities)} entités` : undefined} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <LineChart title="TPS (le plus bas de chaque heure)" points={hourly.map((h) => ({ label: h.label, value: h.tps }))} digits={1} max={20} />
          <LineChart title="MSPT (le plus haut de chaque heure)" points={hourly.map((h) => ({ label: h.label, value: h.mspt }))} digits={1} unit=" ms" />
          <LineChart title="Mémoire utilisée (Go)" points={hourly.map((h) => ({ label: h.label, value: Math.round(h.memoryMb / 102.4) / 10 }))} digits={1} unit=" Go" />
          <LineChart title="Processeur (moyenne par heure)" points={hourly.filter((h) => h.cpu !== null).map((h) => ({ label: h.label, value: h.cpu ?? 0 }))} unit=" %" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid grid-cols-2 gap-4">
            <StatTile label="Factions" value={snap?.factions != null ? fmt(snap.factions) : '—'} />
            <StatTile label="Joueurs inscrits" value={snap?.joueursInscrits != null ? fmt(snap.joueursInscrits) : '—'} />
            <StatTile label="Sièges en cours" value={snap?.siegesEnCours != null ? fmt(snap.siegesEnCours) : '—'} />
            <StatTile label="VoteParty" value={snap?.voteParty != null ? fmt(snap.voteParty) : '—'} hint={server.snapshot ? `photo du ${new Date(server.snapshot.at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}` : undefined} />
          </div>
          <BarList title="Factions par nation" items={Object.entries(snap?.factionsParNation ?? {}).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }))} />
        </div>
      </Section>

      <Section title="Boutique et communauté" subtitle="Comptes, paiements, achats et votes (chiffres globaux).">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="Comptes du site" value={fmt(business.totalAccounts)} hint={`${fmt(sum(business.accounts))} créés sur la période`} />
          <StatTile label="Comptes liés au jeu" value={fmt(business.linkedAccounts)} />
          <StatTile label="Encaissé (Stripe)" value={`${fmt(sum(business.revenueEuros), 2)} €`} hint={`${fmt(sum(business.ecusBought))} Écus achetés`} />
          <StatTile label="Votes" value={fmt(sum(business.votes))} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <LineChart title="Encaissé par jour" points={daily(business.revenueEuros)} digits={2} unit=" €" />
          <LineChart title="Achats en boutique par jour" points={daily(business.purchasesByDay)} />
          <LineChart title="Comptes créés par jour" points={daily(business.accounts)} />
          <LineChart title="Votes par jour" points={daily(business.votes)} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <BarList title="Produits vendus" items={business.purchases.map((p) => ({ label: p.label, value: p.count, note: `${fmt(p.ecus)} Écus` }))} />
          <BarList title="Votes par site" items={business.votesBySite.map((v) => ({ label: v.label, value: v.count }))} />
        </div>
      </Section>
    </div>
  );
}
