import { useCallback, useEffect, useState } from 'react';
import { Pencil, Trash2, Plus, X, Save } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { adminApi, type AdminProduct, type AdminProductInput } from '../../lib/adminApi';

const CATEGORIES: AdminProductInput['category'][] = ['cosmetiques', 'avantages', 'kits', 'grades'];

const emptyForm: AdminProductInput = {
  slug: '',
  name: '',
  description: '',
  category: 'cosmetiques',
  priceEcus: 100,
  imageUrl: '',
  commandTemplate: 'give {user} diamond 1',
  isNew: false,
  active: true,
  sortOrder: 0,
};

export default function AdminProductsPage() {
  const { token } = useUser();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminProduct | 'new' | null>(null);
  const [form, setForm] = useState<AdminProductInput>(emptyForm);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { items } = await adminApi.listProducts(token);
      setProducts(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void reload(); }, [reload]);

  const openNew = () => { setEditing('new'); setForm(emptyForm); };
  const openEdit = (p: AdminProduct) => {
    setEditing(p);
    setForm({
      slug: p.slug, name: p.name, description: p.description ?? '', category: p.category,
      priceEcus: p.priceEcus, imageUrl: p.imageUrl ?? '', commandTemplate: p.commandTemplate,
      isNew: p.isNew, active: p.active, sortOrder: p.sortOrder,
    });
  };
  const close = () => { setEditing(null); };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const payload: AdminProductInput = {
        ...form,
        description: form.description?.trim() || null,
        imageUrl: form.imageUrl?.trim() || null,
      };
      if (editing === 'new') {
        await adminApi.createProduct(token, payload);
      } else if (editing) {
        await adminApi.updateProduct(token, editing.id, payload);
      }
      close();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: AdminProduct) => {
    if (!window.confirm(`Supprimer "${p.name}" ?`)) return;
    try {
      await adminApi.deleteProduct(token, p.id);
      await reload();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Erreur');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-100">Produits</h1>
        <button onClick={openNew} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-900 font-semibold px-4 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> Nouveau
        </button>
      </div>

      {error && <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>}
      {loading ? <p className="text-stone-400">Chargement…</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-stone-400 border-b border-amber-900/20">
              <tr>
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">Nom</th>
                <th className="py-2 pr-4">Slug</th>
                <th className="py-2 pr-4">Catégorie</th>
                <th className="py-2 pr-4">Prix (écus)</th>
                <th className="py-2 pr-4">Actif</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="text-stone-200">
              {products.map((p) => (
                <tr key={p.id} className="border-b border-stone-800/50 hover:bg-stone-900/30">
                  <td className="py-2 pr-4 text-stone-500">{p.id}</td>
                  <td className="py-2 pr-4 font-medium">{p.name}</td>
                  <td className="py-2 pr-4 text-stone-400">{p.slug}</td>
                  <td className="py-2 pr-4">{p.category}</td>
                  <td className="py-2 pr-4">{p.priceEcus}</td>
                  <td className="py-2 pr-4">{p.active ? '✓' : '—'}</td>
                  <td className="py-2 pr-4 flex gap-2">
                    <button onClick={() => openEdit(p)} className="p-1 text-amber-300 hover:text-amber-200"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => remove(p)} className="p-1 text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-stone-500">Aucun produit.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={close}>
          <div className="bg-[#14110f] border border-amber-900/30 rounded-xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-stone-100">{editing === 'new' ? 'Nouveau produit' : `Éditer #${editing.id}`}</h2>
              <button onClick={close} className="text-stone-400 hover:text-stone-200"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid gap-3 text-sm">
              <Field label="Slug"><input className={inputCls} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} /></Field>
              <Field label="Nom"><input className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
              <Field label="Description"><textarea className={inputCls} rows={2} value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
              <Field label="Catégorie">
                <select className={inputCls} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as AdminProductInput['category'] }))}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Prix (écus)"><input type="number" className={inputCls} value={form.priceEcus} onChange={(e) => setForm((f) => ({ ...f, priceEcus: Number(e.target.value) }))} /></Field>
              <Field label="Image URL"><input className={inputCls} value={form.imageUrl ?? ''} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} /></Field>
              <Field label="Commande (template, {user})"><input className={inputCls} value={form.commandTemplate} onChange={(e) => setForm((f) => ({ ...f, commandTemplate: e.target.value }))} /></Field>
              <Field label="Ordre"><input type="number" className={inputCls} value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))} /></Field>
              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-stone-300"><input type="checkbox" checked={form.isNew} onChange={(e) => setForm((f) => ({ ...f, isNew: e.target.checked }))} /> Nouveau</label>
                <label className="flex items-center gap-2 text-stone-300"><input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} /> Actif</label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={close} className="px-4 py-2 text-stone-300 hover:text-stone-100">Annuler</button>
              <button onClick={save} disabled={busy} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-900 font-semibold px-4 py-2 rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded text-stone-100 focus:outline-none focus:border-amber-500';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-stone-400 text-xs uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}
