'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { cachedGet, unwrap } from '@/lib/api';
import Link from 'next/link';
import { Flame, ChevronRight, Dumbbell, Activity, ArrowRight, Calendar } from 'lucide-react';

interface ProgressRecord { id: string; date: string; weight: number | null; waist: number | null; arms: number | null; chest: number | null; }
interface MemberInfo { qrCode: string; membershipType: string; membershipEnd: string; isActive: boolean; }
interface CheckIn { id: string; timestamp: string; isDuplicate: boolean; }
interface ExerciseDetail { name: string; muscleGroup: string | null; imageUrl: string | null; }
interface RoutineExercise { sets: number; reps: number; weight: number | null; exercise: ExerciseDetail; }
interface RoutineDay { dayOfWeek: number; exercises: RoutineExercise[]; }
interface Routine { id: string; name: string; days: RoutineDay[]; }

const PLANS: Record<string, string> = { MONTHLY: 'MENSUAL', QUARTERLY: 'TRIMESTRAL', ANNUAL: 'ANUAL' };

function getMuscleLabel(day: RoutineDay | undefined): string {
  if (!day || day.exercises.length === 0) return 'DESCANSO';
  const groups = day.exercises.map(e => e.exercise?.muscleGroup).filter(Boolean) as string[];
  if (groups.length === 0) return 'ENTRENO';
  const counts: Record<string, number> = {};
  groups.forEach(g => { counts[g] = (counts[g] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([g]) => g)[0].toUpperCase();
}

const DAYS_S = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

export default function MyProgressPage() {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<ProgressRecord[]>([]);
  const [info, setInfo] = useState<MemberInfo | null>(null);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);

  const load = useCallback(async () => {
    if (!user?.memberId) return;
    try {
      const [p, m, r, c] = await Promise.all([
        cachedGet(`/api/v1/progress/${user.memberId}`, { ttl: 30_000 }).catch(() => null),
        cachedGet(`/api/v1/members/${user.memberId}`, { ttl: 60_000 }).catch(() => null),
        cachedGet('/api/v1/routines', { params: { memberId: user.memberId }, ttl: 60_000 }).catch(() => null),
        cachedGet(`/api/v1/checkin/member/${user.memberId}`, { ttl: 30_000 }).catch(() => null),
      ]);
      if (p) {
        const b = p as unknown as Record<string, unknown>;
        let a: ProgressRecord[] = [];
        if (Array.isArray(b.data)) a = b.data as ProgressRecord[];
        else if (b.data && typeof b.data === 'object' && Array.isArray((b.data as Record<string, unknown>).data))
          a = (b.data as Record<string, unknown>).data as ProgressRecord[];
        setRecords(a);
      }
      if (m) setInfo(unwrap<MemberInfo>(m));
      if (r) { const rs = unwrap<Routine[]>(r); if (Array.isArray(rs) && rs.length > 0) setRoutine(rs[0]); }
      if (c) {
        const cb = c as unknown as Record<string, unknown>;
        let ca: CheckIn[] = [];
        if (Array.isArray(cb.data)) ca = cb.data as CheckIn[];
        else if (cb.data && typeof cb.data === 'object' && Array.isArray((cb.data as Record<string, unknown>).data))
          ca = (cb.data as Record<string, unknown>).data as CheckIn[];
        setCheckins(ca);
      }
    } catch {}
  }, [user?.memberId]);

  useEffect(() => { load(); }, [load]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
  const daysLeft = info ? Math.max(0, Math.ceil((new Date(info.membershipEnd).getTime() - Date.now()) / 86400000)) : 0;
  const dayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const todayRoutine = routine?.days.find(d => d.dayOfWeek === dayIdx);
  const totalSeries = todayRoutine?.exercises.reduce((acc, e) => acc + e.sets, 0) ?? 0;
  const muscle = getMuscleLabel(todayRoutine);
  const isRest = !todayRoutine || todayRoutine.exercises.length === 0;

  // Visitas este mes
  const monthVisits = checkins.filter(c => {
    const d = new Date(c.timestamp);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // Racha de días consecutivos
  const streak = (() => {
    if (checkins.length === 0) return 0;
    const days = new Set(checkins.map(c => new Date(c.timestamp).toDateString()));
    let count = 0;
    const cursor = new Date();
    while (days.has(cursor.toDateString())) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  })();

  const last = records[0];
  const prev = records[1];
  const weightDelta = last?.weight && prev?.weight ? last.weight - prev.weight : null;

  return (
    <div className="pb-2">
      {/* Hero saludo */}
      <div className="px-5 pt-2 pb-4 reveal-up">
        <p className="label-athletic text-[var(--gym-orange)]">
          / Bienvenido a {user?.tenant?.name ?? 'GymFit'}{user?.branch ? ` · ${user.branch.name}` : ''}
        </p>
        <h1 className="font-display tracking-tight leading-[0.9] mt-2 text-foreground"
          style={{ fontSize: 'clamp(34px, 9vw, 44px)' }}>
          {greeting},<br /><span className="text-[var(--gym-orange)]">{user?.firstName ?? 'Atleta'}.</span>
        </h1>
      </div>

      {/* CTA de hoy: rutina o descanso */}
      <div className="px-4 reveal-up" style={{ animationDelay: '80ms' }}>
        <Link href="/my-routines" className="press-card block">
          <div className="hero-stat" style={{ minHeight: 180 }}>
            <div className="flex items-start justify-between mb-2">
              <p className="label-athletic text-white/50">/ Entrena hoy · {DAYS_S[dayIdx]}</p>
              {!isRest && (
                <span className="font-code text-[10px] px-2 py-0.5 rounded-full text-[var(--gym-orange)]" style={{ background: 'rgba(255,90,31,0.15)', border: '1px solid rgba(255,90,31,0.3)' }}>
                  HOY
                </span>
              )}
            </div>
            <div className="flex-1 flex items-end mt-3">
              <h2 className="hero-num text-white" style={{ fontSize: 'clamp(56px, 14vw, 80px)' }}>{muscle}</h2>
            </div>
            {!isRest ? (
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
                <div>
                  <p className="font-numerals text-white text-[24px] leading-none tnum">{todayRoutine?.exercises.length ?? 0}</p>
                  <p className="label-athletic text-white/40 mt-1">Ejercicios</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <p className="font-numerals text-white text-[24px] leading-none tnum">{totalSeries}</p>
                  <p className="label-athletic text-white/40 mt-1">Series</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex-1">
                  <p className="font-numerals text-white text-[24px] leading-none tnum">~{Math.max(20, totalSeries * 2)}<span className="text-[14px] ml-1">min</span></p>
                  <p className="label-athletic text-white/40 mt-1">Tiempo</p>
                </div>
                <ArrowRight className="h-5 w-5 text-[var(--gym-orange)]" />
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-white/60 text-[12px]">Día de descanso. Recupera tus músculos para el próximo entrenamiento.</p>
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* QR membership */}
      {info && (
        <div className="px-4 mt-3 reveal-up" style={{ animationDelay: '140ms' }}>
          <div className="glass-card warm rounded-3xl p-5 flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white p-2 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${info.qrCode}&bgcolor=FFFFFF&color=0A0B0D&margin=4`} alt="QR" className="w-full h-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="label-athletic text-[var(--gym-orange)]">/ Membresía activa</p>
              <p className="font-display text-[18px] tracking-tight mt-1 text-foreground leading-tight">{user?.firstName} {user?.lastName}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="font-code text-[10px] px-2 py-0.5 rounded-full text-[var(--gym-orange)]" style={{ background: 'rgba(255,90,31,0.12)', border: '1px solid rgba(255,90,31,0.25)' }}>
                  {PLANS[info.membershipType] || info.membershipType}
                </span>
                <span className="font-code text-[11px] tnum text-muted-foreground">{daysLeft}d restantes</span>
              </div>
              <p className="font-code text-[9px] tracking-[0.18em] text-muted-foreground mt-1.5 truncate">{info.qrCode}</p>
            </div>
          </div>
        </div>
      )}

      {/* Grid de stats — 2 col mobile */}
      <div className="px-4 mt-3 grid grid-cols-2 gap-3 reveal-up" style={{ animationDelay: '180ms' }}>
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <p className="label-athletic text-muted-foreground">/ Visitas mes</p>
            <Activity className="h-3.5 w-3.5 text-[var(--gym-lime)]" />
          </div>
          <p className="hero-num mt-2 text-foreground" style={{ fontSize: '40px' }}>{monthVisits}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <p className="label-athletic text-muted-foreground">/ Racha</p>
            <Flame className="h-3.5 w-3.5 text-[var(--gym-orange)]" />
          </div>
          <p className="hero-num mt-2 text-[var(--gym-orange)]" style={{ fontSize: '40px' }}>
            {streak}<span className="text-[16px] text-muted-foreground ml-1">d</span>
          </p>
        </div>
        {last?.weight && (
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <p className="label-athletic text-muted-foreground">/ Peso actual</p>
            </div>
            <p className="hero-num mt-2 text-foreground" style={{ fontSize: '32px' }}>
              {last.weight}<span className="text-[14px] text-muted-foreground ml-1">kg</span>
            </p>
            {weightDelta !== null && weightDelta !== 0 && (
              <p className={`font-code text-[10px] mt-1 ${weightDelta < 0 ? 'text-[var(--gym-lime)]' : 'text-[var(--gym-amber)]'}`}>
                {weightDelta > 0 ? '+' : ''}{weightDelta.toFixed(1)} kg
              </p>
            )}
          </div>
        )}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <p className="label-athletic text-muted-foreground">/ Plan</p>
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <p className="hero-num mt-2 text-foreground" style={{ fontSize: '32px' }}>
            {daysLeft}<span className="text-[14px] text-muted-foreground ml-1">d</span>
          </p>
          <p className="font-code text-[9px] uppercase tracking-wider text-[var(--gym-orange)] mt-1">{PLANS[info?.membershipType ?? ''] || ''}</p>
        </div>
      </div>

      {/* Últimas visitas */}
      <div className="px-4 mt-5 reveal-up" style={{ animationDelay: '240ms' }}>
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="label-athletic text-muted-foreground">/ Últimas visitas</p>
          <Link href="/my-attendance" className="font-code text-[10px] text-[var(--gym-orange)] tracking-wider">VER TODO →</Link>
        </div>
        {checkins.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <Dumbbell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-[12px] text-muted-foreground">Aún no tienes asistencias</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">Cuando escanees tu QR aparecerán aquí</p>
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-2 space-y-1 stagger-children">
            {checkins.slice(0, 4).map((c, i) => {
              const d = new Date(c.timestamp);
              const today = new Date(); today.setHours(0,0,0,0);
              const visitDay = new Date(d); visitDay.setHours(0,0,0,0);
              const dayDiff = Math.round((today.getTime() - visitDay.getTime()) / 86400000);
              const label = dayDiff === 0 ? 'Hoy' : dayDiff === 1 ? 'Ayer' : d.toLocaleDateString('es-PE', { weekday: 'long' });
              return (
                <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ ['--i' as string]: i }}>
                  <div className="w-12 text-center shrink-0">
                    <p className="font-numerals text-[24px] leading-none text-[var(--gym-orange)] tnum">{String(d.getDate()).padStart(2, '0')}</p>
                    <p className="font-code text-[8px] tracking-wider text-muted-foreground mt-0.5 uppercase">{d.toLocaleDateString('es-PE', { month: 'short' })}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold capitalize text-foreground">{label}</p>
                    <p className="font-code text-[10px] text-muted-foreground">
                      {d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Flame className="h-4 w-4 text-[var(--gym-orange)]" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
