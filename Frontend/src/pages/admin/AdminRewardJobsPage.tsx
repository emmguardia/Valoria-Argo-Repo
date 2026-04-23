import { useCallback, useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { adminApi, type AdminRewardJob } from '../../lib/adminApi';

const STATUSES = ['', 'pending_claim', 'completed', 'failed', 'dead'] as const;

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('fr-FR'); } catch { return iso; }
}

function statusColor(s: string) {
  if (s === 'completed') return 'text-emerald-400';
  if (s === 'pending_claim') return 'text-amber-300';
  if (s === 'failed' || s === 'dead') return 'text-red-400';
  return 'text-stone-300';
}

export default function AdminRewardJobsPage() {
  const { token } = useUser();
  const [items, setItems] = useState<AdminRewardJob[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 30;

  const reload = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const data = await adminApi.listRewardJobs(token, { page, limit, status: status || undefined });
      setItems(data.items); setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally { setLoading(false); }
  }, [token, page, status]);

  useEffect(() => { void reload(); }, [reload]);

  const reopen = async (j: AdminRewardJob) => {
    if (!window.confirm(`Rouvrir la livraison #${j.id} pour ${j.mcUsername} ?`)) return;
    try { await adminApi.reopenRewardJob(token, j.id); await reload(); }
    catch (e) { window.alert(e instanceof Error ? e.message : 'Erreur'); }
  };

  const pageCount = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-stone-100">Livraisons ({total})</h1>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="bg-stone-900 border border-stone-700 text-stone-100 rounded px-3 py-1.5 text-sm"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'Tous les statuts'}</option>)}
        </select>
      </div>
      {error && <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>}
      {loading ? <p className="text-stone-400">Chargement…</p> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-stone-400 border-b border-amber-900/20">
                <tr>
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">Créée</th>
                  <th className="py-2 pr-4">Joueur</th>
                  <th className="py-2 pr-4">MC</th>
                  <th className="py-2 pr-4">Récompense</th>
                  <th className="py-2 pr-4">Statut</th>
                  <th className="py-2 pr-4">Tentatives /jour</th>
                  <th className="py-2 pr-4">Dernière erreur</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="text-stone-200">
                {items.map((j) => (
                  <tr key={j.id} className="border-b border-stone-800/50 hover:bg-stone-900/30">
                    <td className="py-2 pr-4 text-stone-500">{j.id}</td>
                    <td className="py-2 pr-4 text-stone-400">{fmtDate(j.createdAt)}</td>
                    <td className="py-2 pr-4">{j.userPseudo ?? j.userId}</td>
                    <td className="py-2 pr-4 text-stone-400">{j.mcUsername}</td>
                    <td className="py-2 pr-4">{j.rewardId}</td>
                    <td className={`py-2 pr-4 ${statusColor(j.status)}`}>{j.status}</td>
                    <td className="py-2 pr-4">{j.dailyAttempts}/3</td>
                    <td className="py-2 pr-4 text-red-300 text-xs max-w-[12rem] truncate">{j.lastError || '—'}</td>
                    <td className="py-2 pr-4">
                      {(j.status === 'failed' || j.status === 'dead') && (
                        <button title="Rouvrir" onClick={() => reopen(j)} className="p-1 text-amber-300 hover:text-amber-200">
                          <RotateCw className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-stone-500">Aucune livraison.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-stone-400">
            <span>Page {page}/{pageCount}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 bg-stone-900 border border-stone-700 rounded disabled:opacity-40">Préc.</button>
              <button disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 bg-stone-900 border border-stone-700 rounded disabled:opacity-40">Suiv.</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
