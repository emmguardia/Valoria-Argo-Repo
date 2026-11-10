import { useId, useState } from 'react';
import { fmt } from './format';

// Petits graphiques SVG sans bibliothèque pour la page Statistiques : une série par graphique (un seul axe),
// trait de 2 px, infobulle au survol, et le tableau des chiffres juste en dessous (lisible sans la couleur).

const SERIES = '#2a78d6';
const GRID = '#e7e5e4';
const MUTED = '#78716c';

export type Point = { label: string; value: number };

function niceMax(max: number) {
  if (max <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 2.5, 5, 10].find((s) => max <= s * pow) ?? 10;
  return step * pow;
}


/** Courbe d'une série dans le temps, avec repère vertical et infobulle au survol. */
export function LineChart({ title, points, unit = '', digits = 0, max, height = 180 }: {
  title: string; points: Point[]; unit?: string; digits?: number; max?: number; height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const tableId = useId();
  const W = 640;
  const H = height;
  const pad = { l: 44, r: 12, t: 12, b: 26 };
  const values = points.map((p) => p.value);
  // Toujours depuis zéro (une échelle tronquée exagère les écarts) ; plafond fixe possible (TPS : 20)
  const hi = max ?? niceMax(Math.max(0, ...values));
  const lo = 0;
  const x = (i: number) => pad.l + (points.length <= 1 ? 0 : (i * (W - pad.l - pad.r)) / (points.length - 1));
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - (v - lo) / (hi - lo || 1));
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const ticks = [lo, lo + (hi - lo) / 2, hi];
  const labelEvery = Math.max(1, Math.ceil(points.length / 7));

  return (
    <figure className="rounded-xl border border-stone-200 bg-white p-4">
      <figcaption className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-stone-900">{title}</span>
        {hover !== null && points[hover] && (
          <span className="text-xs text-stone-600" aria-live="polite">
            {points[hover].label} : <strong className="text-stone-900">{fmt(points[hover].value, digits)}{unit}</strong>
          </span>
        )}
      </figcaption>
      {points.length === 0 ? (
        <p className="py-10 text-center text-sm text-stone-500">Pas encore de données.</p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`${title} : dernière valeur ${fmt(values[values.length - 1] ?? 0, digits)}${unit}, ${points.length} points`}
             onMouseLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
              <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill={MUTED}>{fmt(t, t % 1 ? 1 : 0)}</text>
            </g>
          ))}
          {points.map((p, i) => (i % labelEvery === 0 || i === points.length - 1) && (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize={11} fill={MUTED}>{p.label}</text>
          ))}
          <path d={path} fill="none" stroke={SERIES} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {/* Peu de points : on les marque, sinon une seule mesure resterait invisible */}
          {points.length <= 2 && points.map((p, i) => (
            <circle key={i} cx={x(i)} cy={y(p.value)} r={4} fill={SERIES} stroke="#fff" strokeWidth={2} />
          ))}
          {hover !== null && points[hover] && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke={MUTED} strokeWidth={1} strokeDasharray="3 3" />
              <circle cx={x(hover)} cy={y(points[hover].value)} r={4} fill={SERIES} stroke="#fff" strokeWidth={2} />
            </g>
          )}
          {/* Zones de survol plus larges que la courbe */}
          {points.map((_, i) => (
            <rect key={i} x={x(i) - (W - pad.l - pad.r) / Math.max(1, points.length - 1) / 2} y={pad.t}
                  width={(W - pad.l - pad.r) / Math.max(1, points.length - 1)} height={H - pad.t - pad.b}
                  fill="transparent" onMouseEnter={() => setHover(i)} />
          ))}
        </svg>
      )}
      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-stone-500" aria-controls={tableId}>Voir les chiffres</summary>
        <div id={tableId} className="mt-2 max-h-48 overflow-y-auto">
          <table className="w-full text-xs">
            <tbody>
              {points.map((p) => (
                <tr key={p.label} className="border-t border-stone-100">
                  <td className="py-1 text-stone-600">{p.label}</td>
                  <td className="py-1 text-right font-medium text-stone-900">{fmt(p.value, digits)}{unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

/** Classement en barres horizontales (pages, provenances, pays…), valeur écrite au bout de chaque barre. */
export function BarList({ title, items, unit = '' }: { title: string; items: { label: string; value: number; note?: string }[]; unit?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-stone-900">{title}</p>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-stone-500">Pas encore de données.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((i) => (
            <li key={i.label} title={`${i.label} : ${fmt(i.value)}${unit}${i.note ? ` (${i.note})` : ''}`}>
              <div className="flex justify-between gap-2 text-xs">
                <span className="truncate text-stone-700">{i.label}</span>
                <span className="shrink-0 font-medium text-stone-900">{fmt(i.value)}{unit}{i.note ? <span className="text-stone-500"> · {i.note}</span> : null}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-stone-100">
                <div className="h-2 rounded-full" style={{ width: `${Math.max(2, (i.value / max) * 100)}%`, background: SERIES }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Chiffre clé. */
export function StatTile({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'good' | 'bad' }) {
  const color = tone === 'good' ? 'text-emerald-700' : tone === 'bad' ? 'text-red-700' : 'text-stone-900';
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="text-xs text-stone-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

