'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Tag as TagIcon, Upload } from 'lucide-react';
import Image from 'next/image';
import { Header } from '@/components/dashboard/header';
import { api, cachedGet, invalidateCache, unwrap } from '@/lib/api';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  isActive: boolean;
  order: number;
  _count?: { products: number };
}

const FONT = "'Plus Jakarta Sans', Inter, sans-serif";

export default function BrandsPage() {
  const [items, setItems] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const res = await cachedGet<unknown>('/api/v1/brands', { ttl: 60_000 });
      const arr = unwrap<Brand[]>(res);
      setItems(Array.isArray(arr) ? arr : []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openCreate = () => {
    setEditing(null);
    setName(''); setLogoUrl(''); setIsActive(true); setOrder(0);
    setFormOpen(true);
  };

  const openEdit = (b: Brand) => {
    setEditing(b);
    setName(b.name); setLogoUrl(b.logoUrl || ''); setIsActive(b.isActive); setOrder(b.order);
    setFormOpen(true);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/api/v1/upload/image?folder=landing', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const data = unwrap<{ url?: string; secure_url?: string }>(res);
      setLogoUrl(data.url || data.secure_url || '');
      toast.success('Logo subido');
    } catch { toast.error('Error al subir'); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Nombre requerido'); return; }
    setSubmitting(true);
    const body = { name: name.trim(), logoUrl: logoUrl || null, isActive, order };
    try {
      if (editing) await api.patch(`/api/v1/brands/${editing.id}`, body);
      else await api.post('/api/v1/brands', body);
      invalidateCache('/api/v1/brands');
      toast.success(editing ? 'Marca actualizada' : 'Marca creada');
      setFormOpen(false);
      fetch();
    } catch { toast.error('Error al guardar'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await api.delete(`/api/v1/brands/${deleteId}`); invalidateCache('/api/v1/brands'); toast.success('Eliminada'); fetch(); }
    catch { toast.error('Error'); }
    finally { setDeleteId(null); }
  };

  return (
    <div className="md:space-y-5">
      <div className="reveal-up">
        <Header eyebrow="Catálogo" title="Marcas" description="Marcas de tu tienda visibles en los filtros del landing">
          <button onClick={openCreate} className="btn-fire">
            <Plus className="h-4 w-4" strokeWidth={3} /> Nueva marca
          </button>
        </Header>
      </div>

      {/* MOBILE header */}
      <div className="md:hidden px-5 pt-2 pb-4 reveal-up">
        <p className="label-athletic text-[var(--gym-orange)]">/ Catálogo</p>
        <h1 className="font-display tracking-tight leading-[0.9] mt-2 text-foreground" style={{ fontSize: 'clamp(34px, 9vw, 44px)' }}>
          MARCAS
        </h1>
      </div>

      {!loading && items.length === 0 ? (
        <div className="mx-4 md:mx-0 bg-card rounded-2xl border border-border p-12 text-center anim-fade">
          <TagIcon className="h-12 w-12 mx-auto mb-3" style={{ color: '#FF5A1F' }} />
          <p className="font-bold text-foreground">Sin marcas creadas</p>
          <p className="text-sm text-muted-foreground mt-1">Crea marcas para clasificar productos y mostrarlas en el landing</p>
        </div>
      ) : !loading && (
        <div className="px-4 md:px-0 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 anim-stagger" key={`brands-${items.length}`}>
          {items.map((b) => (
            <div key={b.id} className="bg-card rounded-2xl border border-border overflow-hidden group">
              <div className="aspect-square relative bg-secondary flex items-center justify-center">
                {b.logoUrl ? (
                  <Image src={b.logoUrl} alt={b.name} fill className="object-contain p-3" sizes="200px" />
                ) : (
                  <TagIcon className="h-10 w-10 text-muted-foreground/30" strokeWidth={1.5} />
                )}
                {!b.isActive && <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase" style={{ background: 'rgba(0,0,0,0.7)', color: '#FFF' }}>Inactiva</span>}
                <div className="absolute top-2 right-2 flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(b)} className="press w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.9)', color: '#0A0A0B' }}>
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button onClick={() => setDeleteId(b.id)} className="press w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.9)', color: '#EF4444' }}>
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-[13px] font-black truncate">{b.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{b._count?.products ?? 0} productos</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar marca' : 'Nueva marca'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-[120px_1fr] gap-4">
              <label className="block aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer overflow-hidden relative">
                {logoUrl ? (
                  <Image src={logoUrl} alt="" fill className="object-contain p-2" sizes="120px" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-[10px] font-bold text-muted-foreground">{uploading ? 'Subiendo…' : 'Logo'}</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
              </label>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5 text-muted-foreground">Nombre *</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Optimum Nutrition"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm outline-none focus:border-primary/50" />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5 text-muted-foreground">Orden</label>
                  <input type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm outline-none focus:border-primary/50" />
                </div>
              </div>
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
        title="¿Eliminar marca?"
        description="Los productos quedarán sin marca asignada. Acción irreversible."
        onConfirm={handleDelete}
      />

      {/* FAB móvil */}
      <button onClick={openCreate} className="md:hidden mobile-fab" aria-label="Nueva marca">
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>
    </div>
  );
}
