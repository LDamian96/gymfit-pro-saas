'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Dumbbell, ArrowLeft, Plus, Loader2, Search, ClipboardList, Pencil, Trash2, ChevronDown, Image as ImageIcon, Video,
} from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { api, cachedGet, invalidateCache } from '@/lib/api';
import { toast } from 'sonner';
import { staggerContainer, staggerItem } from '@/animations/variants';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { RoutineBuilder, type DayFormData as BuilderDayData, type ExerciseDb as BuilderExDb } from './_components/routine-builder';

interface Member { id: string; firstName: string; lastName: string; email: string; membershipType: string; isActive: boolean; }
interface ExerciseDb { id: string; name: string; muscleGroup: string | null; equipment: string | null; imageUrl: string | null; videoUrl: string | null; }
interface RoutineExercise { name: string; sets: number; reps: number; weight: number | null; restSeconds: number | null; exercise?: ExerciseDb; }
interface RoutineDay { dayOfWeek: number; exercises: RoutineExercise[]; }
interface Routine { id: string; name: string; description: string | null; days: RoutineDay[]; createdAt: string; }

interface ExerciseFormItem { exerciseId: string; exerciseName: string; sets: number; reps: number; weight: number; restSeconds: number; }
interface DayFormData { dayOfWeek: number; exercises: ExerciseFormItem[]; }

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function RoutinesPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loadingRoutines, setLoadingRoutines] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [routineName, setRoutineName] = useState('');
  const [routineDesc, setRoutineDesc] = useState('');
  const [days, setDays] = useState<DayFormData[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<ExerciseDb[]>([]);

  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const res = await cachedGet<{ data: Member[] }>('/api/v1/members', { params: { limit: 100 }, ttl: 30_000 });
      setMembers(res.data);
    } catch { toast.error('Error al cargar clientes'); }
    finally { setLoadingMembers(false); }
  }, []);

  const fetchExercises = useCallback(async () => {
    try {
      const res = await cachedGet<{ data: ExerciseDb[] } | ExerciseDb[]>('/api/v1/exercises', { ttl: 60_000 });
      setExercises(Array.isArray(res) ? res : res.data || []);
    } catch { /* sin ejercicios */ }
  }, []);

  // Carga inicial paralela: clientes y ejercicios al mismo tiempo
  useEffect(() => { Promise.all([fetchMembers(), fetchExercises()]); }, [fetchMembers, fetchExercises]);

  const fetchRoutines = useCallback(async (memberId: string) => {
    setLoadingRoutines(true);
    try {
      const res = await cachedGet<{ data: Routine[] }>('/api/v1/routines', { params: { memberId }, ttl: 30_000 });
      setRoutines(res.data || []);
    } catch { setRoutines([]); }
    finally { setLoadingRoutines(false); }
  }, []);

  const handleSelectMember = (m: Member) => { setSelectedMember(m); fetchRoutines(m.id); };
  const handleBack = () => { setSelectedMember(null); setRoutines([]); };

  const toggleDay = (dayIdx: number) => {
    setDays((prev) => {
      const exists = prev.find((d) => d.dayOfWeek === dayIdx);
      if (exists) return prev.filter((d) => d.dayOfWeek !== dayIdx);
      return [...prev, { dayOfWeek: dayIdx, exercises: [] }].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    });
  };

  const addExerciseToDay = (dayIdx: number) => {
    setDays((prev) => prev.map((d) =>
      d.dayOfWeek === dayIdx
        ? { ...d, exercises: [...d.exercises, { exerciseId: '', exerciseName: '', sets: 3, reps: 10, weight: 0, restSeconds: 60 }] }
        : d
    ));
  };

  const updateExercise = (dayIdx: number, exIdx: number, field: string, value: string | number) => {
    setDays((prev) => prev.map((d) =>
      d.dayOfWeek === dayIdx
        ? { ...d, exercises: d.exercises.map((ex, i) => i === exIdx ? { ...ex, [field]: value } : ex) }
        : d
    ));
  };

  const selectExercise = (dayIdx: number, exIdx: number, exerciseId: string) => {
    const ex = exercises.find((e) => e.id === exerciseId);
    if (!ex) return;
    updateExercise(dayIdx, exIdx, 'exerciseId', exerciseId);
    updateExercise(dayIdx, exIdx, 'exerciseName', ex.name);
  };

  const removeExercise = (dayIdx: number, exIdx: number) => {
    setDays((prev) => prev.map((d) =>
      d.dayOfWeek === dayIdx ? { ...d, exercises: d.exercises.filter((_, i) => i !== exIdx) } : d
    ));
  };

  const openCreateDialog = () => {
    setEditingRoutine(null);
    setRoutineName('');
    setRoutineDesc('');
    setDays([]);
    setDialogOpen(true);
  };

  const openEditDialog = (r: Routine) => {
    setEditingRoutine(r);
    setRoutineName(r.name);
    setRoutineDesc(r.description || '');
    setDays(r.days.map((d) => ({
      dayOfWeek: d.dayOfWeek,
      exercises: d.exercises.map((ex) => ({
        exerciseId: (ex as unknown as { exerciseId?: string }).exerciseId || '',
        exerciseName: ex.exercise?.name || ex.name || '',
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight || 0,
        restSeconds: ex.restSeconds || 60,
      })),
    })));
    setDialogOpen(true);
  };

  const handleDeleteRoutine = async () => {
    if (!deleteId || !selectedMember) return;
    try { await api.delete(`/api/v1/routines/${deleteId}`); invalidateCache('/api/v1/routines'); toast.success('Rutina eliminada'); fetchRoutines(selectedMember.id); }
    catch { toast.error('Error al eliminar'); }
    finally { setDeleteId(null); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineName.trim() || days.length === 0 || !selectedMember) return;
    setSubmitting(true);
    try {
      const payload = {
        name: routineName.trim(),
        description: routineDesc.trim() || undefined,
        memberId: selectedMember.id,
        days: days.map((d) => ({
          dayOfWeek: d.dayOfWeek,
          exercises: d.exercises.filter((ex) => ex.exerciseId).map((ex, idx) => ({
            exerciseId: ex.exerciseId,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight || undefined,
            restSeconds: ex.restSeconds || undefined,
            order: idx,
          })),
        })),
      };
      if (editingRoutine) {
        await api.patch(`/api/v1/routines/${editingRoutine.id}`, payload);
        toast.success('Rutina actualizada');
      } else {
        await api.post('/api/v1/routines', payload);
        toast.success('Rutina creada');
      }
      invalidateCache('/api/v1/routines');
      setDialogOpen(false);
      fetchRoutines(selectedMember.id);
    } catch { toast.error('Error al guardar'); }
    finally { setSubmitting(false); }
  };

  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase();
    return m.firstName.toLowerCase().includes(q) || m.lastName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  const groupedExercises = exercises.reduce((acc, ex) => {
    const group = ex.muscleGroup || 'Otro';
    if (!acc[group]) acc[group] = [];
    acc[group].push(ex);
    return acc;
  }, {} as Record<string, ExerciseDb[]>);

  // === Vista rutinas de un cliente ===
  if (selectedMember) {
    return (
      <div className="md:space-y-6">
        <div className="reveal-up">
          <Header eyebrow={`Cliente · ${selectedMember.firstName} ${selectedMember.lastName}`} title="Rutinas" description="Gestiona los programas de entrenamiento">
            <button onClick={handleBack} className="btn-ghost"><ArrowLeft className="h-4 w-4" /> Volver</button>
            <button onClick={openCreateDialog} className="btn-fire"><Plus className="h-4 w-4" strokeWidth={3} /> Crear rutina</button>
          </Header>
        </div>

        {/* MOBILE header con botón volver */}
        <div className="md:hidden px-5 pt-2 pb-4 reveal-up flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="label-athletic text-[var(--gym-orange)]">/ Rutinas de</p>
            <h1 className="font-display tracking-tight leading-[0.9] mt-2 text-foreground truncate" style={{ fontSize: 'clamp(24px, 7vw, 32px)' }}>
              {selectedMember.firstName.toUpperCase()} {selectedMember.lastName.toUpperCase()}
            </h1>
          </div>
          <button onClick={handleBack} className="press w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-secondary border border-border">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>

        {loadingRoutines ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : routines.length === 0 ? (
          <Card className="mx-4 md:mx-0 p-12 flex flex-col items-center gap-4">
            <ClipboardList className="h-10 w-10 text-muted-foreground" />
            <h2 className="text-lg font-bold text-foreground">Sin rutinas asignadas</h2>
            <Button onClick={openCreateDialog} className="gap-2"><Plus className="h-4 w-4" /> Crear Primera Rutina</Button>
          </Card>
        ) : (
          <motion.div className="px-4 md:px-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4" variants={staggerContainer} initial="initial" animate="animate">
            {routines.map((routine) => (
              <motion.div key={routine.id} variants={staggerItem}>
                <Card className="p-5 space-y-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-foreground">{routine.name}</h3>
                      {routine.description && <p className="text-sm text-muted-foreground mt-0.5">{routine.description}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEditDialog(routine)} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDeleteId(routine.id)} className="p-1.5 text-muted-foreground hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {routine.days.map((day) => (
                      <Badge key={day.dayOfWeek} variant="secondary" className="text-xs">{DAY_NAMES[day.dayOfWeek]}</Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {routine.days.reduce((t, d) => t + d.exercises.length, 0)} ejercicios · {routine.days.length} días
                  </p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Builder de rutina — visual, fácil de usar */}
        <RoutineBuilder
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          memberName={`${selectedMember.firstName} ${selectedMember.lastName}`}
          exercises={exercises as BuilderExDb[]}
          initialName={routineName}
          initialDescription={routineDesc}
          initialDays={days as BuilderDayData[]}
          isEditing={!!editingRoutine}
          onSubmit={async ({ name: nm, description: desc, days: ds }) => {
            if (!selectedMember) { toast.error('Selecciona un cliente primero'); throw new Error('no member'); }
            // Validación: al menos un día con ejercicios.
            const totalEx = ds.reduce((acc, d) => acc + d.exercises.filter((ex) => ex.exerciseId).length, 0);
            if (totalEx === 0) {
              toast.error('Agrega al menos un ejercicio a algún día');
              throw new Error('empty');
            }
            try {
              const payload = {
                name: nm,
                description: desc || undefined,
                memberId: selectedMember.id,
                days: ds.map((d) => ({
                  dayOfWeek: d.dayOfWeek,
                  exercises: d.exercises.filter((ex) => ex.exerciseId).map((ex, idx) => ({
                    exerciseId: ex.exerciseId,
                    sets: ex.sets,
                    reps: ex.reps,
                    weight: ex.weight || undefined,
                    restSeconds: ex.restSeconds || undefined,
                    order: idx,
                  })),
                })),
              };
              if (editingRoutine) {
                await api.patch(`/api/v1/routines/${editingRoutine.id}`, payload);
                toast.success('Rutina actualizada');
              } else {
                await api.post('/api/v1/routines', payload);
                toast.success('Rutina creada');
              }
              invalidateCache('/api/v1/routines');
              setDialogOpen(false);
              fetchRoutines(selectedMember.id);
            } catch (err: unknown) {
              const e = err as { response?: { data?: { message?: string | string[] } } };
              const msg = e.response?.data?.message;
              const text = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al guardar la rutina');
              toast.error(text);
              throw new Error('save fail');
            }
          }}
        />

        <ConfirmDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)} title="¿Eliminar esta rutina?" description="Se eliminarán todos los ejercicios asociados." onConfirm={handleDeleteRoutine} />
      </div>
    );
  }

  // === Vista listado de clientes ===
  return (
    <div className="md:space-y-6">
      <div className="reveal-up">
        <Header eyebrow="Entrenamiento" title="Rutinas" description="Selecciona un cliente para ver y gestionar sus programas" />
      </div>

      {/* MOBILE header */}
      <div className="md:hidden px-5 pt-2 pb-4 reveal-up">
        <p className="label-athletic text-[var(--gym-orange)]">/ Entrenamiento</p>
        <h1 className="font-display tracking-tight leading-[0.9] mt-2 text-foreground" style={{ fontSize: 'clamp(34px, 9vw, 44px)' }}>
          RUTINAS
        </h1>
      </div>

      <div className="px-4 md:px-0 mb-3 md:mb-0">
        <div className="relative md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar cliente..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
      </div>

      {loadingMembers && filteredMembers.length === 0 ? (
        <div className="h-[280px]" />
      ) : filteredMembers.length === 0 ? (
        <Card className="mx-4 md:mx-0 p-8 flex flex-col items-center gap-3">
          <Dumbbell className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{searchQuery ? 'Sin resultados' : 'No hay clientes'}</p>
        </Card>
      ) : (
        <motion.div className="px-4 md:px-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4" variants={staggerContainer} initial="initial" animate="animate">
          {filteredMembers.map((member) => (
            <motion.div key={member.id} variants={staggerItem}>
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{member.firstName} {member.lastName}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="secondary" className="text-[10px]">{member.membershipType}</Badge>
                      <span className={`w-1.5 h-1.5 rounded-full ${member.isActive ? 'bg-emerald-400' : 'bg-zinc-300'}`} />
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleSelectMember(member)} className="gap-1.5 shrink-0">
                    <ClipboardList className="h-3.5 w-3.5" /> Rutinas
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
