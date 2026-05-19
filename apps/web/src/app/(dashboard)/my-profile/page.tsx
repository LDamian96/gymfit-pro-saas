'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useClientTheme, type ClientTheme } from '@/stores/client-theme-store';
import { cachedGet, unwrap } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

interface MemberInfo {
  qrCode: string;
  membershipType: string;
  membershipEnd: string;
  isActive: boolean;
}

const PLANS: Record<string, string> = { MONTHLY: 'Mensual', QUARTERLY: 'Trimestral', ANNUAL: 'Anual' };

const themeOptions: { id: ClientTheme; label: string; desc: string; preview: { bg: string; accent: string } }[] = [
  { id: 'light', label: 'Claro', desc: 'Blanco · Naranja', preview: { bg: '#FAFAFA', accent: '#FF5A1F' } },
  { id: 'dark', label: 'Oscuro', desc: 'Negro · Naranja', preview: { bg: '#0A0A0B', accent: '#FF5A1F' } },
];

export default function MyProfilePage() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useClientTheme();
  const [info, setInfo] = useState<MemberInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.memberId) { setLoading(false); return; }
    try {
      const m = await cachedGet<unknown>(`/api/v1/members/${user.memberId}`, { ttl: 60_000 });
      setInfo(unwrap<MemberInfo>(m));
    } catch {}
    finally { setLoading(false); }
  }, [user?.memberId]);

  useEffect(() => { load(); }, [load]);

  if (!user) return null;

  const daysLeft = info ? Math.max(0, Math.ceil((new Date(info.membershipEnd).getTime() - Date.now()) / 86400000)) : 0;
  const totalDays = info?.membershipType === 'ANNUAL' ? 365 : info?.membershipType === 'QUARTERLY' ? 90 : 30;
  const pct = Math.max(2, Math.min(100, (daysLeft / totalDays) * 100));

  const qrUrl = info?.qrCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(info.qrCode)}&bgcolor=ffffff&color=000000&margin=8&qzone=1`
    : '';

  return (
    <>
      {/* ===== MOBILE ===== */}
      <div className="md:hidden">
        {/* Header con avatar grande */}
        <div className="px-5 pt-16 pb-2 cm-anim-fade">
          <p className="text-[11px] font-bold uppercase tracking-wider cm-accent-text">Mi Perfil</p>
        </div>

        {/* Card identidad */}
        <div className="px-4 mt-2 cm-anim-slide">
          <div className="cm-card-elevated rounded-3xl p-5">
            <div className="flex items-center gap-4">
              {/* Avatar grande con borde accent */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-3xl p-[2.5px] cm-accent-bg cm-accent-shadow">
                  <div className="w-full h-full rounded-[22px] cm-surface flex items-center justify-center">
                    <span className="text-[24px] font-black cm-accent-text">
                      {user.firstName[0]}{user.lastName[0]}
                    </span>
                  </div>
                </div>
                {info?.isActive && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-xl flex items-center justify-center cm-accent-bg cm-accent-shadow"
                    style={{ borderWidth: 3, borderColor: 'var(--cm-on-accent)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="cm-on-accent">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-[20px] font-black leading-tight">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="cm-text-muted text-[12px] mt-0.5 truncate">{user.email}</p>
                {user.tenant && (
                  <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full cm-accent-bg-soft">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="cm-accent-text">
                      <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/>
                    </svg>
                    <span className="text-[10px] font-bold cm-accent-text">{user.tenant.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* === Membresía con progreso === */}
        {info && !loading && (
          <div className="px-4 mt-4 cm-anim-slide" style={{ animationDelay: '0.05s' }}>
            <div className="cm-card rounded-3xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="cm-text-dim text-[10px] font-bold uppercase tracking-wider">Tu Membresía</p>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  info.isActive
                    ? 'cm-accent-bg-soft cm-accent-text'
                    : 'bg-red-500/15 text-red-400'
                }`}>
                  {info.isActive ? '● ACTIVA' : '○ VENCIDA'}
                </span>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[24px] font-black leading-none">Plan {PLANS[info.membershipType]}</p>
                  <p className="cm-text-muted text-[11px] mt-1">
                    Vence el {new Date(info.membershipEnd).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[28px] font-black leading-none cm-accent-text">{daysLeft}</p>
                  <p className="cm-text-dim text-[10px] font-bold uppercase">días</p>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="mt-4 h-2 rounded-full overflow-hidden cm-surface-2">
                <div className="h-full cm-accent-bg rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* === QR Code === */}
        {info?.qrCode && (
          <div className="px-4 mt-4 cm-anim-slide" style={{ animationDelay: '0.1s' }}>
            <div className="cm-card rounded-3xl p-5">
              <p className="cm-text-dim text-[10px] font-bold uppercase tracking-wider mb-3">Mi QR de acceso</p>
              <div className="flex items-center gap-4">
                {/* QR */}
                <div className="bg-white p-2 rounded-2xl shrink-0 relative">
                  {qrUrl ? (
                    <Image src={qrUrl} alt="QR" width={130} height={130} className="rounded-lg" unoptimized />
                  ) : (
                    <div className="w-[130px] h-[130px] bg-zinc-100 rounded-lg" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider cm-text-dim">Tu código</p>
                  <p className="text-[16px] font-mono font-black mt-1 break-all">{info.qrCode}</p>
                  <p className="cm-text-muted text-[11px] mt-2 leading-snug">
                    Muestra este QR en recepción para registrar tu entrada
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === SELECTOR DE TEMA — premium === */}
        <div className="px-4 mt-4 cm-anim-slide" style={{ animationDelay: '0.15s' }}>
          <p className="text-[13px] font-bold mb-2 px-1">Apariencia</p>
          <div className="cm-card rounded-3xl p-3">
            <div className="space-y-2">
              {themeOptions.map((opt) => {
                const active = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setTheme(opt.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 active:scale-[0.98] ${
                      active ? 'cm-accent-bg-soft cm-accent-border' : 'cm-surface'
                    }`}
                    style={active ? { borderWidth: 1 } : {}}
                  >
                    {/* Preview circular del tema */}
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 relative overflow-hidden"
                      style={{ background: opt.preview.bg, border: `2px solid ${opt.preview.accent}` }}>
                      <div className="w-5 h-5 rounded-lg" style={{ background: opt.preview.accent }} />
                      <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full" style={{ background: opt.preview.accent, opacity: 0.5 }} />
                    </div>

                    <div className="flex-1 text-left">
                      <p className="text-[14px] font-bold">{opt.label}</p>
                      <p className="cm-text-dim text-[11px] mt-0.5">{opt.desc}</p>
                    </div>

                    {/* Radio indicator */}
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      active ? 'cm-accent-bg' : 'cm-surface-2'
                    }`}>
                      {active && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="cm-on-accent">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* === Accesos rápidos === */}
        <div className="px-4 mt-4 cm-anim-slide" style={{ animationDelay: '0.2s' }}>
          <p className="text-[13px] font-bold mb-2 px-1">Accesos rápidos</p>
          <div className="cm-card rounded-3xl overflow-hidden">
            {[
              { href: '/my-progress', label: 'Inicio', desc: 'Resumen y QR', icon: 'home' },
              { href: '/my-routines', label: 'Mi Rutina', desc: 'Plan completo', icon: 'dumbbell' },
              { href: '/my-measurements', label: 'Mis Medidas', desc: 'Control corporal', icon: 'chart' },
            ].map((item, i) => (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 p-4 active:cm-surface-2 transition-colors ${
                  i < 2 ? 'cm-border border-b' : ''
                }`}>
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center cm-accent-bg-soft cm-accent-text">
                    {item.icon === 'home' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
                      </svg>
                    )}
                    {item.icon === 'dumbbell' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M6.5 6.5L17.5 17.5M3.5 10l3-3M7 3.5l3 3M14 17.5l3 3M17 20.5l3-3"/>
                      </svg>
                    )}
                    {item.icon === 'chart' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M3 20h18M7 20V10M12 20V4M17 20v-8"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-bold">{item.label}</p>
                    <p className="cm-text-dim text-[11px]">{item.desc}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="cm-text-dim">
                    <path d="M6 4l4 4-4 4"/>
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* === Info de cuenta === */}
        <div className="px-4 mt-4 cm-anim-slide" style={{ animationDelay: '0.25s' }}>
          <p className="text-[13px] font-bold mb-2 px-1">Información</p>
          <div className="cm-card rounded-3xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="cm-text-dim shrink-0">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 5L2 7"/>
              </svg>
              <div className="flex-1 min-w-0">
                <p className="cm-text-dim text-[10px] font-bold uppercase tracking-wider">Email</p>
                <p className="text-[12px] font-medium truncate">{user.email}</p>
              </div>
            </div>
            {user.tenant && (
              <div className="flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="cm-text-dim shrink-0">
                  <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/>
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="cm-text-dim text-[10px] font-bold uppercase tracking-wider">Gimnasio</p>
                  <p className="text-[12px] font-medium truncate">{user.tenant.name}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="cm-text-dim shrink-0">
                <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 10-16 0"/>
              </svg>
              <div className="flex-1 min-w-0">
                <p className="cm-text-dim text-[10px] font-bold uppercase tracking-wider">Rol</p>
                <p className="text-[12px] font-medium">Cliente</p>
              </div>
            </div>
          </div>
        </div>

        {/* === Logout === */}
        <div className="px-4 mt-4 mb-6 cm-anim-slide" style={{ animationDelay: '0.3s' }}>
          <button
            onClick={logout}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 active:scale-[0.98] transition-transform"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            <span className="text-[14px] font-bold">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* ===== DESKTOP — vacío ===== */}
      <div className="hidden md:block">
        <div className="text-center py-20">
          <p className="text-muted-foreground">Esta página solo está disponible en la versión móvil.</p>
        </div>
      </div>
    </>
  );
}
