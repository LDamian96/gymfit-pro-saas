'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { api, unwrap } from '@/lib/api';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string | null;
  isActive: boolean;
  order: number;
  _count?: { products: number };
}

const FONT = "'Plus Jakarta Sans', Inter, sans-serif";

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [iconName, setIconName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/product-categories');
      const arr = unwrap<Category[]>(res);
      setItems(Array.isArray(arr) ? arr : []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openCreate = () => {
    setEditing(null);
    setName(''); setIconName(''); setIsActive(true); setOrder(0);
    setFormOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setName(c.name); setIconName(c.iconName || ''); setIsActive(c.isActive); setOrder(c.order);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Nombre requerido'); return; }
    setSubmitting(true);
    const body = { name: name.trim(), iconName: iconName.trim() || null, isActive, order };
    try {
      if (editing) await api.patch(`/api/v1/product-categories/${editing.id}`, body);
      else await api.post('/api/v1/product-categories', body);
      toast.success(editing ? 'Categoría actualizada' : 'Categoría creada');
      setFormOpen(false);
      fetch();
    } catch { toast.error('Error al guardar'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await api.delete(`/api/v1/product-categories/${deleteId}`); toast.success('Eliminada'); fetch(); }
    catch { toast.error('Error'); }
    finally { setDeleteId(null); }
  };

  return (
    <div className="md:space-y-5">
      <div className="reveal-up">
        <Header eyebrow="Catálogo" title="Categorías" description="Organiza tu tienda en categorías visibles en los filtros del landing">
          <button onClick={openCreate} className="btn-fire">
            <Plus className="h-4 w-4" strokeWidth={3} /> Nueva categoría
          </button>
        </Header>
      </div>

      {/* MOBILE header */}
      <div className="md:hidden px-5 pt-2 pb-4 reveal-up">
        <p className="label-athletic text-[var(--gym-orange)]">/ Catálogo</p>
        <h1 className="font-display tracking-tight leading-[0.9] mt-2 text-foreground" style={{ fontSize: 'clamp(34px, 9vw, 44px)' }}>
          CATEGORÍAS
        </h1>
      </div>

      {!loading && items.length === 0 ? (
        <div className="mx-4 md:mx-0 bg-card rounded-2xl border border-border p-12 text-center anim-fade">
          <Package className="h-12 w-12 mx-auto mb-3" style={{ color: '#FF5A1F' }} />
          <p className="font-bold text-foreground">Sin categorías creadas</p>
          <p className="text-sm text-muted-foreground mt-1">Crea categorías para organizar tu tienda</p>
        </div>
      ) : !loading && (
        <div className="px-4 md:px-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 anim-stagger" key={`cats-${items.length}`}>
          {items.map((c) => (
            <div key={c.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,90,31,0.15)' }}>
                <Package className="h-6 w-6" style={{ color: '#FF5A1F' }} strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-black truncate">{c.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span>{c._count?.products ?? 0} productos</span>
                  {!c.isActive && <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase" style={{ background: 'rgba(115,115,115,0.15)', color: '#737373' }}>Inactiva</span>}
                </p>
              </div>
              <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(c)} className="press w-8 h-8 rounded-md flex items-center justify-center bg-secondary"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => setDeleteId(c.id)} className="press w-8 h-8 rounded-md flex items-center justify-center bg-secondary text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5 text-muted-foreground">Nombre *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Proteínas"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5 text-muted-foreground">Orden</label>
              <input type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm outline-none focus:border-primary/50" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 accent-orange-500" />
              <span className="text-[13px] font-bold">Activa (visible en filtros)</span>
            </label>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setFormOpen(false)} className="flex-1 py-2.5 rounded-xl text-[12px] font-black uppercase bg-secondary">Cancelar</button>
              <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-wider text-white disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)' }}>
                {submitting ? '…' : editing ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="¿Eliminar categoría?"
        description="Los productos quedarán sin categoría asignada."
        onConfirm={handleDelete}
      />

      {/* FAB móvil */}
      <button onClick={openCreate} className="md:hidden mobile-fab" aria-label="Nueva categoría">
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>
    </div>
  );
}
