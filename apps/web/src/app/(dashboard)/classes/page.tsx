'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { api, cachedGet, invalidateCache } from '@/lib/api';
import { toast } from 'sonner';

interface ClassItem {
  id: string;
  name: string;
  description: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  isActive: boolean;
  instructor: { firstName: string; lastName: string };
  instructorId: string;
  _count?: { bookings: number };
}

interface Trainer {
  id: string;
  firstName: string;
  lastName: string;
}

interface ClassFormData {
  name: string;
  description: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  maxCapacity: string;
  instructorId: string;
}

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DAYS_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const initialFormData: ClassFormData = {
  name: '', description: '', dayOfWeek: '', startTime: '', endTime: '', maxCapacity: '', instructorId: '',
};

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [formData, setFormData] = useState<ClassFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    try {
      const data = await cachedGet<{ data: ClassItem[] }>('/api/v1/classes', { ttl: 20_000 });
      setClasses(data.data);
    } catch { toast.error('Error al cargar clases'); }
    finally { setLoading(false); }
  }, []);

  const fetchTrainers = useCallback(async () => {
    try {
      const data = await cachedGet<{ data: Trainer[] }>('/api/v1/staff', { params: { role: 'TRAINER' }, ttl: 60_000 });
      setTrainers(data.data);
    } catch { toast.error('Error al cargar entrenadores'); }
  }, []);

  // Paralelo en la carga inicial
  useEffect(() => { Promise.all([fetchClasses(), fetchTrainers()]); }, [fetchClasses, fetchTrainers]);

  const updateField = (field: keyof ClassFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const openCreate = () => { setEditingClass(null); setFormData(initialFormData); setDialogOpen(true); };
  const openEdit = (cls: ClassItem) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name, description: cls.description || '', dayOfWeek: String(cls.dayOfWeek),
      startTime: cls.startTime, endTime: cls.endTime, maxCapacity: String(cls.maxCapacity), instructorId: cls.instructorId,
    });
    setDialogOpen(true);
  };

  const isFormValid = formData.name.trim() && formData.dayOfWeek !== '' && formData.startTime && formData.endTime && formData.maxCapacity && Number(formData.maxCapacity) > 0 && formData.instructorId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setSubmitting(true);
    const payload = {
      name: formData.name.trim(), description: formData.description.trim() || undefined,
      dayOfWeek: Number(formData.dayOfWeek), startTime: formData.startTime, endTime: formData.endTime,
      maxCapacity: Number(formData.maxCapacity), instructorId: formData.instructorId,
    };
    try {
      if (editingClass) { await api.patch(`/api/v1/classes/${editingClass.id}`, payload); toast.success('Clase actualizada'); }
      else { await api.post('/api/v1/classes', payload); toast.success('Clase creada'); }
      invalidateCache('/api/v1/classes');
      setDialogOpen(false); fetchClasses();
    } catch { toast.error('Error al guardar clase'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try { await api.delete(`/api/v1/classes/${deletingId}`); invalidateCache('/api/v1/classes'); toast.success('Clase eliminada'); fetchClasses(); }
    catch { toast.error('Error al eliminar'); }
    finally { setDeleteDialogOpen(false); setDeletingId(null); }
  };

  return (
    <div className="md:space-y-6">
      <div className="reveal-up">
        <Header eyebrow="Programación" title="Clases" description="Clases grupales, horarios y cupos disponibles">
          <button onClick={openCreate} className="btn-fire">
            <Plus className="h-4 w-4" strokeWidth={3} /> Nueva clase
          </button>
        </Header>
      </div>

      {/* MOBILE header */}
      <div className="md:hidden px-5 pt-2 pb-4 reveal-up">
        <p className="label-athletic text-[var(--gym-orange)]">/ Programación</p>
        <h1 className="font-display tracking-tight leading-[0.9] mt-2 text-foreground" style={{ fontSize: 'clamp(34px, 9vw, 44px)' }}>
          CLASES
        </h1>
      </div>

      {/* MOBILE: lista de cards — sin skeleton, animación lego al cargar */}
      <div className="md:hidden px-4 space-y-2.5 anim-stagger" key={`classes-mobile-${loading ? 'l' : classes.length}`}>
        {loading ? null : classes.length === 0 ? (
          <div className="rounded-3xl py-12 px-6 text-center anim-fade" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <p className="text-[13px] font-bold" style={{ color: 'hsl(var(--muted-foreground))' }}>Sin clases registradas</p>
          </div>
        ) : classes.map((cls) => (
          <div key={cls.id} className="mlist-card flex-col items-stretch !gap-2 !p-3.5">
            <div className="flex items-center gap-3">
              <div className="mlist-avatar" style={{ background: 'rgba(255,90,31,0.15)', color: '#FF5A1F', fontSize: '14px' }}>
                {cls.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black truncate leading-tight">{cls.name}</p>
                <p className="text-[10px] font-bold mt-0.5 truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {cls.instructor.firstName} {cls.instructor.lastName[0]}. · {DAYS_FULL[cls.dayOfWeek]}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[14px] font-black tabular-nums" style={{ color: '#FF5A1F' }}>{cls.startTime}</p>
                <p className="text-[9px] font-bold mt-0.5 uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{cls._count?.bookings || 0}/{cls.maxCapacity}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-1.5 pt-2 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
              <button onClick={() => openEdit(cls)} className="press inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider"
                style={{ background: 'hsl(var(--secondary))' }}>
                <Pencil className="h-3 w-3" /> Editar
              </button>
              <button onClick={() => { setDeletingId(cls.id); setDeleteDialogOpen(true); }}
                className="press inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider"
                style={{ background: 'rgba(239,68,68,0.10)', color: '#EF4444' }}>
                <Trash2 className="h-3 w-3" /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla de clases — desktop */}
      <div className="hidden md:block bg-card rounded-2xl border border-border overflow-hidden anim-lego" style={{ animationDelay: '60ms' }}>
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.5fr_0.5fr] px-5 py-3 bg-secondary border-b border-border">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Clase</span>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Instructor</span>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Horario</span>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Días</span>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Cupos</span>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide text-right">Acciones</span>
        </div>

        {loading && classes.length === 0 ? (
          <div className="h-[280px]" />
        ) : classes.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground/70 anim-fade">No hay clases registradas</div>
        ) : (
          <div className="anim-stagger" key={`cls-${classes.length}`}>
          {classes.map((cls) => (
            <div key={cls.id} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.5fr_0.5fr] items-center px-5 py-3 border-b border-border last:border-b-0 hover:bg-secondary/50 transition-colors">
              <span className="text-sm font-medium text-foreground">{cls.name}</span>
              <span className="text-sm text-muted-foreground">{cls.instructor.firstName} {cls.instructor.lastName[0]}.</span>
              <span className="text-sm text-muted-foreground">{cls.startTime} - {cls.endTime}</span>
              <span className="text-sm text-muted-foreground">{DAYS_FULL[cls.dayOfWeek]}</span>
              <span className="text-sm text-foreground font-medium">{cls._count?.bookings || 0}/{cls.maxCapacity}</span>
              <div className="flex items-center justify-end gap-1">
                <button onClick={() => openEdit(cls)} className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => { setDeletingId(cls.id); setDeleteDialogOpen(true); }} className="p-2 text-muted-foreground hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      {/* Dialog crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingClass ? 'Editar Clase' : 'Nueva Clase'}</DialogTitle>
            <DialogDescription>{editingClass ? 'Modifica los datos de la clase' : 'Completa los datos de la nueva clase'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Nombre</Label><Input placeholder="Ej: Spinning, Yoga..." value={formData.name} onChange={(e) => updateField('name', e.target.value)} /></div>
            <div className="space-y-2"><Label>Descripción</Label><Textarea placeholder="Descripción..." value={formData.description} onChange={(e) => updateField('description', e.target.value)} rows={2} /></div>
            <div className="space-y-2"><Label>Día</Label>
              <Select value={formData.dayOfWeek} onValueChange={(val) => updateField('dayOfWeek', val || '')}>
                <SelectTrigger><SelectValue placeholder="Seleccionar día" /></SelectTrigger>
                <SelectContent>{DAYS.map((day, i) => <SelectItem key={i} value={String(i)}>{day}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Inicio</Label><Input type="time" value={formData.startTime} onChange={(e) => updateField('startTime', e.target.value)} /></div>
              <div className="space-y-2"><Label>Fin</Label><Input type="time" value={formData.endTime} onChange={(e) => updateField('endTime', e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Capacidad</Label><Input type="number" min="1" value={formData.maxCapacity} onChange={(e) => updateField('maxCapacity', e.target.value)} /></div>
            <div className="space-y-2"><Label>Instructor</Label>
              <Select value={formData.instructorId} onValueChange={(val) => updateField('instructorId', val || '')}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{trainers.map((t) => <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <button type="button" onClick={() => setDialogOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground/80">Cancelar</button>
              <button type="submit" disabled={!isFormValid || submitting} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg disabled:opacity-50">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingClass ? 'Guardar' : 'Crear'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="¿Eliminar clase?" description="Esta acción no se puede deshacer." onConfirm={handleDelete} confirmText="Eliminar" destructive />

      {/* FAB móvil */}
      <button onClick={openCreate} className="md:hidden mobile-fab" aria-label="Nueva clase">
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>
    </div>
  );
}
