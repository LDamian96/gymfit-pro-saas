'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { api, unwrap } from '@/lib/api';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface GamificationItem {
  id: string;
  name: string;
  type: 'STREAK' | 'BADGE' | 'CHALLENGE';
  description: string | null;
  points: number;
  isActive: boolean;
}

const typeConfig: Record<string, { label: string; className: string }> = {
  STREAK: { label: 'Racha', className: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400' },
  BADGE: { label: 'Badge', className: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400' },
  CHALLENGE: { label: 'Reto', className: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400' },
};

const typeOptions: { value: string; label: string }[] = [
  { value: 'STREAK', label: 'Racha' },
  { value: 'BADGE', label: 'Badge' },
  { value: 'CHALLENGE', label: 'Reto' },
];

export default function GamificationPage() {
  const [items, setItems] = useState<GamificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GamificationItem | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('CHALLENGE');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState(10);
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/gamification');
      const arr = unwrap<GamificationItem[]>(res);
      setItems(Array.isArray(arr) ? arr : []);
    } catch { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setType('CHALLENGE');
    setDescription('');
    setPoints(10);
    setFormOpen(true);
  };

  const openEdit = (item: GamificationItem) => {
    setEditing(item);
    setName(item.name);
    setType(item.type);
    setDescription(item.description || '');
    setPoints(item.points);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const body = { name, type, description: description || undefined, points };
      if (editing) {
        await api.patch(`/api/v1/gamification/${editing.id}`, body);
        toast.success('Actualizado');
      } else {
        await api.post('/api/v1/gamification', body);
        toast.success('Creado');
      }
      setFormOpen(false);
      fetchItems();
    } catch { toast.error('Error al guardar'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await api.delete(`/api/v1/gamification/${deleteId}`); toast.success('Eliminado'); fetchItems(); }
    catch { toast.error('Error'); }
    finally { setDeleteId(null); }
  };

  return (
    <div className="md:space-y-6">
      <div className="anim-lego">
        <Header title="Gamificación" description="Retos, badges y logros para motivar a tus miembros">
          <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors">
            <Plus className="h-4 w-4" /> Nuevo Reto
          </button>
        </Header>
      </div>

      {/* MOBILE header */}
      <div className="md:hidden px-5 pt-14 pb-3 anim-fade">
        <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: 'hsl(var(--muted-foreground))' }}>Motivación</p>
        <h1 className="text-[28px] font-black tracking-tight mt-1 leading-none">RETOS</h1>
      </div>

      {/* MOBILE: lista de cards — sin skeleton */}
      <div className="md:hidden px-4 space-y-2.5 anim-stagger" key={`gamif-${loading ? 'l' : items.length}`}>
        {loading ? null : items.length === 0 ? (
          <div className="rounded-3xl py-12 px-6 text-center anim-fade" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <p className="text-[13px] font-bold" style={{ color: 'hsl(var(--muted-foreground))' }}>No hay retos configurados</p>
          </div>
        ) : items.map((item) => (
          <div key={item.id} className="mlist-card !items-start !flex-col !gap-2 !p-3.5">
            <div className="flex items-center gap-3 w-full">
              <div className="mlist-avatar" style={{ background: 'rgba(234,179,8,0.15)', color: '#CA8A04', fontSize: '14px' }}>
                {item.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black truncate leading-tight">{item.name}</p>
                <span className={`inline-flex mt-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${typeConfig[item.type]?.className || 'bg-secondary text-muted-foreground'}`}>
                  {typeConfig[item.type]?.label || item.type}
                </span>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[16px] font-black tabular-nums leading-none" style={{ color: '#FF5A1F' }}>{item.points}</p>
                <p className="text-[9px] font-bold mt-1 uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>pts</p>
              </div>
            </div>
            {item.description && <p className="text-[11px] mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{item.description}</p>}
            <div className="flex items-center justify-end gap-1.5 w-full pt-2 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
              <button onClick={() => openEdit(item)} className="press inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider"
                style={{ background: 'hsl(var(--secondary))' }}>
                <Pencil className="h-3 w-3" /> Editar
              </button>
              <button onClick={() => setDeleteId(item.id)} className="press inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider"
                style={{ background: 'rgba(239,68,68,0.10)', color: '#EF4444' }}>
                <Trash2 className="h-3 w-3" /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla — desktop */}
      <div className="hidden md:block bg-card rounded-2xl border border-border overflow-hidden anim-lego" style={{ animationDelay: '60ms' }}>
        <div className="grid grid-cols-[1.2fr_0.6fr_2fr_0.5fr_0.5fr] px-5 py-3 bg-secondary border-b border-border">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Reto / Badge</span>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Tipo</span>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Descripción</span>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Puntos</span>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide text-right">Acciones</span>
        </div>

        {loading && items.length === 0 ? (
          <div className="h-[280px]" />
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground anim-fade">No hay retos configurados</div>
        ) : (
          <div className="anim-stagger" key={`gamif-${items.length}`}>
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-[1.2fr_0.6fr_2fr_0.5fr_0.5fr] items-center px-5 py-3 border-b border-border last:border-b-0 hover:bg-secondary/50 transition-colors">
              <span className="text-sm font-medium text-foreground">{item.name}</span>
              <span className={`inline-flex w-fit px-2.5 py-0.5 rounded-full text-[11px] font-medium ${typeConfig[item.type]?.className || 'bg-secondary text-muted-foreground'}`}>
                {typeConfig[item.type]?.label || item.type}
              </span>
              <span className="text-sm text-muted-foreground truncate">{item.description || '—'}</span>
              <span className="text-sm font-bold text-foreground">{item.points}</span>
              <div className="flex items-center justify-end gap-1">
                <button onClick={() => openEdit(item)} className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setDeleteId(item.id)} className="p-2 text-muted-foreground hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Reto' : 'Nuevo Reto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-foreground">Nombre</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Racha de 7 días" className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground outline-none focus:border-primary/50" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Tipo</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:border-primary/50">
                  {typeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Puntos</label>
                <input type="number" value={points} onChange={(e) => setPoints(parseInt(e.target.value) || 0)} className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:border-primary/50" required />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Descripción</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Entrena 7 días seguidos" className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground outline-none focus:border-primary/50 resize-none" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors">Cancelar</button>
              <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                {submitting ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)} title="¿Eliminar este reto?" description="Esta acción no se puede deshacer." onConfirm={handleDelete} />

      {/* FAB móvil */}
      <button onClick={openCreate} className="md:hidden mobile-fab" aria-label="Nuevo reto">
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>
    </div>
  );
}
