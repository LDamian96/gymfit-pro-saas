'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { cachedGet, unwrap } from '@/lib/api';
import { Dumbbell, Zap } from 'lucide-react';

interface ExerciseDetail { muscleGroup: string | null; }
interface RoutineExercise { sets: number; reps: number; exercise: ExerciseDetail; }
interface RoutineDay { dayOfWeek: number; exercises: RoutineExercise[]; }
interface Routine { id: string; name: string; days: RoutineDay[]; }

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

export default function MySchedulePage() {
  const { user } = useAuthStore();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.memberId) return;
    try {
      const r = await cachedGet('/api/v1/routines', { params: { memberId: user.memberId }, ttl: 60_000 }).catch(() => null);
      if (r) { const rs = unwrap<Routine[]>(r); if (Array.isArray(rs) && rs.length > 0) setRoutine(rs[0]); }
    } catch {}
    finally { setLoading(false); }
  }, [user?.memberId]);

  useEffect(() => { load(); }, [load]);

  const nowDay = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  const weekDays = [0, 1, 2, 3, 4, 5, 6].map(idx => {
    const day = routine?.days.find(d => d.dayOfWeek === idx);
    return { idx, day, label: getMuscleLabel(day), isToday: idx === nowDay, isRest: !day || day.exercises.length === 0 };
  });

  return (
    <>
      {/* ===== MOBILE ===== */}
      <div className="md:hidden">
        <div className="px-5 pt-2 pb-4 reveal-up">
          <p className="label-athletic text-[var(--gym-orange)]">/ Programa semanal</p>
          <h1 className="font-display tracking-tight leading-[0.9] mt-2 text-foreground" style={{ fontSize: 'clamp(34px, 9vw, 44px)' }}>
            HORARIO
          </h1>
        </div>

        {loading ? (
          <div className="px-4 mt-4 space-y-3">{[...Array(7)].map((_, i) => <div key={i} className="h-20 rounded-2xl cm-skeleton" style={{ background: 'hsl(var(--secondary))' }} />)}</div>
        ) : (
          <>
            {/* Resumen cards */}
            <div className="px-4 mt-2 grid grid-cols-2 gap-3 cm-anim-slide">
              <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: '#FF5A1F' }}>
                  <Dumbbell className="h-5 w-5 text-white" strokeWidth={2.5} />
                </div>
                <p className="text-[26px] font-black text-white leading-none tracking-tight">{weekDays.filter(d => !d.isRest).length}</p>
                <p className="text-[10px] font-black uppercase tracking-wider mt-1" style={{ color: '#A3A3A3' }}>Días entreno</p>
              </div>
              <div className="cm-card rounded-2xl p-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: '#FFEDD5' }}>
                  <Zap className="h-5 w-5" style={{ color: '#FF5A1F' }} fill="#FF5A1F" />
                </div>
                <p className="text-[26px] font-black leading-none tracking-tight">
                  {routine?.days.reduce((acc, d) => acc + d.exercises.length, 0) || 0}
                </p>
                <p className="text-[10px] font-black uppercase tracking-wider mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Ejercicios total</p>
              </div>
            </div>

            {/* Week schedule */}
            <div className="px-4 mt-4 cm-anim-slide" style={{ animationDelay: '0.05s' }}>
              <p className="text-[14px] font-black tracking-tight mb-3 px-1">Semana completa</p>
              <div className="space-y-2">
                {weekDays.map((w) => {
                  if (w.isRest) {
                    return (
                      <div key={w.idx} className="rounded-2xl p-3.5 flex items-center gap-3" style={{ background: 'hsl(var(--secondary))' }}>
                        <div className="w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0" style={{ background: '#E5E5E5' }}>
                          <span className="text-[9px] font-black" style={{ color: '#A3A3A3' }}>{DAYS_S[w.idx]}</span>
                          <span className="text-[13px] font-black mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>—</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-[15px] font-black" style={{ color: 'hsl(var(--muted-foreground))' }}>Descanso</p>
                          <p className="text-[10px] font-bold" style={{ color: '#A3A3A3' }}>{DAYS[w.idx]}</p>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={w.idx} className="rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden"
                      style={{ background: w.isToday ? 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)' : 'hsl(var(--card))', border: w.isToday ? 'none' : '1px solid hsl(var(--border))' }}>
                      {w.isToday && (
                        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl" style={{ background: 'rgba(255,255,255,0.2)' }} />
                      )}
                      <div className="relative w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0"
                        style={{ background: w.isToday ? 'rgba(255,255,255,0.25)' : 'hsl(var(--secondary))' }}>
                        <span className="text-[9px] font-black" style={{ color: w.isToday ? '#FFFFFF' : 'hsl(var(--muted-foreground))' }}>{DAYS_S[w.idx]}</span>
                        <span className="text-[13px] font-black mt-0.5" style={{ color: w.isToday ? '#FFFFFF' : 'hsl(var(--foreground))' }}>{w.day!.exercises.length}</span>
                      </div>
                      <div className="flex-1 relative">
                        <div className="flex items-center gap-2">
                          <p className="text-[18px] font-black tracking-tight truncate" style={{ color: w.isToday ? '#FFFFFF' : 'hsl(var(--foreground))' }}>
                            {w.label.toUpperCase()}
                          </p>
                          {w.isToday && (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded uppercase" style={{ background: 'rgba(255,255,255,0.25)', color: '#FFFFFF' }}>HOY</span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold mt-0.5" style={{ color: w.isToday ? 'rgba(255,255,255,0.85)' : 'hsl(var(--muted-foreground))' }}>
                          {w.day!.exercises.length} ejercicios · ~45 min
                        </p>
                      </div>
                      <span className="relative text-[11px] font-black font-mono" style={{ color: w.isToday ? '#FFFFFF' : 'hsl(var(--muted-foreground))' }}>7:00</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="h-4" />
          </>
        )}
      </div>

      {/* ===== DESKTOP ===== */}
      <div className="hidden md:block space-y-6" style={{ fontFamily: FONT }}>
        <div className="anim-lego">
          <p className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: '#FF5A1F' }}>
            {routine?.name || 'Tu programa'}
          </p>
          <h1 className="text-[36px] font-black tracking-tight leading-none mt-1">MI HORARIO</h1>
          <p className="text-[13px] font-bold mt-2 text-muted-foreground">Programa semanal de entrenamientos</p>
        </div>

        {!routine ? (
          <div className="rounded-3xl p-16 text-center bg-card border border-border">
            <div className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: '#FFEDD5' }}>
              <Dumbbell className="h-10 w-10" style={{ color: '#FF5A1F' }} />
            </div>
            <h3 className="text-[22px] font-black tracking-tight">Sin rutina asignada</h3>
            <p className="text-sm mt-2 text-muted-foreground">Tu entrenador creará tu horario pronto</p>
          </div>
        ) : (
          <>
            {/* Resumen cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)', border: '1px solid #27272A' }}>
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl" style={{ background: 'rgba(255,90,31,0.25)' }} />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: '#FF5A1F' }}>
                    <Dumbbell className="h-6 w-6 text-white" strokeWidth={2.5} />
                  </div>
                  <p className="text-[36px] font-black text-white leading-none tracking-tight">{weekDays.filter(d => !d.isRest).length}</p>
                  <p className="text-[10px] font-black uppercase tracking-wider mt-1.5" style={{ color: '#A1A1AA' }}>Días de entreno</p>
                </div>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(255,90,31,0.15)' }}>
                  <Zap className="h-6 w-6" style={{ color: '#FF5A1F' }} fill="#FF5A1F" />
                </div>
                <p className="text-[36px] font-black leading-none tracking-tight">{routine?.days.reduce((acc, d) => acc + d.exercises.length, 0) || 0}</p>
                <p className="text-[10px] font-black uppercase tracking-wider mt-1.5 text-muted-foreground">Ejercicios totales</p>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(132,204,22,0.15)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#84CC16" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <p className="text-[36px] font-black leading-none tracking-tight">{weekDays.filter(d => !d.isRest).length * 45}<span className="text-[16px] font-bold ml-1 text-muted-foreground">min</span></p>
                <p className="text-[10px] font-black uppercase tracking-wider mt-1.5 text-muted-foreground">Tiempo semanal</p>
              </div>
            </div>

            {/* Grid semana */}
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.15em] mb-4 text-muted-foreground">Semana completa</p>
              <div className="grid grid-cols-7 gap-3">
                {weekDays.map((w) => {
                  if (w.isRest) {
                    return (
                      <div key={w.idx} className="rounded-2xl p-5 bg-card border border-border flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded bg-secondary text-muted-foreground">{DAYS_S[w.idx]}</span>
                        </div>
                        <div className="flex-1 flex flex-col justify-center py-4">
                          <p className="text-[20px] font-black text-muted-foreground tracking-tight">Descanso</p>
                          <p className="text-[10px] font-bold mt-1 text-muted-foreground">Recuperación</p>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={w.idx} className="relative overflow-hidden rounded-2xl p-5 flex flex-col"
                      style={{
                        background: w.isToday ? 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)' : 'hsl(var(--card))',
                        border: w.isToday ? 'none' : '1px solid hsl(var(--border))',
                      }}>
                      {w.isToday && <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-3xl" style={{ background: 'rgba(255,255,255,0.2)' }} />}
                      <div className="relative">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded" style={{
                            background: w.isToday ? 'rgba(255,255,255,0.25)' : 'hsl(var(--secondary))',
                            color: w.isToday ? '#FFFFFF' : undefined,
                          }}>{DAYS_S[w.idx]}</span>
                          {w.isToday && <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase" style={{ background: 'rgba(255,255,255,0.25)', color: '#FFFFFF' }}>HOY</span>}
                        </div>
                        <p className="text-[22px] font-black leading-tight tracking-tight mt-2" style={{ color: w.isToday ? '#FFFFFF' : undefined }}>
                          {w.label.toUpperCase()}
                        </p>
                        <div className="mt-4 flex items-baseline gap-1">
                          <span className="text-[28px] font-black leading-none" style={{ color: w.isToday ? '#FFFFFF' : undefined }}>
                            {w.day!.exercises.length}
                          </span>
                          <span className="text-[10px] font-bold" style={{ color: w.isToday ? 'rgba(255,255,255,0.85)' : 'hsl(var(--muted-foreground))' }}>ejercicios</span>
                        </div>
                        <p className="text-[10px] font-bold mt-1" style={{ color: w.isToday ? 'rgba(255,255,255,0.75)' : 'hsl(var(--muted-foreground))' }}>
                          ~45 min · 7:00 AM
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
