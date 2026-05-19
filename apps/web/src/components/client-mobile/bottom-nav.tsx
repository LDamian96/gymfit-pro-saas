'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useClientTheme } from '@/stores/client-theme-store';
import {
  UserCheck, ShoppingBag, Settings, Globe, Sparkles, Tag, Building, HelpCircle, Dumbbell, Activity, Calendar, X, MoreHorizontal, Store, Receipt, Package,
} from 'lucide-react';

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor"
      strokeWidth={active ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
    </svg>
  );
}
function IconRuler({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor"
      strokeWidth={active ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.3 15.3L15.3 21.3a1 1 0 01-1.4 0l-11.2-11.2a1 1 0 010-1.4l6-6a1 1 0 011.4 0l11.2 11.2a1 1 0 010 1.4z"/>
      <path d="M7.5 10.5l2 2M10.5 7.5l2 2M13.5 4.5l2 2M4.5 13.5l2 2" stroke={active ? 'white' : 'currentColor'} strokeWidth={2} fill="none"/>
    </svg>
  );
}
function IconDumbbell({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2.6 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5L17.5 17.5"/>
      <path d="M21 3l-3 3M3 21l3-3M2 8l6 6M8 2l6 6M22 16l-6-6M16 22l-6-6"/>
    </svg>
  );
}
function IconCheck({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor"
      strokeWidth={active ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12l2 2 4-4" stroke={active ? 'white' : 'currentColor'} strokeWidth={2.5} fill="none"/>
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}
function IconCal({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor"
      strokeWidth={active ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="3"/>
      <path d="M16 2v4M8 2v4M3 10h18" stroke={active ? 'white' : 'currentColor'} strokeWidth={2} fill="none"/>
    </svg>
  );
}
function IconGrid({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor"
      strokeWidth={active ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  );
}
function IconUsers({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor"
      strokeWidth={active ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  );
}
function IconScan({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2.6 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/>
      <path d="M7 12h10"/>
    </svg>
  );
}
function IconWallet({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor"
      strokeWidth={active ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12V8H6a2 2 0 01-2-2v14a2 2 0 002 2h14v-4"/>
      <path d="M20 12V8M16 12h6v4h-6z" stroke={active ? 'white' : 'currentColor'} strokeWidth={2} fill="none"/>
    </svg>
  );
}
function IconMore({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor"
      strokeWidth={active ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
    </svg>
  );
}

type TabDef = { href: string; label: string; Icon: (p: { active: boolean }) => React.JSX.Element };
type MoreItem = { href: string; label: string; Icon: React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>; iconBg: string; iconColor: string };

const TABS_BY_ROLE: Record<string, TabDef[]> = {
  CLIENT: [
    { href: '/my-progress', label: 'Inicio', Icon: IconHome },
    { href: '/my-measurements', label: 'Medidas', Icon: IconRuler },
    { href: '/my-routines', label: 'Rutina', Icon: IconDumbbell },
    { href: '/my-attendance', label: 'Asist.', Icon: IconCheck },
    { href: '/my-schedule', label: 'Horario', Icon: IconCal },
  ],
  ADMIN: [
    { href: '/dashboard', label: 'Inicio', Icon: IconGrid },
    { href: '/members', label: 'Clientes', Icon: IconUsers },
    { href: '/checkin', label: 'Check-in', Icon: IconScan },
    { href: '/finances', label: 'Membresías', Icon: IconWallet },
    { href: '__more__', label: 'Más', Icon: IconMore },
  ],
  TRAINER: [
    { href: '/dashboard', label: 'Inicio', Icon: IconGrid },
    { href: '/members', label: 'Clientes', Icon: IconUsers },
    { href: '/routines', label: 'Rutinas', Icon: IconDumbbell },
    { href: '/exercises', label: 'Ejercicios', Icon: IconDumbbell },
    { href: '__more__', label: 'Más', Icon: IconMore },
  ],
  RECEPTIONIST: [
    { href: '/dashboard', label: 'Inicio', Icon: IconGrid },
    { href: '/checkin', label: 'Check-in', Icon: IconScan },
    { href: '/members', label: 'Clientes', Icon: IconUsers },
    { href: '/finances', label: 'Pagos', Icon: IconWallet },
    { href: '__more__', label: 'Más', Icon: IconMore },
  ],
};

const MORE_BY_ROLE: Record<string, MoreItem[]> = {
  ADMIN: [
    { href: '/pos', label: 'Vender', Icon: Store, iconBg: 'rgba(178,226,52,0.15)', iconColor: '#84CC16' },
    { href: '/sales', label: 'Ventas', Icon: Receipt, iconBg: 'rgba(34,197,94,0.15)', iconColor: '#16A34A' },
    { href: '/shop', label: 'Tienda', Icon: ShoppingBag, iconBg: 'rgba(255,90,31,0.15)', iconColor: '#FF5A1F' },
    { href: '/brands', label: 'Marcas', Icon: Tag, iconBg: 'rgba(168,85,247,0.15)', iconColor: '#A855F7' },
    { href: '/product-categories', label: 'Categorías', Icon: Package, iconBg: 'rgba(20,184,166,0.15)', iconColor: '#14B8A6' },
    { href: '/staff', label: 'Personal', Icon: UserCheck, iconBg: 'rgba(99,102,241,0.15)', iconColor: '#6366F1' },
    { href: '/classes', label: 'Clases', Icon: Calendar, iconBg: 'rgba(34,197,94,0.15)', iconColor: '#22C55E' },
    { href: '/exercises', label: 'Ejercicios', Icon: Dumbbell, iconBg: 'rgba(244,63,94,0.15)', iconColor: '#F43F5E' },
    { href: '/routines', label: 'Rutinas', Icon: Activity, iconBg: 'rgba(168,85,247,0.15)', iconColor: '#A855F7' },
    { href: '/landing', label: 'Mi Landing', Icon: Globe, iconBg: 'rgba(14,165,233,0.15)', iconColor: '#0EA5E9' },
    { href: '/landing/services', label: 'Servicios', Icon: Sparkles, iconBg: 'rgba(234,179,8,0.15)', iconColor: '#EAB308' },
    { href: '/landing/plans', label: 'Planes', Icon: Tag, iconBg: 'rgba(16,185,129,0.15)', iconColor: '#10B981' },
    { href: '/landing/facilities', label: 'Instalaciones', Icon: Building, iconBg: 'rgba(245,158,11,0.15)', iconColor: '#F59E0B' },
    { href: '/landing/faq', label: 'FAQ', Icon: HelpCircle, iconBg: 'rgba(20,184,166,0.15)', iconColor: '#14B8A6' },
    { href: '/settings', label: 'Configuración', Icon: Settings, iconBg: 'rgba(115,115,115,0.15)', iconColor: '#737373' },
  ],
  TRAINER: [
    { href: '/pos', label: 'Vender', Icon: Store, iconBg: 'rgba(178,226,52,0.15)', iconColor: '#84CC16' },
    { href: '/sales', label: 'Ventas', Icon: Receipt, iconBg: 'rgba(34,197,94,0.15)', iconColor: '#16A34A' },
    { href: '/classes', label: 'Clases', Icon: Calendar, iconBg: 'rgba(34,197,94,0.15)', iconColor: '#22C55E' },
  ],
  RECEPTIONIST: [
    { href: '/pos', label: 'Vender', Icon: Store, iconBg: 'rgba(178,226,52,0.15)', iconColor: '#84CC16' },
    { href: '/sales', label: 'Ventas', Icon: Receipt, iconBg: 'rgba(34,197,94,0.15)', iconColor: '#16A34A' },
    { href: '/classes', label: 'Clases', Icon: Calendar, iconBg: 'rgba(34,197,94,0.15)', iconColor: '#22C55E' },
  ],
};

function getRoleKey(role?: string): keyof typeof TABS_BY_ROLE {
  if (!role) return 'CLIENT';
  const roles = role.split(',').map(r => r.trim());
  if (roles.includes('CLIENT')) return 'CLIENT';
  if (roles.includes('ADMIN')) return 'ADMIN';
  if (roles.includes('TRAINER')) return 'TRAINER';
  if (roles.includes('RECEPTIONIST')) return 'RECEPTIONIST';
  return 'CLIENT';
}

export function ClientBottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { theme } = useClientTheme();
  const roleKey = getRoleKey(user?.role);
  const tabs = TABS_BY_ROLE[roleKey];
  const moreItems = MORE_BY_ROLE[roleKey] || [];
  const isDark = theme === 'dark';
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive = moreItems.some((m) => pathname === m.href || (m.href !== '/dashboard' && pathname.startsWith(m.href)));

  return (
    <>
      <nav className="md:hidden native-tabbar">
        <div className="flex items-end justify-between px-2">
          {tabs.map((tab) => {
            const isMore = tab.href === '__more__';
            const active = isMore
              ? moreOpen || moreActive
              : pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href));

            const content = (
              <>
                <span className="tab-item-icon"><tab.Icon active={active} /></span>
                <span className="tab-item-label">{tab.label}</span>
              </>
            );

            if (isMore) {
              return (
                <button key="more" onClick={() => setMoreOpen(true)} className="tab-item" data-active={active}>
                  {content}
                </button>
              );
            }
            return (
              <Link key={tab.href} href={tab.href} className="tab-item" data-active={active}>
                {content}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Sheet "Más" — estilo iOS, drag handle, bento grid */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-[60]" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 rounded-t-[32px] animate-in slide-in-from-bottom-8 duration-300 grain"
            style={{
              background: isDark
                ? 'linear-gradient(180deg, #14161A 0%, #0A0B0D 100%)'
                : '#FFFFFF',
              borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E5E5E5',
              boxShadow: '0 -24px 64px -12px rgba(0,0,0,0.5)',
              maxHeight: '85vh',
              overflowY: 'auto',
              paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <div className="sheet-handle" />
            <div className="flex items-center justify-between px-5 pt-4 pb-4">
              <div>
                <p className="label-athletic text-[var(--gym-orange)]">/ Panel completo</p>
                <h3 className="font-display text-[22px] tracking-tight leading-none mt-1.5"
                  style={{ color: isDark ? '#FAFAFA' : '#0A0A0B' }}>
                  Todas las opciones
                </h3>
              </div>
              <button onClick={() => setMoreOpen(false)} className="press w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                  color: isDark ? '#FAFAFA' : '#0A0A0B',
                }}>
                <X className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2.5 px-4 stagger-children">
              {moreItems.map((item, i) => {
                const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className="press-card flex flex-col items-center gap-2.5 p-3.5 rounded-2xl transition-all"
                    style={{
                      ['--i' as string]: i,
                      background: active
                        ? 'linear-gradient(135deg, rgba(255,90,31,0.12), rgba(255,90,31,0.04))'
                        : isDark ? 'rgba(255,255,255,0.04)' : '#F5F5F7',
                      border: active
                        ? '1px solid rgba(255,90,31,0.3)'
                        : isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
                    }}
                  >
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: item.iconBg }}>
                      <item.Icon className="h-5 w-5" style={{ color: item.iconColor }} strokeWidth={2.5} />
                    </div>
                    <span className="text-[10.5px] font-black text-center leading-tight tracking-tight"
                      style={{ color: isDark ? '#FAFAFA' : '#0A0A0B' }}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
