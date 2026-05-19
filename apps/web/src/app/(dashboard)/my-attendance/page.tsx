'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { cachedGet } from '@/lib/api';
import { Flame, Trophy, Activity } from 'lucide-react';

interface CheckIn { id: string; timestamp: string; isDuplicate: boolean; }
const DAYS_S = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTHS = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];

export default function MyAttendancePage() {
  const { user } = useAuthStore();
  const [checkins, setCheckins] = useState<CheckIn[]>([]);

  const load = useCallback(async () => {
    if (!user?.memberId) return;
    try {
      const c = await cachedGet(`/api/v1/checkin/member/${user.memberId}`, { ttl: 30_000 }).catch(() => null);
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

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const firstOffset = firstDay === 0 ? 6 : firstDay - 1;
  const attendedDays = new Set(
    checkins.filter(c => {
      const d = new Date(c.timestamp);
      return d.getFullYear() === year && d.getMonth() === month;
    }).map(c => new Date(c.timestamp).getDate())
  );
  const visitsMonth = attendedDays.size;

  // Racha
  const streak = (() => {
    if (checkins.length === 0) return 0;
    const days = new Set(checkins.map(c => new Date(c.timestamp).toDateString()));
    let count = 0;
    const d = new Date();
    while (days.has(d.toDateString())) { count++; d.setDate(d.getDate() - 1); }
    return count;
  })();

  // Récord = racha máxima histórica
  const record = (() => {
    if (checkins.length === 0) return 0;
    const days = Array.from(new Set(checkins.map(c => new Date(c.timestamp).toDateString())))
      .map(s => new Date(s).getTime()).sort((a, b) => a - b);
    let max = 1, cur = 1;
    for (let i = 1; i < days.length; i++) {
      if (days[i] - days[i - 1] === 86400000) { cur++; max = Math.max(max, cur); }
      else cur = 1;
    }
    return max;
  })();

  // Construir grid del mes
  const grid: (number | null)[][] = [];
  let week: (number | null)[] = Array(firstOffset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) { grid.push(week); week = []; }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    grid.push(week);
  }

  return (
    <div className="pb-2">
      {/* Hero */}
      <div className="px-5 pt-2 pb-4 reveal-up">
        <p className="label-athletic text-[var(--gym-orange)]">/ Mi asistencia</p>
        <h1 className="font-display tracking-tight leading-[0.9] mt-2 text-foreground" style={{ fontSize: 'clamp(34px, 9vw, 44px)' }}>
          {MONTHS[month]}<br /><span className="text-[var(--gym-orange)] font-numerals tnum">{year}</span>
        </h1>
      </div>

      {/* Hero stat: visitas mes */}
      <div className="px-4 reveal-up" style={{ animationDelay: '80ms' }}>
        <div className="hero-stat" style={{ minHeight: 160 }}>
          <div className="flex items-start justify-between">
            <p className="label-athletic text-white/50">/ Visitas este mes</p>
            <span className="font-code text-[10px] px-2 py-0.5 rounded-full text-[var(--gym-lime)]" style={{ background: 'rgba(132,204,22,0.12)', border: '1px solid rgba(132,204,22,0.25)' }}>
              {Math.round((visitsMonth / daysInMonth) * 100)}%
            </span>
          </div>
          <div className="flex-1 flex items-end mt-3">
            <div className="hero-num text-white" style={{ fontSize: 'clamp(72px, 20vw, 110px)' }}>
              {visitsMonth}
            </div>
            <p className="text-white/50 text-[12px] ml-3 mb-3">de {daysInMonth} días</p>
          </div>
        </div>
      </div>

      {/* Calendario */}
      <div className="px-4 mt-3 reveal-up" style={{ animationDelay: '140ms' }}>
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="label-athletic text-muted-foreground">/ Calendario</p>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--gym-orange)]" />
              <span className="font-code text-[9px] tracking-wider text-muted-foreground">ASISTIDO</span>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {DAYS_S.map((d, i) => (
              <p key={i} className="text-center font-code text-[10px] tracking-wider text-muted-foreground/60">{d}</p>
            ))}
          </div>
          <div className="space-y-1.5">
            {grid.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1.5">
                {week.map((day, di) => {
                  const attended = day && attendedDays.has(day);
                  const isToday = day === today;
                  return (
                    <div key={di} className="aspect-square flex items-center justify-center rounded-lg text-[12px] font-bold tnum"
                      style={{
                        background: attended
                          ? 'linear-gradient(135deg, var(--gym-orange) 0%, var(--gym-orange-dark) 100%)'
                          : day ? 'rgba(127,127,127,0.07)' : 'transparent',
                        color: attended ? '#fff' : day ? 'var(--foreground)' : 'transparent',
                        boxShadow: attended ? '0 4px 12px -2px var(--gym-orange-glow)' : undefined,
                        border: isToday && !attended ? '1px solid var(--gym-orange)' : undefined,
                      }}>
                      {day ?? ''}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats secundarios */}
      <div className="px-4 mt-3 grid grid-cols-2 gap-3 reveal-up" style={{ animationDelay: '180ms' }}>
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <p className="label-athletic text-muted-foreground">/ Racha actual</p>
            <Flame className="h-3.5 w-3.5 text-[var(--gym-orange)]" />
          </div>
          <p className="hero-num mt-2 text-[var(--gym-orange)]" style={{ fontSize: '40px' }}>
            {streak}<span className="text-[14px] text-muted-foreground ml-1">d</span>
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <p className="label-athletic text-muted-foreground">/ Récord</p>
            <Trophy className="h-3.5 w-3.5 text-[var(--gym-amber)]" />
          </div>
          <p className="hero-num mt-2 text-foreground" style={{ fontSize: '40px' }}>
            {record}<span className="text-[14px] text-muted-foreground ml-1">d</span>
          </p>
        </div>
      </div>

      {/* Últimas entradas */}
      <div className="px-4 mt-5 reveal-up" style={{ animationDelay: '240ms' }}>
        <p className="label-athletic text-muted-foreground mb-3 px-1">/ Últimas entradas</p>
        {checkins.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <Activity className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-[12px] text-muted-foreground">Sin asistencias todavía</p>
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-2 space-y-1 stagger-children">
            {checkins.slice(0, 8).map((c, i) => {
              const d = new Date(c.timestamp);
              const todayDate = new Date(); todayDate.setHours(0,0,0,0);
              const visitDay = new Date(d); visitDay.setHours(0,0,0,0);
              const dayDiff = Math.round((todayDate.getTime() - visitDay.getTime()) / 86400000);
              const label = dayDiff === 0 ? 'Hoy' : dayDiff === 1 ? 'Ayer' : d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'short' });
              return (
                <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ ['--i' as string]: i }}>
                  <div className="w-12 text-center shrink-0">
                    <p className="font-numerals text-[24px] leading-none text-[var(--gym-orange)] tnum">{String(d.getDate()).padStart(2, '0')}</p>
                    <p className="font-code text-[8px] tracking-wider text-muted-foreground mt-0.5 uppercase">{d.toLocaleDateString('es-PE', { month: 'short' })}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold capitalize text-foreground">{label}</p>
                    <p className="font-code text-[10px] text-muted-foreground">
                      Entrada {d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {c.isDuplicate && (
                    <span className="font-code text-[9px] tracking-wider text-[var(--gym-amber)]">DUP</span>
                  )}
                  <Flame className="h-3.5 w-3.5 text-[var(--gym-orange)]" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
