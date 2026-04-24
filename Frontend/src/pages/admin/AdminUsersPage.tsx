import { useCallback, useEffect, useState } from 'react';
import { Ban, CheckCircle, Coins, Shield, ShieldOff, Search } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { adminApi, type AdminUser } from '../../lib/adminApi';
import {
  AdminPageHeader, AdminTable, AdminTableHead, AdminTableRow,
  Badge, Empty, ErrorBanner, IconButton, Pagination,
} from '../../components/admin/ui';

export default function AdminUsersPage() {
  const { token } = useUser();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 25;

  const reload = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const data = await adminApi.listUsers(token, { page, limit, search: search.trim() || undefined });
      setUsers(data.items); setTotal(data.total);
    } catch (e) { setError(e instanceof Error ? e.message : 'Erreur'); }
    finally { setLoading(false); }
  }, [token, page, search]);

  useEffect(() => { void reload(); }, [reload]);

  const toggleRole = async (u: AdminUser) => {
    const next = u.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Passer ${u.pseudo} en ${next} ?`)) return;
    try { await adminApi.updateUser(token, u.id, { role: next }); await reload(); }
    catch (e) { window.alert(e instanceof Error ? e.message : 'Erreur'); }
  };

  const toggleBan = async (u: AdminUser) => {
    if (u.bannedAt) {
      if (!window.confirm(`Débannir ${u.pseudo} ?`)) return;
      try { await adminApi.updateUser(token, u.id, { banned: false }); await reload(); }
      catch (e) { window.alert(e instanceof Error ? e.message : 'Erreur'); }
    } else {
      const reason = window.prompt(`Raison du bannissement de ${u.pseudo} :`);
      if (!reason) return;
      try { await adminApi.updateUser(token, u.id, { banned: true, banReason: reason }); await reload(); }
      catch (e) { window.alert(e instanceof Error ? e.message : 'Erreur'); }
    }
  };

  const adjustEcus = async (u: AdminUser) => {
    const deltaRaw = window.prompt(`Ajuster écus de ${u.pseudo} (solde : ${u.ecus})\nDelta (+100, -50, etc) :`);
    if (!deltaRaw) return;
    const delta = Number(deltaRaw.replace(/\s/g, ''));
    if (!Number.isInteger(delta) || delta === 0) { window.alert('Delta invalide'); return; }
    const reason = window.prompt('Raison (audit) :');
    if (!reason) return;
    try {
      const r = await adminApi.adjustEcus(token, u.id, { delta, reason });
      window.alert(`OK — nouveau solde : ${r.balance}`);
      await reload();
    } catch (e) { window.alert(e instanceof Error ? e.message : 'Erreur'); }
  };

  const pageCount = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <AdminPageHeader
        title={`Utilisateurs (${total})`}
        subtitle="Gestion des comptes : rôles, bans, ajustement d'écus."
        right={
          <div className="flex items-center gap-2 bg-white border border-stone-300 rounded-lg px-3 py-1.5 focus-within:border-[#f59e0b] transition">
            <Search className="w-4 h-4 text-stone-400" />
            <input
              placeholder="pseudo ou email"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="bg-transparent outline-none text-stone-800 text-sm w-56 placeholder:text-stone-400"
            />
          </div>
        }
      />
      <ErrorBanner message={error} />
      {loading ? <p className="text-stone-500">Chargement…</p> : (
        <>
          <AdminTable>
            <AdminTableHead>
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Pseudo</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 text-right">Écus</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </AdminTableHead>
            <tbody>
              {users.map((u) => (
                <AdminTableRow key={u.id}>
                  <td className="px-4 py-3 text-stone-500 font-mono text-xs">{u.id}</td>
                  <td className="px-4 py-3 font-medium text-stone-900">{u.pseudo}</td>
                  <td className="px-4 py-3 text-stone-600">{u.email}</td>
                  <td className="px-4 py-3 text-right font-semibold text-amber-700">{u.ecus}</td>
                  <td className="px-4 py-3">
                    {u.role === 'admin' ? <Badge tone="gold">admin</Badge> : <Badge tone="neutral">user</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    {u.bannedAt ? <Badge tone="danger">Banni</Badge> : <Badge tone="success">Actif</Badge>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <IconButton tone="gold" title="Ajuster écus" onClick={() => adjustEcus(u)}><Coins className="w-4 h-4" /></IconButton>
                      <IconButton tone="gold" title={u.role === 'admin' ? 'Retirer admin' : 'Promouvoir admin'} onClick={() => toggleRole(u)}>
                        {u.role === 'admin' ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                      </IconButton>
                      <IconButton tone="danger" title={u.bannedAt ? 'Débannir' : 'Bannir'} onClick={() => toggleBan(u)}>
                        {u.bannedAt ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </IconButton>
                    </div>
                  </td>
                </AdminTableRow>
              ))}
              {users.length === 0 && <tr><td colSpan={7}><Empty message="Aucun utilisateur trouvé." /></td></tr>}
            </tbody>
          </AdminTable>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </>
      )}
    </div>
  );
}
