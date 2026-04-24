import { useCallback, useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { adminApi, type AdminRewardJob } from '../../lib/adminApi';
import {
  AdminPageHeader, AdminTable, AdminTableHead, AdminTableRow,
  Badge, Empty, ErrorBanner, IconButton, Pagination, inputCls,
} from '../../components/admin/ui';

const STATUSES = ['', 'pending_claim', 'completed', 'failed', 'dead'] as const;

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }); }
  catch { return iso; }
}

function statusBadge(s: string) {
  if (s === 'completed') return <Badge tone="success">Livré</Badge>;
  if (s === 'pending_claim') return <Badge tone="warning">À réclamer</Badge>;
  if (s === 'failed') return <Badge tone="danger">Échec</Badge>;
  if (s === 'dead') return <Badge tone="danger">Mort</Badge>;
  if (s === 'processing') return <Badge tone="info">En cours</Badge>;
  return <Badge tone="neutral">{s}</Badge>;
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
    } catch (e) { setError(e instanceof Error ? e.message : 'Erreur'); }
    finally { setLoading(false); }
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
      <AdminPageHeader
        title={`Livraisons (${total})`}
        subtitle="Récompenses à livrer en jeu — claim manuel par le joueur (3 tentatives/jour)."
        right={
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className={`${inputCls} w-auto`}
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s || 'Tous les statuts'}</option>)}
          </select>
        }
      />
      <ErrorBanner message={error} />
      {loading ? <p className="text-stone-500">Chargement…</p> : (
        <>
          <AdminTable>
            <AdminTableHead>
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Créée</th>
                <th className="px-4 py-3">Joueur</th>
                <th className="px-4 py-3">MC</th>
                <th className="px-4 py-3">Récompense</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-center">Tentatives</th>
                <th className="px-4 py-3">Dernière erreur</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </AdminTableHead>
            <tbody>
              {items.map((j) => (
                <AdminTableRow key={j.id}>
                  <td className="px-4 py-3 text-stone-500 font-mono text-xs">{j.id}</td>
                  <td className="px-4 py-3 text-stone-600">{fmtDate(j.createdAt)}</td>
                  <td className="px-4 py-3 font-medium text-stone-900">{j.userPseudo ?? j.userId}</td>
                  <td className="px-4 py-3 text-stone-600">{j.mcUsername}</td>
                  <td className="px-4 py-3 text-stone-700">{j.rewardId}</td>
                  <td className="px-4 py-3">{statusBadge(j.status)}</td>
                  <td className="px-4 py-3 text-center text-stone-700">{j.dailyAttempts}/3</td>
                  <td className="px-4 py-3 text-red-600 text-xs max-w-[12rem] truncate" title={j.lastError || ''}>
                    {j.lastError || '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {(j.status === 'failed' || j.status === 'dead') && (
                      <IconButton tone="gold" title="Rouvrir" onClick={() => reopen(j)}>
                        <RotateCw className="w-4 h-4" />
                      </IconButton>
                    )}
                  </td>
                </AdminTableRow>
              ))}
              {items.length === 0 && <tr><td colSpan={9}><Empty message="Aucune livraison." /></td></tr>}
            </tbody>
          </AdminTable>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </>
      )}
    </div>
  );
}
