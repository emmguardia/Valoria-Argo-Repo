import { useEffect, useState } from 'react';
import { History, RotateCw, XCircle } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { adminApi, type LedgerEntry, type ServerCommand, type ServerCommandEvent, type ServerStatus } from '../../lib/adminApi';
import {
  AdminPageHeader, AdminTable, AdminTableHead, AdminTableRow, Badge, Empty, ErrorBanner, IconButton, Modal, inputCls,
} from '../../components/admin/ui';

// Suivi du serveur Minecraft : dernier passage, file des commandes (achats, votes) avec l'historique de chacune,
// et registre des Écus. C'est ici qu'on regarde en cas de panne ou de réclamation d'un joueur.

const STATUSES = ['', 'pending', 'sent', 'done', 'failed', 'cancelled'] as const;
const LABELS: Record<string, string> = {
  pending: 'En attente', sent: 'Envoyée', done: 'Exécutée', failed: 'Échec', cancelled: 'Annulée',
};

function fmt(iso: string | null) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'medium' }); }
  catch { return iso; }
}

function statusBadge(s: string) {
  const tone = s === 'done' ? 'success' : s === 'failed' ? 'danger' : s === 'sent' ? 'info' : s === 'pending' ? 'warning' : 'neutral';
  return <Badge tone={tone}>{LABELS[s] ?? s}</Badge>;
}

export default function AdminServerPage() {
  const { token } = useUser();
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [items, setItems] = useState<ServerCommand[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [filter, setFilter] = useState('');
  const [player, setPlayer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ command: ServerCommand; events: ServerCommandEvent[] } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  // Heure du chargement : sert à dire depuis combien de temps le serveur n'est pas passé
  const [loadedAt, setLoadedAt] = useState(0);
  const reload = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, c, l] = await Promise.all([
          adminApi.serverStatus(token),
          adminApi.listServerCommands(token, { status: filter || undefined, player: player.trim() || undefined }),
          adminApi.ledger(token),
        ]);
        if (cancelled) return;
        setStatus(s); setItems(c.items); setLedger(l.items); setError(null); setLoadedAt(Date.now());
      } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur'); }
    })();
    return () => { cancelled = true; };
  }, [token, filter, player, refreshKey]);

  const open = async (id: number) => {
    try { setDetail(await adminApi.serverCommand(token, id)); }
    catch (e) { window.alert(e instanceof Error ? e.message : 'Erreur'); }
  };

  const act = async (c: ServerCommand, action: 'retry' | 'cancel') => {
    const verb = action === 'retry' ? 'Remettre en file' : 'Annuler';
    if (!window.confirm(`${verb} la commande n°${c.id} (${c.command_text}) ?`)) return;
    try { await adminApi.serverCommandAction(token, c.id, action); reload(); }
    catch (e) { window.alert(e instanceof Error ? e.message : 'Erreur'); }
  };

  const last = status?.lastHeartbeat;
  const silentSeconds = last ? Math.round((loadedAt - new Date(last.at).getTime()) / 1000) : null;

  return (
    <div className="space-y-10">
      <div>
        <AdminPageHeader
          title="Serveur Minecraft"
          subtitle="Le serveur vient chercher ses commandes toutes les 10 s. S'il ne passe plus, rien n'est perdu : tout attend ici."
          right={<button type="button" onClick={reload} className="text-sm underline text-stone-600">Actualiser</button>}
        />
        <ErrorBanner message={error} />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-stone-200 p-4">
            <p className="text-xs text-stone-500">Dernier passage du serveur</p>
            <p className={`text-lg font-semibold ${silentSeconds !== null && silentSeconds < 120 ? 'text-emerald-700' : 'text-red-700'}`}>
              {last ? `${fmt(last.at)} (il y a ${silentSeconds} s)` : 'jamais'}
            </p>
            {last && <p className="text-xs text-stone-500">{last.onlinePlayers} joueur(s), plugin {last.pluginVersion ?? '?'}</p>}
          </div>
          <div className="rounded-xl border border-stone-200 p-4">
            <p className="text-xs text-stone-500">En attente / envoyées</p>
            <p className="text-lg font-semibold text-stone-900">{status?.commands.pending ?? 0} / {status?.commands.sent ?? 0}</p>
          </div>
          <div className="rounded-xl border border-stone-200 p-4">
            <p className="text-xs text-stone-500">En échec</p>
            <p className={`text-lg font-semibold ${(status?.commands.failed ?? 0) > 0 ? 'text-red-700' : 'text-stone-900'}`}>
              {status?.commands.failed ?? 0}
            </p>
          </div>
        </div>
      </div>

      <div>
        <AdminPageHeader
          title="Commandes"
          subtitle="Achats et votes à exécuter en jeu. Cliquer sur l'historique pour voir chaque étape."
          right={
            <div className="flex gap-2">
              <input value={player} onChange={(e) => setPlayer(e.target.value)} placeholder="Joueur ou uuid" className={`${inputCls} w-44`} />
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className={`${inputCls} w-auto`}>
                {STATUSES.map((s) => <option key={s} value={s}>{s ? LABELS[s] : 'Tous les statuts'}</option>)}
              </select>
            </div>
          }
        />
        <AdminTable>
          <AdminTableHead>
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Créée</th>
              <th className="px-4 py-3">Joueur</th>
              <th className="px-4 py-3">Origine</th>
              <th className="px-4 py-3">Commande</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-center">Envois</th>
              <th className="px-4 py-3">Exécutée</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </AdminTableHead>
          <tbody>
            {items.map((c) => (
              <AdminTableRow key={c.id}>
                <td className="px-4 py-3 font-mono text-xs text-stone-500">{c.id}</td>
                <td className="px-4 py-3 text-stone-600">{fmt(c.created_at)}</td>
                <td className="px-4 py-3 font-medium text-stone-900">{c.mc_username ?? '—'}</td>
                <td className="px-4 py-3 text-stone-600">{c.source}{c.source_id ? ` #${c.source_id}` : ''}</td>
                <td className="px-4 py-3 font-mono text-xs text-stone-700 max-w-[16rem] truncate" title={c.command_text}>{c.command_text}</td>
                <td className="px-4 py-3">{statusBadge(c.status)}
                  {c.last_error && <p className="text-xs text-red-600 max-w-[12rem] truncate" title={c.last_error}>{c.last_error}</p>}
                </td>
                <td className="px-4 py-3 text-center text-stone-700">{c.attempts}</td>
                <td className="px-4 py-3 text-stone-600">{fmt(c.done_at)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <IconButton title="Historique" onClick={() => open(c.id)}><History className="w-4 h-4" /></IconButton>
                  {(c.status === 'failed' || c.status === 'cancelled') && (
                    <IconButton tone="gold" title="Remettre en file" onClick={() => act(c, 'retry')}><RotateCw className="w-4 h-4" /></IconButton>
                  )}
                  {(c.status === 'pending' || c.status === 'failed') && (
                    <IconButton tone="danger" title="Annuler" onClick={() => act(c, 'cancel')}><XCircle className="w-4 h-4" /></IconButton>
                  )}
                </td>
              </AdminTableRow>
            ))}
            {items.length === 0 && <tr><td colSpan={9}><Empty message="Aucune commande." /></td></tr>}
          </tbody>
        </AdminTable>
      </div>

      <div>
        <AdminPageHeader title="Registre des Écus" subtitle="Chaque mouvement, avec le solde après. Rien n'y est jamais modifié." />
        <AdminTable>
          <AdminTableHead>
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Joueur</th>
              <th className="px-4 py-3">Motif</th>
              <th className="px-4 py-3">Origine</th>
              <th className="px-4 py-3 text-right">Écus</th>
              <th className="px-4 py-3 text-right">Solde</th>
              <th className="px-4 py-3">Référence</th>
            </tr>
          </AdminTableHead>
          <tbody>
            {ledger.map((l) => (
              <AdminTableRow key={l.id}>
                <td className="px-4 py-3 font-mono text-xs text-stone-500">{l.id}</td>
                <td className="px-4 py-3 text-stone-600">{fmt(l.created_at)}</td>
                <td className="px-4 py-3 font-medium text-stone-900">{l.pseudo}</td>
                <td className="px-4 py-3 text-stone-700">{l.reason}{l.detail ? ` : ${l.detail}` : ''}</td>
                <td className="px-4 py-3 text-stone-600">{l.origin}</td>
                <td className={`px-4 py-3 text-right font-semibold ${l.delta >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{l.delta >= 0 ? '+' : ''}{l.delta}</td>
                <td className="px-4 py-3 text-right text-stone-800">{l.balance_after}</td>
                <td className="px-4 py-3 font-mono text-xs text-stone-500">{l.ref_type ? `${l.ref_type}:${l.ref_id}` : '—'}</td>
              </AdminTableRow>
            ))}
            {ledger.length === 0 && <tr><td colSpan={8}><Empty message="Aucun mouvement." /></td></tr>}
          </tbody>
        </AdminTable>
      </div>

      <Modal open={detail !== null} onClose={() => setDetail(null)} title={detail ? `Commande n°${detail.command.id}` : ''} maxWidth="max-w-2xl">
        {detail && (
          <div className="space-y-4">
            <p className="font-mono text-sm text-stone-800 break-all">{detail.command.command_text}</p>
            <p className="text-sm text-stone-600">Joueur : {detail.command.mc_username ?? '—'} ({detail.command.mc_uuid ?? 'sans uuid'})</p>
            <ol className="space-y-2 border-l-2 border-stone-200 pl-4">
              {detail.events.map((e, i) => (
                <li key={i} className="text-sm">
                  <span className="font-mono text-xs text-stone-500">{fmt(e.created_at)}</span>{' '}
                  <span className="font-semibold text-stone-900">{e.event}</span>
                  {e.detail && <span className="text-stone-600"> — {e.detail}</span>}
                </li>
              ))}
            </ol>
          </div>
        )}
      </Modal>
    </div>
  );
}
