'use client';

import { useEffect, useState, useCallback } from 'react';
import { Dumbbell, Play, ArrowLeft, Flame, Zap, X } from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { useAuthStore } from '@/stores/auth-store';
import { cachedGet, unwrap, invalidateCache } from '@/lib/api';
import { useFocusRevalidate } from '@/hooks/use-focus-revalidate';
import Image from 'next/image';

interface ExerciseDetail {
  id: string; name: string; muscleGroup: string | null; equipment: string | null;
  imageUrl: string | null; videoUrl: string | null;
}
interface RoutineExercise {
  sets: number; reps: number; weight: number | null; restSeconds: number | null;
  trainerNotes: string | null; exercise: ExerciseDetail;
}
interface RoutineDay { dayOfWeek: number; exercises: RoutineExercise[]; }
interface Routine { id: string; name: string; description: string | null; days: RoutineDay[]; }

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAYS_S = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
const FONT = "'Plus Jakarta Sans', Inter, sans-serif";

function getMuscleLabel(day: RoutineDay | undefined): string {
  if (!day || day.exercises.length === 0) return 'Descanso';
  const groups = day.exercises.map(e => e.exercise?.muscleGroup).filter(Boolean) as string[];
  if (groups.length === 0) return 'Entreno';
  const counts: Record<string, number> = {};
  groups.forEach(g => { counts[g] = (counts[g] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([g]) => g)[0];
}

export default function MyRoutinesPage() {
  const { user } = useAuthStore();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<RoutineDay | null>(null);
  const [activeVideo, setActiveVideo] = useState<{ url: string; name: string } | null>(null);
  // Índice del ejercicio cuyo video está expandido inline (mobile). Toggle suave.
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const fetchRoutine = useCallback(async (force = false) => {
    if (!user?.memberId) return;
    try {
      // TTL 10s — si el admin asigna una rutina, el cliente la ve casi inmediato sin recargar.
      // Force=true al volver a la pestaña / refresh manual.
      if (force) invalidateCache('/api/v1/routines');
      const res = await cachedGet<unknown>('/api/v1/routines', { params: { memberId: user.memberId }, ttl: 10_000 });
      const data = unwrap<Routine[]>(res);
      const arr = Array.isArray(data) ? data : [];
      setRoutine(arr.length > 0 ? arr[0] : null);
    } catch { setRoutine(null); }
    finally { setLoading(false); }
  }, [user?.memberId]);

  useEffect(() => { fetchRoutine(); }, [fetchRoutine]);
  // Revalidar al volver a la pestaña: si el admin asignó una rutina mientras el cliente
  // tenía la pantalla abierta, al focus se actualiza sin reload.
  useFocusRevalidate(() => fetchRoutine(true));

  const nowDay = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  // Construir SIEMPRE los 7 días (Lun-Dom). Los días sin rutina van como descanso.
  const allDays: RoutineDay[] = Array.from({ length: 7 }, (_, i) => {
    const existing = routine?.days.find(d => d.dayOfWeek === i);
    return existing ?? { dayOfWeek: i, exercises: [] };
  });
  const todayRoutine = allDays[nowDay];
  // Auto-seleccionar HOY al cargar, si no hay nada seleccionado.
  useEffect(() => {
    if (!routine) return;
    setSelectedDay(prev => prev ?? todayRoutine);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routine]);
  const displayDay = selectedDay ?? todayRoutine;
  const isViewingToday = displayDay?.dayOfWeek === nowDay;

  return (
    <>
      {/* ===== MOBILE ===== */}
      <div className="md:hidden pb-6" style={{ fontFamily: FONT }}>
        {loading ? (
          <div className="px-5 pt-16 space-y-4">
            <div className="h-12 w-2/3 rounded-xl skeleton-shimmer" />
            <div className="h-56 rounded-[28px] skeleton-shimmer" />
            <div className="flex gap-2 overflow-hidden">
              {[...Array(7)].map((_, i) => <div key={i} className="h-[72px] w-14 rounded-2xl skeleton-shimmer shrink-0" />)}
            </div>
            {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl skeleton-shimmer" />)}
          </div>
        ) : !routine ? (
          <div className="px-5 pt-20 anim-pop">
            <div className="rounded-[28px] p-10 text-center" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center anim-float" style={{ background: 'rgba(255,90,31,0.12)' }}>
                <Dumbbell className="h-8 w-8" style={{ color: '#FF5A1F' }} />
              </div>
              <h3 className="text-[18px] font-black tracking-tight">Sin rutina asignada</h3>
              <p className="text-[12px] font-medium mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Tu entrenador te asignará una pronto</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header premium */}
            <div className="px-5 pt-3 pb-3 anim-fade flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Mi rutina
                </p>
                <h1 className="text-[28px] font-black tracking-tight mt-1 leading-none truncate" style={{ color: 'hsl(var(--foreground))' }}>
                  {isViewingToday ? 'HOY' : DAYS[selectedDay!.dayOfWeek].toUpperCase()}
                </h1>
                <p className="text-[11px] font-bold mt-1.5 truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {routine.name}
                </p>
              </div>
              {selectedDay && selectedDay !== todayRoutine && (
                <button onClick={() => setSelectedDay(null)}
                  className="press w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}
                  aria-label="Volver a hoy">
                  <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
                </button>
              )}
            </div>

            {/* Day chips horizontales — SIEMPRE los 7 días con el grupo muscular */}
            <div className="snap-row anim-slide-up px-4 pb-3" style={{ animationDelay: '40ms' }}>
              {allDays.map((day) => {
                const isActive = displayDay?.dayOfWeek === day.dayOfWeek;
                const isRest = day.exercises.length === 0;
                const isToday = day.dayOfWeek === nowDay;
                // Etiqueta corta del grupo muscular (4 chars). Descanso = "OFF".
                const muscle = isRest ? 'OFF' : getMuscleLabel(day).toUpperCase().slice(0, 4);
                return (
                  <button key={day.dayOfWeek}
                    onClick={() => setSelectedDay(day)}
                    className="routine-daychip"
                    data-active={isActive}
                    data-rest={isRest}
                    data-today={isToday}
                    aria-label={DAYS[day.dayOfWeek]}>
                    <span className="routine-daychip-d">{DAYS_S[day.dayOfWeek]}</span>
                    <span className="routine-daychip-muscle">{muscle}</span>
                  </button>
                );
              })}
            </div>

            {/* Hero premium — gradiente con orb y stats glass */}
            {displayDay && (
              <div className="px-4 mt-1 anim-slide-up" style={{ animationDelay: '80ms' }}>
                <div className="routine-hero rounded-[28px] p-6" style={{
                  background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 60%, #B23E11 100%)',
                  boxShadow: '0 24px 48px -12px rgba(255,90,31,0.45), 0 8px 24px rgba(0,0,0,0.18)',
                }}>
                  <div className="absolute inset-0 routine-shine pointer-events-none" />

                  <div className="relative flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(8px)' }}>
                        <Flame className="h-3 w-3 text-white" fill="#FFB347" />
                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white">
                          {isViewingToday ? `Hoy · ${DAYS[displayDay.dayOfWeek]}` : DAYS[displayDay.dayOfWeek]}
                        </span>
                      </div>
                      <h2 className="font-black leading-[0.92] text-white tracking-tight mt-3" style={{ fontSize: 'clamp(34px, 11vw, 48px)' }}>
                        {getMuscleLabel(displayDay).toUpperCase()}
                      </h2>
                    </div>

                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 anim-float" style={{
                      background: 'rgba(255,255,255,0.16)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.25)',
                    }}>
                      <Dumbbell className="h-8 w-8 text-white" strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* Stats glass tiles */}
                  {displayDay.exercises.length > 0 && (
                    <div className="relative mt-5 flex items-stretch gap-2">
                      <div className="routine-stat">
                        <p className="routine-stat-num">{displayDay.exercises.length}</p>
                        <p className="routine-stat-label">Ejercicios</p>
                      </div>
                      <div className="routine-stat">
                        <p className="routine-stat-num">{displayDay.exercises.reduce((a, e) => a + e.sets, 0)}</p>
                        <p className="routine-stat-label">Series</p>
                      </div>
                      <div className="routine-stat">
                        <p className="routine-stat-num">~{Math.max(20, displayDay.exercises.length * 6)}</p>
                        <p className="routine-stat-label">Min</p>
                      </div>
                    </div>
                  )}

                  {displayDay.exercises.length === 0 && (
                    <div className="relative mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(8px)' }}>
                      <span className="text-[11px] font-black uppercase tracking-wider text-white">Día de descanso · recupera tu cuerpo</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Exercise list */}
            {displayDay && displayDay.exercises.length > 0 && (
              <div className="px-4 mt-5 anim-slide-up" style={{ animationDelay: '140ms' }}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <p className="text-[13px] font-black tracking-tight">Tu sesión</p>
                  <span className="text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {displayDay.exercises.length} ejercicios
                  </span>
                </div>
                <div className="space-y-2.5 anim-stagger">
                  {displayDay.exercises.map((ex, i) => {
                    const isExpanded = expandedIdx === i;
                    const hasVideo = !!ex.exercise?.videoUrl;
                    return (
                      <div key={i} className="routine-card-wrap">
                        <div className="routine-card">
                          <span className="routine-num">{String(i + 1).padStart(2, '0')}</span>

                          {ex.exercise?.imageUrl ? (
                            <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0" style={{ border: '1px solid hsl(var(--border))' }}>
                              <Image src={ex.exercise.imageUrl} alt="" fill className="object-cover" sizes="56px" />
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'hsl(var(--secondary))' }}>
                              <Dumbbell className="h-5 w-5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-black truncate leading-tight" style={{ color: 'hsl(var(--foreground))' }}>{ex.exercise?.name}</p>
                            {ex.exercise?.muscleGroup && (
                              <p className="text-[10px] font-bold mt-0.5 truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                {ex.exercise.muscleGroup}{ex.exercise.equipment ? ` · ${ex.exercise.equipment}` : ''}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              <span className="routine-pill">{ex.sets}<span style={{ opacity: .6 }}>×</span>{ex.reps}</span>
                              {ex.weight != null && ex.weight > 0 && (
                                <span className="routine-pill muted">{ex.weight}<span style={{ opacity: .6 }}>kg</span></span>
                              )}
                              {ex.restSeconds != null && ex.restSeconds > 0 && (
                                <span className="routine-pill muted">{ex.restSeconds}<span style={{ opacity: .6 }}>s</span></span>
                              )}
                            </div>
                          </div>

                          {hasVideo && (
                            <button
                              type="button"
                              onClick={() => setExpandedIdx(isExpanded ? null : i)}
                              className="routine-play"
                              aria-expanded={isExpanded}
                              aria-label={isExpanded ? `Ocultar video de ${ex.exercise!.name}` : `Ver video de ${ex.exercise!.name}`}
                            >
                              <Play className="h-4 w-4" fill="white" />
                            </button>
                          )}
                        </div>

                        {/* Video desplegable inline — solo aparece si hay video */}
                        {hasVideo && (
                          <div className={`routine-video-collapse ${isExpanded ? 'open' : ''}`}>
                            <div className="routine-video-inner">
                              {isExpanded && (
                                <video src={ex.exercise!.videoUrl!} controls playsInline preload="metadata" />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* CTA empezar sesión */}
                <button className="mt-5 w-full press ripple py-4 rounded-2xl text-[13px] font-black uppercase tracking-[0.15em] text-white flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #0A0A0B 0%, #2A2A2E 100%)',
                    boxShadow: '0 8px 24px rgba(10,10,11,0.25)',
                  }}>
                  <Zap className="h-4 w-4" fill="#FF5A1F" stroke="#FF5A1F" />
                  Empezar entrenamiento
                </button>
              </div>
            )}

            {displayDay && displayDay.exercises.length === 0 && (
              <div className="px-4 mt-4 anim-slide-up">
                <div className="rounded-2xl p-10 text-center" style={{ background: 'hsl(var(--card))', border: '1px dashed hsl(var(--border))' }}>
                  <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center anim-float" style={{ background: 'rgba(115,115,115,0.12)' }}>
                    <Dumbbell className="h-6 w-6" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  </div>
                  <p className="text-[14px] font-black tracking-tight">Día de descanso</p>
                  <p className="text-[11px] font-bold mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Tu cuerpo se reconstruye al descansar</p>
                </div>
              </div>
            )}

            <div className="h-4" />
          </>
        )}
      </div>

      {/* ===== DESKTOP ===== */}
      <div className="hidden md:block space-y-6">
        <div className="flex items-end justify-between reveal-up">
          <div>
            <p className="label-athletic text-[var(--gym-orange)] mb-2">/ {routine?.name || 'Tu programa'}</p>
            <h1 className="font-display tracking-tight leading-[0.92] text-foreground" style={{ fontSize: 'clamp(36px, 4.5vw, 56px)' }}>
              MI RUTINA
            </h1>
            {routine?.description && <p className="text-[14px] text-muted-foreground mt-2 max-w-xl">{routine.description}</p>}
          </div>
        </div>

        {!routine ? (
          <div className="rounded-3xl p-16 text-center bg-card border border-border">
            <div className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: '#FFEDD5' }}>
              <Dumbbell className="h-10 w-10" style={{ color: '#FF5A1F' }} />
            </div>
            <h3 className="text-[22px] font-black tracking-tight">Sin rutina asignada</h3>
            <p className="text-sm mt-2 text-muted-foreground">Tu entrenador te asignará una rutina personalizada pronto</p>
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_380px] gap-5">
            {/* Lista de días */}
            <div className="space-y-4">
              {/* Hero hoy */}
              {todayRoutine && (
                <div className="relative overflow-hidden rounded-3xl p-8" style={{ background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)', border: '1px solid #27272A' }}>
                  <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl" style={{ background: 'rgba(255,90,31,0.3)' }} />
                  <div className="relative flex items-center gap-6">
                    <div className="flex-1">
                      <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: 'rgba(255,90,31,0.15)' }}>
                        <Flame className="h-4 w-4" style={{ color: '#FF5A1F' }} fill="#FF5A1F" />
                        <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: '#FF5A1F' }}>Entrena hoy · {DAYS[nowDay]}</span>
                      </div>
                      <h2 className="text-[64px] font-black leading-[0.9] text-white tracking-tight mt-3">
                        {getMuscleLabel(todayRoutine).toUpperCase()}
                      </h2>
                      <p className="text-[13px] font-bold mt-3" style={{ color: '#A1A1AA' }}>
                        {todayRoutine.exercises.length} ejercicios · {todayRoutine.exercises.reduce((a, e) => a + e.sets, 0)} series · ~45 min
                      </p>
                    </div>
                    <div className="w-24 h-24 rounded-3xl flex items-center justify-center shrink-0" style={{ background: '#FF5A1F' }}>
                      <Dumbbell className="h-12 w-12 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              )}

              {/* Lista ejercicios del día */}
              {todayRoutine && todayRoutine.exercises.length > 0 && (
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.15em] mb-3 text-muted-foreground">Ejercicios de hoy</p>
                  <div className="grid grid-cols-2 gap-3">
                    {todayRoutine.exercises.map((ex, i) => (
                      <div key={i} className="bg-card rounded-2xl p-4 flex items-center gap-3 border border-border">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)' }}>
                          <span className="text-[13px] font-black text-white">{String(i + 1).padStart(2, '0')}</span>
                        </div>
                        {ex.exercise?.imageUrl ? (
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
                            <Image src={ex.exercise.imageUrl} alt="" fill className="object-cover" sizes="48px" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-secondary">
                            <Dumbbell className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-black truncate">{ex.exercise?.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded" style={{ background: 'rgba(255,90,31,0.15)', color: '#FF5A1F' }}>
                              {ex.sets}×{ex.reps}
                            </span>
                            {ex.weight && <span className="text-[10px] font-black px-2 py-0.5 rounded bg-secondary">{ex.weight}kg</span>}
                          </div>
                        </div>
                        {ex.exercise?.videoUrl && (
                          <button
                            onClick={() => setActiveVideo({ url: ex.exercise!.videoUrl!, name: ex.exercise!.name })}
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 hover:scale-105 transition-transform"
                            style={{ background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)', boxShadow: '0 4px 12px rgba(255,90,31,0.35)' }}
                            aria-label={`Ver video de ${ex.exercise.name}`}
                          >
                            <Play className="h-3.5 w-3.5 text-white" fill="white" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!todayRoutine || todayRoutine.exercises.length === 0 && (
                <div className="bg-card rounded-2xl p-12 text-center border border-border">
                  <p className="text-[16px] font-black">Día de descanso</p>
                  <p className="text-sm mt-2 text-muted-foreground">Tu cuerpo necesita recuperarse</p>
                </div>
              )}
            </div>

            {/* Sidebar der — resto de días */}
            <div className="bg-card rounded-3xl border border-border overflow-hidden">
              <div className="px-6 py-5 border-b border-border">
                <h3 className="text-[15px] font-black tracking-tight">Semana completa</h3>
                <p className="text-[11px] font-bold mt-1 text-muted-foreground">Tu programa de entrenamientos</p>
              </div>
              <div className="divide-y divide-border">
                {routine.days.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map(day => {
                  const isRest = day.exercises.length === 0;
                  const isToday = day.dayOfWeek === nowDay;
                  return (
                    <div key={day.dayOfWeek} className="px-6 py-4 flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0"
                        style={isToday ? { background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)' } : { background: isRest ? 'hsl(var(--secondary))' : 'rgba(255,90,31,0.15)' }}>
                        <span className="text-[9px] font-black uppercase" style={{ color: isToday ? '#FFFFFF' : (isRest ? undefined : '#FF5A1F') }}>
                          {DAYS_S[day.dayOfWeek]}
                        </span>
                        <span className="text-[13px] font-black leading-none mt-0.5" style={{ color: isToday ? '#FFFFFF' : (isRest ? undefined : '#FF5A1F') }}>
                          {isRest ? '—' : day.exercises.length}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-black truncate" style={{ color: isRest ? 'hsl(var(--muted-foreground))' : undefined }}>
                            {isRest ? 'Descanso' : getMuscleLabel(day).toUpperCase()}
                          </p>
                          {isToday && <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase" style={{ background: '#FF5A1F', color: '#FFFFFF' }}>HOY</span>}
                        </div>
                        <p className="text-[10px] font-bold mt-0.5 text-muted-foreground">
                          {DAYS[day.dayOfWeek]}{!isRest && ` · ${day.exercises.reduce((a, e) => a + e.sets, 0)} series`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de video */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setActiveVideo(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/60">Demostración</p>
                <h3 className="text-[18px] md:text-[24px] font-black text-white tracking-tight leading-none mt-1">
                  {activeVideo.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.12)', color: '#FFFFFF' }}
                aria-label="Cerrar video"
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ background: '#000' }}>
              <video
                src={activeVideo.url}
                controls
                autoPlay
                playsInline
                className="w-full h-auto"
                style={{ maxHeight: '70vh' }}
              >
                Tu navegador no soporta video.
              </video>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
