'use client';

import { useClientThemeHydrated } from '@/stores/client-theme-store';
import { useAuthStore } from '@/stores/auth-store';
import { useCheckinNotifier } from '@/hooks/use-checkin-notifier';
import { useRouter } from 'next/navigation';
import { Sun, Moon, LogOut, Dumbbell } from 'lucide-react';
import { BranchContextSwitcher } from '@/components/dashboard/branch-context-switcher';
import { ClientBottomNav } from './bottom-nav';
import { NotificationBell } from '@/components/dashboard/notification-bell';

/**
 * Top bar nativo móvil — fijo, blur fuerte tipo iOS, safe-area-aware.
 * Logo a la izquierda, theme + logout a la derecha. Pequeño y discreto.
 */
function MobileTopBar() {
  const { theme, setTheme } = useClientThemeHydrated();
  const { logout, user } = useAuthStore();
  const router = useRouter();
  const handleLogout = () => { router.replace('/login'); void logout(); };
  const isDark = theme === 'dark';
  if (!user) return null;

  return (
    <div className="md:hidden native-bar">
      <div className="h-12 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center fire-card">
            <Dumbbell className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-[13px] tracking-tight text-foreground leading-none">GYMFIT</span>
          <span className="font-code text-[8px] tracking-[0.18em] text-[var(--gym-orange)] leading-none">PRO</span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Campanita solo para admin */}
          {user.role?.split(',').map((r) => r.trim()).includes('ADMIN') && (
            <NotificationBell />
          )}
          <button onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="press w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              color: isDark ? '#FAFAFA' : '#0A0A0B',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
            }}
            aria-label="Cambiar tema">
            {isDark ? <Sun className="h-3.5 w-3.5" strokeWidth={2.5} /> : <Moon className="h-3.5 w-3.5" strokeWidth={2.5} />}
          </button>
          <button onClick={handleLogout}
            className="press w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(244,63,94,0.12)',
              color: '#F43F5E',
              border: '1px solid rgba(244,63,94,0.18)',
            }}
            aria-label="Cerrar sesión">
            <LogOut className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Selector global de sede — solo visible para admin con sucursales.
          BranchContextSwitcher detecta el rol y solo se renderiza si aplica. */}
      <div className="pb-1">
        <BranchContextSwitcher />
      </div>
    </div>
  );
}

export function ClientMobileShell({ children }: { children: React.ReactNode }) {
  const { theme, hydrated } = useClientThemeHydrated();
  const themeClass = !hydrated || theme !== 'dark' ? 'cm-light' : 'cm-dark';
  // Polea last checkin del cliente — toaster motivacional al ser escaneado.
  useCheckinNotifier();

  return (
    <div className={`min-h-screen transition-colors duration-200 ${themeClass}`}>
      <MobileTopBar />
      <main
        className="min-h-screen"
        style={{
          // 48 top bar + ~52 fila del switcher de sede (admin/recep/trainer)
          paddingTop: 'calc(100px + env(safe-area-inset-top, 0px))',
          paddingBottom: 'calc(86px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {children}
      </main>
      <ClientBottomNav />
    </div>
  );
}
