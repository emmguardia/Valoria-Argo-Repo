import { useCallback, useEffect, useState } from 'react';
import { Ban, CheckCircle, Coins, Shield, ShieldOff, Search } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { adminApi, type AdminUser } from '../../lib/adminApi';

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
      setUsers(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally { setLoading(false); }
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
    const deltaRaw = window.prompt(`Ajuster écus de ${u.pseudo} (solde ${u.ecus}).\nEntrer un delta (+100, -50, etc) :`);
    if (!deltaRaw) return;
    const delta = Number(deltaRaw.replace(/\s/g, ''));
    if (!Number.isInteger(delta) || delta === 0) { window.alert('Delta invalide'); return; }
    const reason = window.prompt('Raison :');
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
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-stone-100">Utilisateurs ({total})</h1>
        <div className="flex items-center gap-2 bg-stone-900 border border-stone-700 rounded px-3 py-1.5">
          <Search className="w-4 h-4 text-stone-400" />
          <input
            placeholder="pseudo ou email"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent outline-none text-stone-100 text-sm w-48"
          />
        </div>
      </div>
      {error && <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>}
      {loading ? <p className="text-stone-400">Chargement…</p> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-stone-400 border-b border-amber-900/20">
                <tr>
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">Pseudo</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Écus</th>
                  <th className="py-2 pr-4">Rôle</th>
                  <th className="py-2 pr-4">Statut</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="text-stone-200">
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-stone-800/50 hover:bg-stone-900/30">
                    <td className="py-2 pr-4 text-stone-500">{u.id}</td>
                    <td className="py-2 pr-4 font-medium">{u.pseudo}</td>
                    <td className="py-2 pr-4 text-stone-400">{u.email}</td>
                    <td className="py-2 pr-4">{u.ecus}</td>
                    <td className="py-2 pr-4">
                      <span className={u.role === 'admin' ? 'text-amber-400' : 'text-stone-400'}>{u.role}</span>
                    </td>
                    <td className="py-2 pr-4">
                      {u.bannedAt ? <span className="text-red-400">Banni</span> : <span className="text-emerald-400">OK</span>}
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-1">
                        <button title="Ajuster écus" onClick={() => adjustEcus(u)} className="p-1 text-amber-300 hover:text-amber-200"><Coins className="w-4 h-4" /></button>
                        <button title="Toggle admin" onClick={() => toggleRole(u)} className="p-1 text-amber-300 hover:text-amber-200">
                          {u.role === 'admin' ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                        </button>
                        <button title="Toggle ban" onClick={() => toggleBan(u)} className="p-1 text-red-400 hover:text-red-300">
                          {u.bannedAt ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-stone-500">Aucun utilisateur.</td></tr>}
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
