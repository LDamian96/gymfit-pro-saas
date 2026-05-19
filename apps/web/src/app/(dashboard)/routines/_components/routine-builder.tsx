'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Search, Plus, Minus, Trash2, X, Dumbbell, ChevronDown, Library, Calendar, Loader2, Check } from 'lucide-react';

export interface ExerciseDb {
  id: string;
  name: string;
  muscleGroup: string | null;
  equipment: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
}

export interface ExerciseFormItem {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  weight: number;
  restSeconds: number;
  imageUrl?: string | null;
  muscleGroup?: string | null;
}

export interface DayFormData {
  dayOfWeek: number;
  exercises: ExerciseFormItem[];
}

const DAYS_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAYS_SHORT = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

const PRESETS: { label: string; sets: number; reps: number; rest: number }[] = [
  { label: 'Fuerza', sets: 5, reps: 5, rest: 120 },
  { label: 'Hipertrofia', sets: 4, reps: 10, rest: 60 },
  { label: 'Resistencia', sets: 3, reps: 15, rest: 45 },
  { label: 'Ligero', sets: 3, reps: 12, rest: 60 },
];

interface Props {
  open: boolean;
  onClose: () => void;
  memberName: string;
  exercises: ExerciseDb[];
  initialName?: string;
  initialDescription?: string;
  initialDays?: DayFormData[];
  isEditing: boolean;
  onSubmit: (payload: { name: string; description: string; days: DayFormData[] }) => Promise<void>;
}

export function RoutineBuilder(props: Props) {
  const { open, onClose, memberName, exercises, initialName = '', initialDescription = '', initialDays = [], isEditing, onSubmit } = props;

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [days, setDays] = useState<DayFormData[]>(initialDays);
  const [activeDayIdx, setActiveDayIdx] = useState<number | null>(initialDays[0]?.dayOfWeek ?? null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Re-sync cuando se abre el dialog (sin esto el state interno se queda con datos viejos
  // del último uso → user agrega ejercicios, cierra, abre create → state retiene los anteriores).
  useEffect(() => {
    if (open) {
      setName(initialName);
      setDescription(initialDescription);
      setDays(initialDays);
      setActiveDayIdx(initialDays[0]?.dayOfWeek ?? null);
      setShowLibrary(false);
      setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Reset al abrir/cerrar
  const reset = () => {
    setName(initialName);
    setDescription(initialDescription);
    setDays(initialDays);
    setActiveDayIdx(initialDays[0]?.dayOfWeek ?? null);
    setShowLibrary(false);
  };

  if (!open) return null;

  const toggleDay = (dayIdx: number) => {
    const exists = days.find((d) => d.dayOfWeek === dayIdx);
    if (exists) {
      setDays(days.filter((d) => d.dayOfWeek !== dayIdx));
      if (activeDayIdx === dayIdx) {
        const remaining = days.filter((d) => d.dayOfWeek !== dayIdx);
        setActiveDayIdx(remaining[0]?.dayOfWeek ?? null);
      }
    } else {
      const next = [...days, { dayOfWeek: dayIdx, exercises: [] }].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
      setDays(next);
      setActiveDayIdx(dayIdx);
    }
  };

  const addExerciseToActiveDay = (ex: ExerciseDb) => {
    if (activeDayIdx == null) return;
    setDays((prev) => prev.map((d) => d.dayOfWeek === activeDayIdx ? {
      ...d,
      exercises: [...d.exercises, {
        exerciseId: ex.id,
        exerciseName: ex.name,
        sets: 4,
        reps: 10,
        weight: 0,
        restSeconds: 60,
        imageUrl: ex.imageUrl,
        muscleGroup: ex.muscleGroup,
      }],
    } : d));
  };

  const updateExercise = (dayIdx: number, exIdx: number, field: keyof ExerciseFormItem, value: number) => {
    setDays((prev) => prev.map((d) =>
      d.dayOfWeek === dayIdx
        ? { ...d, exercises: d.exercises.map((ex, i) => i === exIdx ? { ...ex, [field]: value } : ex) }
        : d
    ));
  };

  const removeExercise = (dayIdx: number, exIdx: number) => {
    setDays((prev) => prev.map((d) =>
      d.dayOfWeek === dayIdx ? { ...d, exercises: d.exercises.filter((_, i) => i !== exIdx) } : d
    ));
  };

  const applyPreset = (dayIdx: number, exIdx: number, preset: typeof PRESETS[number]) => {
    setDays((prev) => prev.map((d) =>
      d.dayOfWeek === dayIdx
        ? { ...d, exercises: d.exercises.map((ex, i) => i === exIdx ? { ...ex, sets: preset.sets, reps: preset.reps, restSeconds: preset.rest } : ex) }
        : d
    ));
  };

  const activeDay = days.find((d) => d.dayOfWeek === activeDayIdx) || null;
  const totalExercises = days.reduce((acc, d) => acc + d.exercises.length, 0);

  const handleSubmit = async () => {
    if (!name.trim() || days.length === 0) return;
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim(), days });
      reset();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center native-overlay" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="native-sheet md:anim-pop w-full md:max-w-[860px] md:rounded-3xl rounded-t-[28px] bg-card flex flex-col"
        style={{ maxHeight: '94vh', height: '94vh', boxShadow: '0 -16px 48px -8px rgba(0,0,0,0.30)' }}>

        {/* Drag handle mobile */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="drag-handle" />
        </div>

        {/* Header */}
        <div className="px-5 md:px-6 pt-4 pb-4 border-b border-border flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {isEditing ? 'Editando rutina · ' : 'Nueva rutina para · '}{memberName}
            </p>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Nombre de la rutina (ej: Hipertrofia full body)"
              autoFocus
              className="w-full text-[20px] md:text-[24px] font-black tracking-tight leading-tight bg-transparent outline-none mt-1 placeholder:opacity-40" />
          </div>
          <button onClick={onClose} className="press w-9 h-9 rounded-xl flex items-center justify-center bg-secondary shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body — desktop: 2 columnas (días+ejercicios | biblioteca). Mobile: tabs + sheet biblioteca */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">

          {/* Columna izquierda — días + ejercicios del día */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

            {/* Selector de días — botones grandes */}
            <div className="px-5 md:px-6 py-3 border-b border-border">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Días de entrenamiento
              </p>
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS_SHORT.map((short, idx) => {
                  const day = days.find((d) => d.dayOfWeek === idx);
                  const isActive = activeDayIdx === idx;
                  const isSelected = !!day;
                  return (
                    <button key={idx} type="button"
                      onClick={() => isSelected ? setActiveDayIdx(idx) : toggleDay(idx)}
                      className="press relative h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all"
                      style={{
                        background: isActive ? 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)' : (isSelected ? 'rgba(255,90,31,0.12)' : 'hsl(var(--secondary))'),
                        color: isActive ? '#FFF' : (isSelected ? '#FF5A1F' : 'hsl(var(--muted-foreground))'),
                        boxShadow: isActive ? '0 6px 14px -4px rgba(255,90,31,0.45)' : 'none',
                      }}>
                      <span className="text-[10px] font-black tracking-[0.05em] leading-none">{short}</span>
                      {isSelected && (
                        <span className="text-[12px] font-black leading-none mt-1 tabular-nums">
                          {day!.exercises.length || '·'}
                        </span>
                      )}
                      {isSelected && (
                        <button type="button"
                          onClick={(e) => { e.stopPropagation(); toggleDay(idx); }}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)', color: '#fff' }}>
                          <X className="h-2.5 w-2.5" strokeWidth={3} />
                        </button>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lista de ejercicios del día activo */}
            <div className="flex-1 overflow-y-auto px-5 md:px-6 py-4">
              {activeDay == null && days.length === 0 ? (
                <EmptyDays />
              ) : activeDay && activeDay.exercises.length === 0 ? (
                <EmptyDay
                  dayName={DAYS_FULL[activeDay.dayOfWeek]}
                  onOpenLibrary={() => setShowLibrary(true)}
                />
              ) : activeDay ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[12px] font-black uppercase tracking-[0.12em]">
                      {DAYS_FULL[activeDay.dayOfWeek]} · <span style={{ color: 'hsl(var(--muted-foreground))' }}>{activeDay.exercises.length} ejercicios</span>
                    </p>
                    <button type="button" onClick={() => setShowLibrary(true)}
                      className="press inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider"
                      style={{ background: 'rgba(255,90,31,0.12)', color: '#FF5A1F' }}>
                      <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                      Agregar
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {activeDay.exercises.map((ex, exIdx) => (
                      <ExerciseRow
                        key={exIdx}
                        exercise={ex}
                        index={exIdx}
                        onUpdate={(field, value) => updateExercise(activeDay.dayOfWeek, exIdx, field, value)}
                        onRemove={() => removeExercise(activeDay.dayOfWeek, exIdx)}
                        onPreset={(preset) => applyPreset(activeDay.dayOfWeek, exIdx, preset)}
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* Columna derecha — biblioteca (desktop) */}
          <div className="hidden md:flex flex-col w-[320px] border-l border-border bg-secondary/40">
            <ExerciseLibrary
              exercises={exercises}
              onAdd={addExerciseToActiveDay}
              disabled={activeDayIdx == null}
            />
          </div>

          {/* Biblioteca como sheet en mobile */}
          {showLibrary && (
            <div className="md:hidden fixed inset-0 z-[110]" onClick={() => setShowLibrary(false)}>
              <div className="absolute inset-0 native-overlay" style={{ background: 'rgba(0,0,0,0.55)' }} />
              <div onClick={(e) => e.stopPropagation()}
                className="native-sheet absolute bottom-0 left-0 right-0 rounded-t-[28px] bg-card flex flex-col"
                style={{ maxHeight: '85vh', boxShadow: '0 -16px 48px -8px rgba(0,0,0,0.30)' }}>
                <div className="flex justify-center pt-3 pb-1"><div className="drag-handle" /></div>
                <ExerciseLibrary
                  exercises={exercises}
                  onAdd={(ex) => { addExerciseToActiveDay(ex); }}
                  disabled={activeDayIdx == null}
                  onClose={() => setShowLibrary(false)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 md:px-6 py-4 border-t border-border flex items-center gap-3" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Resumen
            </p>
            <p className="text-[14px] font-black truncate">
              {days.length} {days.length === 1 ? 'día' : 'días'} · {totalExercises} ejercicios
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="press hidden md:inline-flex px-5 py-3 rounded-xl text-[12px] font-black uppercase tracking-wider bg-secondary">
            Cancelar
          </button>
          <button type="button" onClick={handleSubmit}
            disabled={!name.trim() || days.length === 0 || submitting}
            className="press inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-[12px] font-black uppercase tracking-[0.12em] disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)',
              boxShadow: '0 8px 18px -4px rgba(255,90,31,0.50)',
            }}>
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</> : <><Check className="h-4 w-4" strokeWidth={3} /> {isEditing ? 'Guardar cambios' : 'Crear rutina'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== Empty states =====
function EmptyDays() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6 py-10">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 anim-float" style={{ background: 'rgba(255,90,31,0.12)' }}>
        <Calendar className="h-8 w-8" style={{ color: '#FF5A1F' }} strokeWidth={2.5} />
      </div>
      <p className="text-[15px] font-black tracking-tight">Empecemos por los días</p>
      <p className="text-[12px] mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
        Toca arriba los días que entrenará tu cliente
      </p>
    </div>
  );
}

function EmptyDay({ dayName, onOpenLibrary }: { dayName: string; onOpenLibrary: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6 py-10">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,90,31,0.12)' }}>
        <Dumbbell className="h-8 w-8" style={{ color: '#FF5A1F' }} strokeWidth={2.5} />
      </div>
      <p className="text-[15px] font-black tracking-tight">{dayName}: sin ejercicios</p>
      <p className="text-[12px] mt-1 mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
        Elige ejercicios desde la biblioteca
      </p>
      <button type="button" onClick={onOpenLibrary}
        className="press md:hidden inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white text-[12px] font-black uppercase tracking-wider"
        style={{ background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)' }}>
        <Library className="h-4 w-4" strokeWidth={2.5} />
        Abrir biblioteca
      </button>
    </div>
  );
}

// ===== Fila de ejercicio del día =====
function ExerciseRow({
  exercise, index, onUpdate, onRemove, onPreset,
}: {
  exercise: ExerciseFormItem;
  index: number;
  onUpdate: (field: keyof ExerciseFormItem, value: number) => void;
  onRemove: () => void;
  onPreset: (preset: typeof PRESETS[number]) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        {/* Número */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-[13px] font-black"
          style={{ background: 'linear-gradient(135deg, #0A0A0B 0%, #2A2A2E 100%)', color: '#FF5A1F' }}>
          {String(index + 1).padStart(2, '0')}
        </div>

        {/* Imagen */}
        {exercise.imageUrl ? (
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
            <Image src={exercise.imageUrl} alt="" fill className="object-cover" sizes="48px" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'hsl(var(--secondary))' }}>
            <Dumbbell className="h-5 w-5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </div>
        )}

        {/* Nombre + pills */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-black truncate leading-tight">{exercise.exerciseName}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="routine-pill">{exercise.sets}<span style={{ opacity: .6 }}>×</span>{exercise.reps}</span>
            {exercise.weight > 0 && <span className="routine-pill muted">{exercise.weight}kg</span>}
            <span className="routine-pill muted">{exercise.restSeconds}s</span>
          </div>
        </div>

        <button type="button" onClick={() => setExpanded(!expanded)}
          className="press w-9 h-9 rounded-xl flex items-center justify-center bg-secondary">
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
        <button type="button" onClick={onRemove}
          className="press w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.10)', color: '#EF4444' }}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-border space-y-3">
          {/* Presets */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.12em] mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Plantillas rápidas
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {PRESETS.map((p) => (
                <button key={p.label} type="button" onClick={() => onPreset(p)}
                  className="press py-2 rounded-lg text-[10px] font-black uppercase tracking-wider bg-secondary hover:bg-primary/10 transition-colors">
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Steppers */}
          <div className="grid grid-cols-2 gap-2">
            <Stepper label="Series" value={exercise.sets} min={1} max={15}
              onChange={(v) => onUpdate('sets', v)} />
            <Stepper label="Repeticiones" value={exercise.reps} min={1} max={50}
              onChange={(v) => onUpdate('reps', v)} />
            <Stepper label="Peso (kg)" value={exercise.weight} min={0} max={300} step={2.5}
              onChange={(v) => onUpdate('weight', v)} />
            <Stepper label="Descanso (seg)" value={exercise.restSeconds} min={0} max={300} step={15}
              onChange={(v) => onUpdate('restSeconds', v)} />
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Stepper +/- visual =====
function Stepper({ label, value, min = 0, max = 99, step = 1, onChange }: {
  label: string; value: number; min?: number; max?: number; step?: number; onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-xl bg-secondary p-2">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
        {label}
      </p>
      <div className="flex items-center justify-between gap-1 mt-1">
        <button type="button" onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          className="press w-7 h-7 rounded-lg flex items-center justify-center bg-card disabled:opacity-30">
          <Minus className="h-3 w-3" strokeWidth={3} />
        </button>
        <span className="flex-1 text-center text-[14px] font-black tabular-nums">
          {value}
        </span>
        <button type="button" onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
          className="press w-7 h-7 rounded-lg flex items-center justify-center bg-card disabled:opacity-30">
          <Plus className="h-3 w-3" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

// ===== Biblioteca de ejercicios =====
function ExerciseLibrary({ exercises, onAdd, disabled, onClose }: {
  exercises: ExerciseDb[];
  onAdd: (ex: ExerciseDb) => void;
  disabled?: boolean;
  onClose?: () => void;
}) {
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);

  const muscleGroups = useMemo(() => {
    const set = new Set<string>();
    exercises.forEach((ex) => { if (ex.muscleGroup) set.add(ex.muscleGroup); });
    return Array.from(set).sort();
  }, [exercises]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exercises.filter((ex) => {
      if (muscleFilter && ex.muscleGroup !== muscleFilter) return false;
      if (q && !ex.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [exercises, search, muscleFilter]);

  return (
    <>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Library className="h-4 w-4" style={{ color: '#FF5A1F' }} />
          <p className="text-[13px] font-black tracking-tight">Biblioteca · {filtered.length}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="press w-8 h-8 rounded-lg flex items-center justify-center bg-secondary">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Búsqueda */}
      <div className="px-4 py-3 space-y-2 border-b border-border">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-card border border-border">
          <Search className="h-3.5 w-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ejercicio…"
            className="flex-1 text-[13px] bg-transparent outline-none" />
          {search && (
            <button onClick={() => setSearch('')} className="press w-5 h-5 rounded-full flex items-center justify-center bg-secondary">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Filtros músculo */}
        <div className="snap-row">
          <button onClick={() => setMuscleFilter(null)} className="filter-chip" data-active={muscleFilter === null}
            style={{ height: 28, fontSize: 10 }}>
            Todos
          </button>
          {muscleGroups.map((g) => (
            <button key={g} onClick={() => setMuscleFilter(g)} className="filter-chip" data-active={muscleFilter === g}
              style={{ height: 28, fontSize: 10 }}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {disabled && (
        <div className="px-4 py-3 text-[11px] text-center" style={{ color: '#CA8A04', background: 'rgba(202,138,4,0.10)' }}>
          Selecciona un día arriba antes de agregar ejercicios
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {filtered.length === 0 ? (
          <p className="text-center text-[12px] py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Sin ejercicios. Crea uno desde Ejercicios.
          </p>
        ) : (
          filtered.map((ex) => (
            <button key={ex.id} type="button"
              onClick={() => !disabled && onAdd(ex)}
              disabled={disabled}
              className="press w-full flex items-center gap-3 p-2 rounded-xl bg-card border border-border hover:border-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {ex.imageUrl ? (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                  <Image src={ex.imageUrl} alt="" fill className="object-cover" sizes="48px" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-secondary">
                  <Dumbbell className="h-5 w-5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[12px] font-black truncate leading-tight">{ex.name}</p>
                <p className="text-[10px] font-bold mt-0.5 truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {[ex.muscleGroup, ex.equipment].filter(Boolean).join(' · ') || 'Sin grupo'}
                </p>
              </div>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,90,31,0.12)', color: '#FF5A1F' }}>
                <Plus className="h-3.5 w-3.5" strokeWidth={3} />
              </div>
            </button>
          ))
        )}
      </div>
    </>
  );
}
