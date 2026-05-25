'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users, CreditCard, ScanLine, UserPlus, Dumbbell, Calendar,
  ArrowUpRight, Flame, Activity, Receipt, Building, ArrowRight,
} from 'lucide-react';
import { cachedGet } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { useBranchContext } from '@/stores/branch-context-store';
import { BranchContextBadge } from '@/components/dashboard/branch-context-switcher';

interface DashboardStats {
  activeMembers: number;
  totalRevenue: number;
  monthMembershipRevenue?: number;
  monthShopRevenue?: number;
  checkInsToday: number;
  dueSoon: number;
}
interface RecentMember { id: string; membershipType: string; isActive: boolean; membershipEnd: string; createdAt: string; user: { firstName: string; lastName: string; email: string }; }
interface RecentPayment { id: string; amount: number; method: string; status: string; createdAt: string; member: { user: { firstName: string; lastName: string } }; }
interface RecentCheckIn { id: string; timestamp: string; member: { user: { firstName: string; lastName: string } } }
interface RecentActivity {
  recentMembers: RecentMember[];
  recentPayments: RecentPayment[];
  recentCheckIns: RecentCheckIn[];
}

const planLabels: Record<string, string> = { MONTHLY: 'MENSUAL', QUARTERLY: 'TRIMESTRAL', ANNUAL: 'ANUAL' };

export default function DashboardPage() {
  const { user } = useAuthStore();
  const branchId = useBranchContext((s) => s.activeBranchId);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<RecentActivity | null>(null);

  useEffect(() => {
    let mounted = true;
    const params = branchId ? { branchId } : undefined;
    Promise.all([
      cachedGet<{ data: DashboardStats }>('/api/v1/dashboard/stats', { params, ttl: 15_000 }),
      cachedGet<{ data: RecentActivity }>('/api/v1/dashboard/recent-activity', { params, ttl: 15_000 }),
    ]).then(([s, a]) => {
      if (!mounted) return;
      setStats(s.data); setActivity(a.data);
    }).catch(() => {});
    return () => { mounted = false; };
  }, [branchId]);

  const firstName = user?.firstName ?? 'Admin';
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  return (
    <>
      {/* ============ DESKTOP ============ */}
      <div className="hidden md:block space-y-6">
        {/* Hero header */}
        <div className="reveal-up">
          <div className="flex items-center justify-between gap-3">
            <p className="label-athletic text-[var(--gym-orange)]">/ Panel admin</p>
            <BranchContextBadge />
          </div>
          <h1 className="font-display tracking-tight leading-[0.9] mt-2 text-foreground"
            style={{ fontSize: 'clamp(40px, 5vw, 64px)' }}>
            {greeting}, <span className="text-[var(--gym-orange)]">{firstName}.</span>
          </h1>
          <p className="text-[14px] text-muted-foreground mt-3 max-w-xl">
            Hoy es {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}. {branchId ? 'Datos de la sede seleccionada.' : 'Aquí tienes el pulso de tu gimnasio.'}
          </p>
        </div>

        {/* Bento principal — 12 cols */}
        <div className="bento stagger-children" style={{ ['--i' as string]: 0 }}>
          {/* Hero stat: clientes activos (span 6 = grande) */}
          <div data-span="6" className="hero-stat reveal-up" style={{ minHeight: 220 }}>
            <div className="flex items-start justify-between mb-2">
              <p className="label-athletic text-white/50">/ Clientes activos</p>
              <span className="font-code text-[10px] px-2 py-1 rounded-full text-[var(--gym-lime)]" style={{ background: 'rgba(132,204,22,0.12)', border: '1px solid rgba(132,204,22,0.25)' }}>
                +12% MES
              </span>
            </div>
            <div className="flex-1 flex items-end">
              <div className="hero-num text-white hero-num-anim" style={{ fontSize: 'clamp(96px, 12vw, 168px)' }}>
                {stats?.activeMembers ?? '—'}
              </div>
              <p className="text-white/40 text-[12px] ml-3 mb-3 max-w-[160px]">
                clientes con membresía vigente
              </p>
            </div>
            <Link href="/members" className="inline-flex items-center gap-2 text-[12px] font-bold text-[var(--gym-orange)] hover:gap-3 transition-all">
              Ver todos <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Quick fire CTA — Check-in (span 3) */}
          <Link data-span="3" href="/checkin" className="press-card fire-card rounded-3xl p-6 flex flex-col justify-between min-h-[220px] relative overflow-hidden group">
            <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.4), transparent 50%)' }} />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.18)' }}>
                <ScanLine className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
              <p className="font-display text-white text-[24px] leading-none tracking-tight">CHECK-IN<br />QR</p>
            </div>
            <div className="relative flex items-center justify-between">
              <p className="text-white/80 text-[11px]">Escanear código</p>
              <ArrowRight className="h-4 w-4 text-white group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Stats secundarios (span 3) */}
          <div data-span="3" className="glass-card rounded-3xl p-6 flex flex-col justify-between min-h-[220px]">
            <div>
              <p className="label-athletic text-muted-foreground">/ Check-ins hoy</p>
              <p className="hero-num mt-3 text-foreground" style={{ fontSize: '64px' }}>{stats?.checkInsToday ?? 0}</p>
            </div>
            <div className="space-y-2 pt-3 border-t border-white/5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Por vencer</span>
                <span className="font-code font-bold text-[var(--gym-amber)]">{stats?.dueSoon ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Ingresos mes</span>
                <span className="font-code font-bold text-[var(--gym-lime)]">S/ {(stats?.totalRevenue ?? 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Quick actions — 4 botones (span 12) */}
          <div data-span="12" className="grid grid-cols-4 gap-3 mt-1">
            {[
              { href: '/members', label: 'Nuevo cliente', icon: UserPlus, color: '#FF5A1F' },
              { href: '/finances', label: 'Registrar pago', icon: CreditCard, color: '#84CC16' },
              { href: '/routines', label: 'Crear rutina', icon: Dumbbell, color: '#A855F7' },
              { href: '/branches', label: 'Sucursales', icon: Building, color: '#0EA5E9' },
            ].map((a) => (
              <Link key={a.href} href={a.href}
                className="press-card glass-card rounded-2xl p-4 flex items-center gap-3 hover:border-white/12 transition-all group">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${a.color}1f`, border: `1px solid ${a.color}33` }}>
                  <a.icon className="h-5 w-5" style={{ color: a.color }} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-display tracking-tight text-foreground">{a.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Abrir →</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Activity feed — 3 columnas (span 12) */}
          <div data-span="6" className="glass-card rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="label-athletic text-muted-foreground">/ Últimos check-ins</p>
              <Link href="/checkin" className="text-[11px] text-[var(--gym-orange)] font-bold hover:underline">Ver todos</Link>
            </div>
            <div className="space-y-2">
              {(activity?.recentCheckIns?.slice(0, 5) ?? []).map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors stagger-children" style={{ ['--i' as string]: i }}>
                  <div className="w-8 h-8 rounded-lg bg-[var(--gym-orange)]/15 flex items-center justify-center text-[10px] font-display text-[var(--gym-orange)] uppercase">
                    {c.member.user.firstName[0]}{c.member.user.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold truncate">{c.member.user.firstName} {c.member.user.lastName}</p>
                    <p className="font-code text-[10px] text-muted-foreground">
                      {new Date(c.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Activity className="h-3.5 w-3.5 text-[var(--gym-lime)]" />
                </div>
              ))}
              {(!activity?.recentCheckIns || activity.recentCheckIns.length === 0) && (
                <p className="text-[12px] text-muted-foreground/50 text-center py-8">Sin check-ins todavía</p>
              )}
            </div>
          </div>

          <div data-span="6" className="glass-card rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="label-athletic text-muted-foreground">/ Últimos pagos</p>
              <Link href="/finances" className="text-[11px] text-[var(--gym-orange)] font-bold hover:underline">Ver todos</Link>
            </div>
            <div className="space-y-2">
              {(activity?.recentPayments?.slice(0, 5) ?? []).map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors stagger-children" style={{ ['--i' as string]: i }}>
                  <div className="w-8 h-8 rounded-lg bg-[var(--gym-lime)]/15 flex items-center justify-center">
                    <Receipt className="h-4 w-4 text-[var(--gym-lime)]" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold truncate">{p.member?.user?.firstName} {p.member?.user?.lastName}</p>
                    <p className="text-[10px] text-muted-foreground">{p.method}</p>
                  </div>
                  <span className="font-code text-[13px] font-bold text-[var(--gym-lime)] tnum">
                    S/ {p.amount.toFixed(0)}
                  </span>
                </div>
              ))}
              {(!activity?.recentPayments || activity.recentPayments.length === 0) && (
                <p className="text-[12px] text-muted-foreground/50 text-center py-8">Sin pagos recientes</p>
              )}
            </div>
          </div>

          {/* Nuevos clientes (span 12) */}
          {activity?.recentMembers && activity.recentMembers.length > 0 && (
            <div data-span="12" className="glass-card rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="label-athletic text-muted-foreground">/ Nuevos clientes</p>
                <Link href="/members" className="text-[11px] text-[var(--gym-orange)] font-bold hover:underline">Ver todos</Link>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-children">
                {activity.recentMembers.slice(0, 4).map((m, i) => (
                  <div key={m.id} className="press-card p-3 rounded-2xl bg-white/[0.03] border border-white/5" style={{ ['--i' as string]: i }}>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-9 h-9 rounded-xl fire-card flex items-center justify-center text-[11px] font-display uppercase">
                        {m.user.firstName[0]}{m.user.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold truncate text-foreground">{m.user.firstName} {m.user.lastName}</p>
                        <p className="font-code text-[9px] tracking-wider text-[var(--gym-orange)]">{planLabels[m.membershipType] || m.membershipType}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{m.user.email}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============ MOBILE ============ */}
      <div className="md:hidden">
        {/* Hero saludo + número grande */}
        <div className="px-5 pt-4 pb-5 reveal-up">
          <p className="label-athletic text-[var(--gym-orange)]">/ Panel admin</p>
          <h1 className="font-display tracking-tight leading-[0.9] mt-2 text-foreground" style={{ fontSize: 'clamp(34px, 9vw, 44px)' }}>
            {greeting},<br /><span className="text-[var(--gym-orange)]">{firstName}.</span>
          </h1>
        </div>

        {/* Hero card mobile */}
        <div className="px-4 reveal-up" style={{ animationDelay: '80ms' }}>
          <div className="hero-stat" style={{ minHeight: 180 }}>
            <div className="flex items-start justify-between">
              <p className="label-athletic text-white/50">/ Clientes activos</p>
              <span className="font-code text-[9px] px-2 py-0.5 rounded-full text-[var(--gym-lime)]" style={{ background: 'rgba(132,204,22,0.12)', border: '1px solid rgba(132,204,22,0.25)' }}>
                +12%
              </span>
            </div>
            <div className="flex-1 flex items-end mt-3">
              <div className="hero-num text-white hero-num-anim" style={{ fontSize: 'clamp(80px, 22vw, 120px)' }}>
                {stats?.activeMembers ?? '—'}
              </div>
            </div>
            <p className="text-white/50 text-[11px] mt-3">de membresía vigente · {stats?.dueSoon ?? 0} por vencer pronto</p>
          </div>
        </div>

        {/* Quick row de stats secundarios */}
        <div className="px-4 mt-3 grid grid-cols-2 gap-3 reveal-up" style={{ animationDelay: '140ms' }}>
          <div className="glass-card rounded-2xl p-4">
            <p className="label-athletic text-muted-foreground">/ Check-ins hoy</p>
            <p className="hero-num mt-2 text-foreground" style={{ fontSize: '40px' }}>{stats?.checkInsToday ?? 0}</p>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <p className="label-athletic text-muted-foreground">/ Ingresos mes</p>
            <p className="hero-num mt-2 text-[var(--gym-lime)]" style={{ fontSize: '32px' }}>
              S/{(stats?.totalRevenue ?? 0).toLocaleString()}
            </p>
            {/* Desglose membresías vs tienda — solo si hay data */}
            {((stats?.monthMembershipRevenue ?? 0) + (stats?.monthShopRevenue ?? 0)) > 0 && (
              <div className="flex items-center gap-2 mt-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                <span>Memb. S/{(stats?.monthMembershipRevenue ?? 0).toLocaleString()}</span>
                <span>·</span>
                <span>Tienda S/{(stats?.monthShopRevenue ?? 0).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="px-4 mt-5 reveal-up" style={{ animationDelay: '200ms' }}>
          <p className="label-athletic text-muted-foreground mb-3 px-1">/ Acciones rápidas</p>
          <div className="grid grid-cols-2 gap-3 stagger-children">
            <Link href="/checkin" className="press-card fire-card rounded-2xl p-4 flex flex-col gap-3 min-h-[110px] relative overflow-hidden" style={{ ['--i' as string]: 0 }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <ScanLine className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <p className="font-display text-white text-[15px] leading-none">CHECK-IN</p>
              <p className="text-white/70 text-[10px] mt-auto">Escanear QR →</p>
            </Link>
            {[
              { href: '/members', label: 'Nuevo cliente', icon: UserPlus, color: '#FF5A1F' },
              { href: '/finances', label: 'Registrar pago', icon: CreditCard, color: '#84CC16' },
              { href: '/routines', label: 'Crear rutina', icon: Dumbbell, color: '#A855F7' },
            ].map((a, i) => (
              <Link key={a.href} href={a.href}
                className="press-card glass-card rounded-2xl p-4 flex flex-col gap-3 min-h-[110px]" style={{ ['--i' as string]: i + 1 }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${a.color}1f`, border: `1px solid ${a.color}33` }}>
                  <a.icon className="h-5 w-5" style={{ color: a.color }} strokeWidth={2.5} />
                </div>
                <p className="text-[13px] font-display tracking-tight text-foreground leading-tight">{a.label}</p>
                <p className="text-[10px] text-muted-foreground mt-auto">Abrir →</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Últimos check-ins */}
        <div className="px-4 mt-6 reveal-up" style={{ animationDelay: '260ms' }}>
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="label-athletic text-muted-foreground">/ Últimos check-ins</p>
            <Link href="/checkin" className="text-[10px] text-[var(--gym-orange)] font-bold">Todos →</Link>
          </div>
          <div className="glass-card rounded-2xl p-2 space-y-1 stagger-children">
            {(activity?.recentCheckIns?.slice(0, 4) ?? []).map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ ['--i' as string]: i }}>
                <div className="w-9 h-9 rounded-xl bg-[var(--gym-orange)]/15 flex items-center justify-center text-[11px] font-display text-[var(--gym-orange)] uppercase">
                  {c.member.user.firstName[0]}{c.member.user.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold truncate">{c.member.user.firstName} {c.member.user.lastName}</p>
                  <p className="font-code text-[10px] text-muted-foreground">
                    {new Date(c.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <Flame className="h-3.5 w-3.5 text-[var(--gym-orange)]" />
              </div>
            ))}
            {(!activity?.recentCheckIns || activity.recentCheckIns.length === 0) && (
              <p className="text-[12px] text-muted-foreground/50 text-center py-6">Sin check-ins todavía</p>
            )}
          </div>
        </div>

        {/* Últimos pagos */}
        <div className="px-4 mt-5 mb-2 reveal-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="label-athletic text-muted-foreground">/ Últimos pagos</p>
            <Link href="/finances" className="text-[10px] text-[var(--gym-orange)] font-bold">Todos →</Link>
          </div>
          <div className="glass-card rounded-2xl p-2 space-y-1 stagger-children">
            {(activity?.recentPayments?.slice(0, 3) ?? []).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ ['--i' as string]: i }}>
                <div className="w-9 h-9 rounded-xl bg-[var(--gym-lime)]/15 flex items-center justify-center">
                  <Receipt className="h-4 w-4 text-[var(--gym-lime)]" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold truncate">{p.member?.user?.firstName} {p.member?.user?.lastName}</p>
                  <p className="text-[10px] text-muted-foreground">{p.method}</p>
                </div>
                <span className="font-code text-[14px] font-bold text-[var(--gym-lime)] tnum">S/{p.amount.toFixed(0)}</span>
              </div>
            ))}
            {(!activity?.recentPayments || activity.recentPayments.length === 0) && (
              <p className="text-[12px] text-muted-foreground/50 text-center py-6">Sin pagos recientes</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
