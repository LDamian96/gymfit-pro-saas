'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, Dumbbell, X, GripVertical } from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { api, cachedGet, invalidateCache, unwrap } from '@/lib/api';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { toast } from 'sonner';

interface MuscleGroup {
  id: string;
  name: string;
  icon: string | null;
  order: number;
  isActive: boolean;
}

const SUGGESTED_DEFAULTS = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core', 'Cardio', 'Glúteos'];

export default function MuscleGroupsPage() {
  const [groups, setGroups] = useState<MuscleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MuscleGroup | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Estado de drag & drop. Source = index del que estoy arrastrando, Over = sobre cuál estoy.
  const [dragSourceIdx, setDragSourceIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Cuando termina el drag, reordenar local + persistir order vía PATCH a cada grupo afectado.
  const handleDragEnd = async () => {
    const src = dragSourceIdx;
    const dst = dragOverIdx;
    setDragSourceIdx(null);
    setDragOverIdx(null);
    if (src == null || dst == null || src === dst) return;
    // Reordenar el array localmente para feedback inmediato.
    const next = [...groups];
    const [moved] = next.splice(src, 1);
    next.splice(dst, 0, moved);
    // Re-numeramos order 0..n para mantener consistencia.
    const renumbered = next.map((g, i) => ({ ...g, order: i }));
    setGroups(renumbered);
    // Persistir solo los que cambiaron de order.
    try {
      await Promise.all(
        renumbered
          .filter((g) => groups.find((og) => og.id === g.id)?.order !== g.order)
          .map((g) => api.patch(`/api/v1/muscle-groups/${g.id}`, { order: g.order }))
      );
      invalidateCache('/api/v1/muscle-groups');
    } catch {
      toast.error('Error al guardar el orden');
      fetchGroups(); // revertir desde server
    }
  };

  const fetchGroups = useCallback(async () => {
    try {
      const res = await cachedGet<unknown>('/api/v1/muscle-groups', { ttl: 30_000 });
      const data = unwrap<MuscleGroup[]>(res);
      setGroups(Array.isArray(data) ? data : []);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const openCreate = (preset?: string) => {
    setEditing(null);
    setName(preset ?? '');
    setIcon('');
    setFormOpen(true);
  };

  const openEdit = (g: MuscleGroup) => {
    setEditing(g);
    setName(g.name);
    setIcon(g.icon ?? '');
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      // Al crear, el nuevo grupo va al final (order = groups.length).
      const body: { name: string; icon?: string; order?: number } = {
        name: name.trim(),
        icon: icon.trim() || undefined,
      };
      if (!editing) body.order = groups.length;
      if (editing) {
        await api.patch(`/api/v1/muscle-groups/${editing.id}`, body);
        toast.success('Grupo actualizado');
      } else {
        await api.post('/api/v1/muscle-groups', body);
        toast.success('Grupo creado');
      }
      invalidateCache('/api/v1/muscle-groups');
      setFormOpen(false);
      fetchGroups();
    } catch {
      toast.error('Error al guardar (¿nombre repetido?)');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/api/v1/muscle-groups/${deleteId}`);
      invalidateCache('/api/v1/muscle-groups');
      toast.success('Grupo eliminado');
      fetchGroups();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeleteId(null);
    }
  };

  const seedDefaults = async () => {
    setSubmitting(true);
    try {
      const existing = new Set(groups.map((g) => g.name.toLowerCase()));
      const toCreate = SUGGESTED_DEFAULTS.filter((n) => !existing.has(n.toLowerCase()));
      for (let i = 0; i < toCreate.length; i++) {
        await api.post('/api/v1/muscle-groups', { name: toCreate[i], order: groups.length + i });
      }
      invalidateCache('/api/v1/muscle-groups');
      toast.success(`${toCreate.length} grupos agregados`);
      fetchGroups();
    } catch {
      toast.error('Error al agregar grupos');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="md:space-y-6">
      <div className="reveal-up">
        <Header eyebrow="Catálogo" title="Grupos Musculares" description="Catálogo compartido para clasificar ejercicios en todas las sucursales">
          <button onClick={() => openCreate()} className="btn-fire">
            <Plus className="h-4 w-4" strokeWidth={3} /> Nuevo grupo
          </button>
        </Header>
      </div>

      {/* MOBILE header */}
      <div className="md:hidden px-5 pt-2 pb-4 reveal-up">
        <p className="label-athletic text-[var(--gym-orange)]">/ Catálogo</p>
        <h1 className="font-display tracking-tight leading-[0.9] mt-2 text-foreground" style={{ fontSize: 'clamp(28px, 8vw, 38px)' }}>
          GRUPOS<br />MUSCULARES
        </h1>
      </div>

      {/* Empty state con sugerencias rápidas */}
      {!loading && groups.length === 0 && (
        <div className="px-4 md:px-0 anim-fade">
          <div className="bg-card rounded-2xl border border-border p-6 text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: 'rgba(255,90,31,0.12)' }}>
              <Dumbbell className="h-7 w-7" style={{ color: '#FF5A1F' }} />
            </div>
            <p className="text-[14px] font-black mb-1">Sin grupos musculares aún</p>
            <p className="text-[12px] mb-5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Crea tus grupos o usa los sugeridos para empezar rápido.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {SUGGESTED_DEFAULTS.map((n) => (
                <button key={n} onClick={() => openCreate(n)}
                  className="px-3 py-1.5 rounded-lg bg-secondary text-[12px] font-bold hover:bg-accent transition-colors">
                  + {n}
                </button>
              ))}
            </div>
            <button onClick={seedDefaults} disabled={submitting}
              className="press text-[12px] font-black uppercase tracking-wider px-4 py-2 rounded-lg text-white"
              style={{ background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)' }}>
              {submitting ? 'Creando…' : 'Crear los 8 sugeridos'}
            </button>
          </div>
        </div>
      )}

      {!loading && groups.length > 0 && (
        <>
          <div className="px-4 md:px-0 mb-3">
            <p className="text-[11px] text-muted-foreground">
              Arrastra <GripVertical className="inline h-3 w-3 align-middle" /> para reordenar los grupos.
            </p>
          </div>
          <div className="px-4 md:px-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" key={`mg-${groups.length}`}>
            {groups.map((g, idx) => (
              <DraggableCard
                key={g.id}
                group={g}
                index={idx}
                isDragging={dragSourceIdx === idx}
                isOver={dragOverIdx === idx && dragSourceIdx !== idx}
                onDragStart={() => setDragSourceIdx(idx)}
                onDragEnter={() => setDragOverIdx(idx)}
                onDragEnd={handleDragEnd}
                onEdit={() => openEdit(g)}
                onDelete={() => setDeleteId(g.id)}
              />
            ))}
          </div>
        </>
      )}

      {/* Form sheet */}
      {formOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center native-overlay" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={() => setFormOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="native-sheet md:anim-pop w-full md:max-w-[440px] md:rounded-3xl rounded-t-[28px] bg-card flex flex-col"
            style={{ maxHeight: '92vh', boxShadow: '0 -16px 48px -8px rgba(0,0,0,0.30)' }}>

            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="drag-handle" />
            </div>

            <div className="px-6 pt-4 pb-4 border-b border-border flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {editing ? 'Editando' : 'Nuevo'}
                </p>
                <h3 className="text-[20px] font-black tracking-tight leading-tight">
                  {name || (editing ? 'Grupo' : 'Grupo nuevo')}
                </h3>
              </div>
              <button type="button" onClick={() => setFormOpen(false)} className="press w-9 h-9 rounded-xl flex items-center justify-center bg-secondary shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="text-[11px] font-black uppercase tracking-[0.12em] mb-1.5 block">Nombre *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Pecho" required autoFocus
                  className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-[14px] outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[11px] font-black uppercase tracking-[0.12em] mb-1.5 block">Ícono / emoji</label>
                <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="💪 (opcional)" maxLength={4}
                  className="w-full px-3.5 py-3 rounded-xl border border-border bg-secondary/50 text-foreground text-[14px] outline-none focus:border-primary focus:bg-secondary transition-colors" />
                <p className="text-[10px] text-muted-foreground mt-1.5">El orden se ajusta arrastrando las cards en la lista.</p>
              </div>
            </form>

            <div className="px-6 py-4 border-t border-border" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
              <button onClick={handleSubmit} disabled={submitting || !name.trim()}
                className="press w-full py-4 rounded-2xl text-white text-[14px] font-black uppercase tracking-[0.12em] disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)', boxShadow: '0 12px 24px -8px rgba(255,90,31,0.50)' }}>
                {submitting ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear grupo'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="¿Eliminar este grupo muscular?" description="Los ejercicios que ya están etiquetados con este grupo conservarán su nombre." onConfirm={handleDelete} />

      <button onClick={() => openCreate()} className="md:hidden mobile-fab" aria-label="Nuevo grupo">
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>
    </div>
  );
}

// ====== Card arrastrable de grupo muscular ======
interface DraggableCardProps {
  group: MuscleGroup;
  index: number;
  isDragging: boolean;
  isOver: boolean;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
  onEdit: () => void;
  onDelete: () => void;
}
function DraggableCard({ group: g, isDragging, isOver, onDragStart, onDragEnter, onDragEnd, onEdit, onDelete }: DraggableCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        // Necesario en Firefox
        try { e.dataTransfer.setData('text/plain', g.id); } catch {}
        onDragStart();
      }}
      onDragEnter={(e) => { e.preventDefault(); onDragEnter(); }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
      onDragEnd={onDragEnd}
      onDrop={(e) => { e.preventDefault(); onDragEnd(); }}
      className="bg-card rounded-xl border border-border p-4 flex items-center gap-3 transition-all"
      style={{
        opacity: isDragging ? 0.4 : 1,
        transform: isDragging ? 'scale(0.96)' : isOver ? 'scale(1.02)' : 'scale(1)',
        borderColor: isOver ? 'var(--gym-orange)' : undefined,
        boxShadow: isOver ? '0 0 0 2px rgba(255,90,31,0.25)' : undefined,
        cursor: 'grab',
      }}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 fire-card">
        {g.icon ? (
          <span className="text-white text-[18px]">{g.icon}</span>
        ) : (
          <Dumbbell className="h-4 w-4 text-white" strokeWidth={2.5} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-[13px] font-bold truncate text-foreground">{g.name}</h3>
      </div>
      <div className="flex flex-col gap-0.5 shrink-0">
        <button onClick={onEdit} className="press p-1 text-muted-foreground hover:text-foreground rounded">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={onDelete} className="press p-1 text-muted-foreground hover:text-red-600 rounded">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
