import { createHash, randomBytes } from 'node:crypto';
import { getDbPool } from '../db/mysql.js';

// Statistiques anonymes (page admin « Statistiques ») : voir migrations/005_statistiques.sql.
// Site : aucun cookie ni identifiant ; le visiteur du jour est une empreinte faite avec un sel tiré chaque jour et
// effacé le lendemain, avec les empreintes. Serveur : les joueurs arrivent déjà en empreintes (clé connue de la VM seule).

const TZ = 'Europe/Paris';
const DIMENSIONS = ['page', 'provenance', 'appareil', 'navigateur', 'systeme', 'pays'] as const;
const BOT = /bot|crawl|spider|slurp|preview|monitor|headless|lighthouse|curl|wget|python|java\/|go-http|uptime/i;

/** Jour civil à Paris (AAAA-MM-JJ). */
export function parisDay(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

let saltCache: { day: string; salt: string } | null = null;

/** Sel du jour, partagé par les réplicas (en base) ; ceux des jours passés et leurs empreintes sont effacés. */
async function dailySalt(day: string): Promise<string> {
  if (saltCache?.day === day) return saltCache.salt;
  const db = await getDbPool();
  await db.execute('INSERT IGNORE INTO stats_salts (day, salt) VALUES (?, ?)', [day, randomBytes(32).toString('hex')]);
  const [rows] = await db.execute('SELECT salt FROM stats_salts WHERE day = ?', [day]);
  const salt = String((rows as any[])[0].salt);
  await db.execute('DELETE FROM stats_salts WHERE day < ?', [day]);
  await db.execute('DELETE FROM stats_site_visitors WHERE day < ?', [day]);
  saltCache = { day, salt };
  return salt;
}

function device(ua: string): string {
  if (/ipad|tablet/i.test(ua)) return 'Tablette';
  if (/mobile|iphone|android/i.test(ua)) return 'Mobile';
  return 'Ordinateur';
}

function browser(ua: string): string {
  if (/edg\//i.test(ua)) return 'Edge';
  if (/opr\/|opera/i.test(ua)) return 'Opera';
  if (/firefox\//i.test(ua)) return 'Firefox';
  if (/samsungbrowser/i.test(ua)) return 'Samsung Internet';
  if (/chrome\//i.test(ua)) return 'Chrome';
  if (/safari\//i.test(ua)) return 'Safari';
  return 'Autre';
}

function system(ua: string): string {
  if (/windows/i.test(ua)) return 'Windows';
  if (/iphone|ipad|ios/i.test(ua)) return 'iOS';
  if (/android/i.test(ua)) return 'Android';
  if (/mac os x|macintosh/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Autre';
}

/** Chemin sans paramètres ni identifiants (les nombres et longues chaînes deviennent « : »). */
function cleanPath(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.startsWith('/')) return null;
  const path = raw.split(/[?#]/)[0].slice(0, 150)
    .split('/').map((part) => (/^\d+$|^[0-9a-f-]{16,}$/i.test(part) ? ':' : part)).join('/');
  return path.replace(/\/+$/, '') || '/';
}

/** Domaine de provenance externe seulement (le site lui-même et les liens directs ne comptent pas). */
function cleanReferrer(raw: unknown): string {
  if (typeof raw !== 'string' || raw === '') return 'Direct';
  try {
    const host = new URL(raw).hostname.replace(/^www\./, '').toLowerCase();
    if (!host || host.endsWith('valoria.zenixweb.fr')) return 'Direct';
    return host.slice(0, 100);
  } catch {
    return 'Direct';
  }
}

async function bump(day: string, dimension: string, value: string, visitorIsNew: boolean) {
  const db = await getDbPool();
  await db.execute(
    `INSERT INTO stats_site_daily (day, dimension, value, views, visitors) VALUES (?, ?, ?, 1, ?)
     ON DUPLICATE KEY UPDATE views = views + 1, visitors = visitors + VALUES(visitors)`,
    [day, dimension, value, visitorIsNew ? 1 : 0]
  );
}

/**
 * Une page vue. Rien d'identifiant n'est gardé : l'IP et le navigateur ne servent qu'à l'empreinte du jour,
 * jamais écrits. Les robots et ceux qui demandent à ne pas être suivis ne sont pas comptés.
 */
export async function recordPageView(input: { path: unknown; referrer: unknown; ip: string; userAgent: string; country: string | null; dnt: boolean }) {
  if (input.dnt || !input.userAgent || BOT.test(input.userAgent)) return;
  const path = cleanPath(input.path);
  if (!path || path.startsWith('/admin')) return;
  const day = parisDay();
  const salt = await dailySalt(day);
  const visitor = createHash('sha256').update(`${salt}|${input.ip}|${input.userAgent}`).digest('hex');
  const db = await getDbPool();
  const [res] = await db.execute('INSERT IGNORE INTO stats_site_visitors (day, visitor) VALUES (?, ?)', [day, visitor]);
  const isNew = (res as any).affectedRows === 1;
  const country = input.country && /^[A-Z]{2}$/.test(input.country) && input.country !== 'XX' ? input.country : 'Inconnu';
  const values: Record<(typeof DIMENSIONS)[number], string> = {
    page: path, provenance: cleanReferrer(input.referrer), appareil: device(input.userAgent),
    navigateur: browser(input.userAgent), systeme: system(input.userAgent), pays: country,
  };
  await bump(day, 'total', 'total', isNew);
  for (const d of DIMENSIONS) await bump(day, d, values[d], isNew);
}

// ─────────────────────────────── Serveur Minecraft ───────────────────────────────

export type ServerMetrics = {
  online: number; tps: number; mspt: number; memoryUsedMb: number; memoryMaxMb: number;
  cpuPercent: number | null; chunks: number; entities: number;
};
export type PlayerActivity = { player: string; firstJoin: boolean; sessions: number; playtimeSeconds: number };

/** Mesures envoyées par le serveur avec son tirage (au plus une ligne par minute). */
export async function recordServerStats(input: {
  metrics?: ServerMetrics; players?: PlayerActivity[]; counters?: Record<string, number>; snapshot?: unknown;
}) {
  const db = await getDbPool();
  const now = new Date();
  const day = parisDay(now);
  if (input.metrics) {
    const m = input.metrics;
    const minute = new Date(Math.floor(now.getTime() / 60000) * 60000);
    await db.execute(
      `INSERT INTO stats_server_minutes (at, online, tps, mspt, memory_used_mb, memory_max_mb, cpu_percent, chunks, entities)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE online = GREATEST(online, VALUES(online)), tps = LEAST(tps, VALUES(tps)),
         mspt = GREATEST(mspt, VALUES(mspt)), memory_used_mb = VALUES(memory_used_mb), cpu_percent = VALUES(cpu_percent),
         chunks = VALUES(chunks), entities = VALUES(entities)`,
      [minute, m.online, m.tps, m.mspt, m.memoryUsedMb, m.memoryMaxMb, m.cpuPercent, m.chunks, m.entities]
    );
  }
  for (const p of input.players ?? []) {
    if (!/^[0-9a-f]{64}$/.test(p.player)) continue;
    await db.execute(
      `INSERT INTO stats_server_players (day, player, first_join, sessions, playtime_seconds) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE first_join = GREATEST(first_join, VALUES(first_join)),
         sessions = sessions + VALUES(sessions), playtime_seconds = playtime_seconds + VALUES(playtime_seconds)`,
      [day, p.player, p.firstJoin ? 1 : 0, p.sessions, p.playtimeSeconds]
    );
  }
  for (const [counter, value] of Object.entries(input.counters ?? {})) {
    if (!/^[a-z_]{1,40}$/.test(counter) || !Number.isFinite(value) || value <= 0) continue;
    await db.execute(
      `INSERT INTO stats_server_daily (day, counter, value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = value + VALUES(value)`,
      [day, counter, Math.floor(value)]
    );
  }
  if (input.snapshot) {
    const hour = new Date(Math.floor(now.getTime() / 3600000) * 3600000);
    await db.execute('INSERT INTO stats_server_snapshots (at, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)',
      [hour, JSON.stringify(input.snapshot)]);
  }
  // Ménage : mesures minute gardées 180 jours
  if (Math.random() < 0.01) await db.execute('DELETE FROM stats_server_minutes WHERE at < NOW() - INTERVAL 180 DAY');
}

// ─────────────────────────────── Lecture pour l'admin ───────────────────────────────

const iso = (d: unknown) => (d instanceof Date ? parisDay(d) : String(d).slice(0, 10));

/** Toutes les statistiques d'une période (jours), séries complétées jour par jour. */
export async function readStats(days: number) {
  const db = await getDbPool();
  const since = parisDay(new Date(Date.now() - (days - 1) * 86400000));
  const dayList: string[] = [];
  for (let i = days - 1; i >= 0; i--) dayList.push(parisDay(new Date(Date.now() - i * 86400000)));
  const series = (rows: any[], key: string, valueKey: string) => {
    const map = new Map(rows.map((r) => [iso(r[key]), Number(r[valueKey] ?? 0)]));
    return dayList.map((day) => ({ day, value: map.get(day) ?? 0 }));
  };
  const q = async (sql: string, params: any[] = []) => (await db.execute(sql, params))[0] as any[];

  const siteTotal = await q(`SELECT day, views, visitors FROM stats_site_daily WHERE dimension = 'total' AND day >= ?`, [since]);
  const top = async (dimension: string, limit = 12) => (await q(
    `SELECT value, SUM(views) AS views, SUM(visitors) AS visitors FROM stats_site_daily
     WHERE dimension = ? AND day >= ? GROUP BY value ORDER BY views DESC LIMIT ${limit}`, [dimension, since]))
    .map((r) => ({ label: String(r.value), views: Number(r.views), visitors: Number(r.visitors) }));

  const hourly = await q(
    `SELECT DATE_FORMAT(at, '%Y-%m-%d %H:00') AS hour, MAX(online) AS online, MIN(tps) AS tps, MAX(mspt) AS mspt,
            MAX(memory_used_mb) AS memory, MAX(memory_max_mb) AS memory_max, AVG(cpu_percent) AS cpu,
            MAX(chunks) AS chunks, MAX(entities) AS entities
     FROM stats_server_minutes WHERE at >= ? GROUP BY hour ORDER BY hour`, [since]);
  const players = await q(
    `SELECT day, COUNT(*) AS unique_players, SUM(first_join) AS new_players, SUM(sessions) AS sessions,
            SUM(playtime_seconds) AS playtime FROM stats_server_players WHERE day >= ? GROUP BY day`, [since]);
  const counters = await q(`SELECT day, counter, value FROM stats_server_daily WHERE day >= ?`, [since]);
  const counterNames = [...new Set(counters.map((c) => String(c.counter)))].sort();
  const snapshot = (await q('SELECT at, data FROM stats_server_snapshots ORDER BY at DESC LIMIT 1'))[0] ?? null;
  const last = (await q('SELECT * FROM stats_server_minutes ORDER BY at DESC LIMIT 1'))[0] ?? null;

  const accounts = await q(`SELECT DATE(created_at) AS day, COUNT(*) AS n FROM users WHERE created_at >= ? GROUP BY day`, [since]);
  const linked = await q(`SELECT COUNT(*) AS n FROM users WHERE mc_uuid IS NOT NULL`);
  const totalUsers = await q(`SELECT COUNT(*) AS n FROM users`);
  const revenue = await q(`SELECT DATE(created_at) AS day, SUM(amount_cents) AS cents, SUM(ecus_amount) AS ecus FROM stripe_ecus_payments WHERE created_at >= ? GROUP BY day`, [since]);
  const purchases = await q(`SELECT product_name AS name, COUNT(*) AS n, SUM(price_ecus) AS ecus FROM product_purchases WHERE created_at >= ? GROUP BY product_name ORDER BY n DESC`, [since]);
  const purchasesByDay = await q(`SELECT DATE(created_at) AS day, COUNT(*) AS n FROM product_purchases WHERE created_at >= ? GROUP BY day`, [since]);
  const votes = await q(`SELECT DATE(voted_at) AS day, COUNT(*) AS n FROM votes WHERE voted_at >= ? GROUP BY day`, [since]);
  const votesBySite = await q(`SELECT site_name AS name, COUNT(*) AS n FROM votes WHERE voted_at >= ? GROUP BY site_name ORDER BY n DESC`, [since]);

  return {
    days,
    site: {
      visitors: series(siteTotal, 'day', 'visitors'),
      views: series(siteTotal, 'day', 'views'),
      pages: await top('page'), referrers: await top('provenance'), devices: await top('appareil', 5),
      browsers: await top('navigateur', 8), systems: await top('systeme', 8), countries: await top('pays', 12),
    },
    server: {
      now: last ? {
        at: last.at, online: Number(last.online), tps: Number(last.tps), mspt: Number(last.mspt),
        memoryUsedMb: Number(last.memory_used_mb), memoryMaxMb: Number(last.memory_max_mb),
        cpuPercent: last.cpu_percent === null ? null : Number(last.cpu_percent), chunks: Number(last.chunks), entities: Number(last.entities),
      } : null,
      hourly: hourly.map((h) => ({
        hour: String(h.hour), online: Number(h.online), tps: Number(h.tps), mspt: Number(h.mspt),
        memoryMb: Number(h.memory), memoryMaxMb: Number(h.memory_max), cpu: h.cpu === null ? null : Number(h.cpu),
        chunks: Number(h.chunks), entities: Number(h.entities),
      })),
      uniquePlayers: series(players, 'day', 'unique_players'),
      newPlayers: series(players, 'day', 'new_players'),
      playtimeHours: series(players, 'day', 'playtime').map((p) => ({ day: p.day, value: Math.round((p.value / 3600) * 10) / 10 })),
      sessions: series(players, 'day', 'sessions'),
      counters: Object.fromEntries(counterNames.map((name) => [name, series(counters.filter((c) => c.counter === name), 'day', 'value')])),
      snapshot: snapshot ? { at: snapshot.at, data: typeof snapshot.data === 'string' ? JSON.parse(snapshot.data) : snapshot.data } : null,
    },
    business: {
      accounts: series(accounts, 'day', 'n'),
      totalAccounts: Number(totalUsers[0]?.n ?? 0),
      linkedAccounts: Number(linked[0]?.n ?? 0),
      revenueEuros: series(revenue, 'day', 'cents').map((r) => ({ day: r.day, value: r.value / 100 })),
      ecusBought: series(revenue, 'day', 'ecus'),
      purchases: purchases.map((p) => ({ label: String(p.name), count: Number(p.n), ecus: Number(p.ecus) })),
      purchasesByDay: series(purchasesByDay, 'day', 'n'),
      votes: series(votes, 'day', 'n'),
      votesBySite: votesBySite.map((v) => ({ label: String(v.name), count: Number(v.n) })),
    },
  };
}
