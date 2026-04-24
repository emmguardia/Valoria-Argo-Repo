import { useCallback, useEffect, useState } from 'react';
import { Pencil, Trash2, Plus, Save } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { adminApi, type AdminProduct, type AdminProductInput } from '../../lib/adminApi';
import {
  AdminButton, AdminPageHeader, AdminTable, AdminTableHead, AdminTableRow,
  Badge, Empty, ErrorBanner, Field, IconButton, Modal, inputCls,
} from '../../components/admin/ui';

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
      setLoading(true); setError(null);
      const { items } = await adminApi.listProducts(token);
      setProducts(items);
    } catch (e) { setError(e instanceof Error ? e.message : 'Erreur'); }
    finally { setLoading(false); }
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
  const close = () => setEditing(null);

  const save = async () => {
    setBusy(true); setError(null);
    try {
      const payload: AdminProductInput = {
        ...form,
        description: form.description?.trim() || null,
        imageUrl: form.imageUrl?.trim() || null,
      };
      if (editing === 'new') await adminApi.createProduct(token, payload);
      else if (editing) await adminApi.updateProduct(token, editing.id, payload);
      close();
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : 'Erreur'); }
    finally { setBusy(false); }
  };

  const remove = async (p: AdminProduct) => {
    if (!window.confirm(`Supprimer "${p.name}" ?`)) return;
    try { await adminApi.deleteProduct(token, p.id); await reload(); }
    catch (e) { window.alert(e instanceof Error ? e.message : 'Erreur'); }
  };

  return (
    <div>
      <AdminPageHeader
        title="Produits"
        subtitle="Items achetables avec des écus, livrés en jeu via RCON."
        right={<AdminButton variant="gold" onClick={openNew}><Plus className="w-4 h-4" /> Nouveau</AdminButton>}
      />
      <ErrorBanner message={error} />
      {loading ? <p className="text-stone-500">Chargement…</p> : (
        <AdminTable>
          <AdminTableHead>
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3 text-right">Prix</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </AdminTableHead>
          <tbody>
            {products.map((p) => (
              <AdminTableRow key={p.id}>
                <td className="px-4 py-3 text-stone-500 font-mono text-xs">{p.id}</td>
                <td className="px-4 py-3 font-medium text-stone-900 flex items-center gap-2">
                  {p.name}
                  {p.isNew && <Badge tone="gold">Nouveau</Badge>}
                </td>
                <td className="px-4 py-3 text-stone-500 font-mono text-xs">{p.slug}</td>
                <td className="px-4 py-3"><Badge tone="info">{p.category}</Badge></td>
                <td className="px-4 py-3 text-right font-semibold text-amber-700">{p.priceEcus} écus</td>
                <td className="px-4 py-3">
                  {p.active ? <Badge tone="success">Actif</Badge> : <Badge tone="neutral">Inactif</Badge>}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1">
                    <IconButton tone="gold" title="Éditer" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></IconButton>
                    <IconButton tone="danger" title="Supprimer" onClick={() => remove(p)}><Trash2 className="w-4 h-4" /></IconButton>
                  </div>
                </td>
              </AdminTableRow>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={7}><Empty message="Aucun produit. Crée le premier avec le bouton 'Nouveau'." /></td></tr>
            )}
          </tbody>
        </AdminTable>
      )}

      <Modal
        open={editing !== null}
        onClose={close}
        title={editing === 'new' ? 'Nouveau produit' : editing && editing !== 'new' ? `Éditer #${editing.id}` : ''}
        footer={
          <>
            <AdminButton variant="ghost" onClick={close}>Annuler</AdminButton>
            <AdminButton variant="gold" onClick={save} disabled={busy}>
              <Save className="w-4 h-4" /> Enregistrer
            </AdminButton>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Slug" hint="a-z, 0-9, _ ou -">
              <input className={inputCls} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
            </Field>
            <Field label="Nom">
              <input className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </Field>
          </div>
          <Field label="Description">
            <textarea className={inputCls} rows={2} value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Catégorie">
              <select className={inputCls} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as AdminProductInput['category'] }))}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Prix (écus)">
              <input type="number" className={inputCls} value={form.priceEcus} onChange={(e) => setForm((f) => ({ ...f, priceEcus: Number(e.target.value) }))} />
            </Field>
          </div>
          <Field label="Image URL">
            <input className={inputCls} value={form.imageUrl ?? ''} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} />
          </Field>
          <Field label="Commande RCON" hint="Utilise {user} pour le pseudo joueur. Ex: give {user} diamond 10">
            <input className={inputCls} value={form.commandTemplate} onChange={(e) => setForm((f) => ({ ...f, commandTemplate: e.target.value }))} />
          </Field>
          <Field label="Ordre d'affichage">
            <input type="number" className={inputCls} value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))} />
          </Field>
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-stone-700 text-sm">
              <input type="checkbox" className="w-4 h-4 accent-[#f59e0b]" checked={form.isNew} onChange={(e) => setForm((f) => ({ ...f, isNew: e.target.checked }))} />
              Marquer comme nouveau
            </label>
            <label className="flex items-center gap-2 text-stone-700 text-sm">
              <input type="checkbox" className="w-4 h-4 accent-[#f59e0b]" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
              Actif (visible boutique)
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
