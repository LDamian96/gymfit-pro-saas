'use client';

import { useClientThemeHydrated } from '@/stores/client-theme-store';
import { useAuthStore } from '@/stores/auth-store';
import { Sun, Moon, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

// Títulos cortos por ruta — se muestran en la barra superior móvil.
// Para rutas dinámicas podríamos mejorar más adelante.
const TITLES: Record<string, string> = {
  '/dashboard': 'Inicio',
  '/members': 'Clientes',
  '/finances': 'Finanzas',
  '/staff': 'Personal',
  '/checkin': 'Check-in',
  '/exercises': 'Ejercicios',
  '/routines': 'Rutinas',
  '/classes': 'Clases',
  '/pos': 'Vender',
  '/sales': 'Ventas',
  '/shop': 'Tienda',
  '/brands': 'Marcas',
  '/product-categories': 'Categorías',
  '/settings': 'Ajustes',
  '/gamification': 'Logros',
  '/landing': 'Mi Landing',
  '/landing/services': 'Servicios',
  '/landing/plans': 'Planes',
  '/landing/facilities': 'Instalaciones',
  '/landing/faq': 'FAQ',
  '/my-progress': 'Inicio',
  '/my-measurements': 'Medidas',
  '/my-routines': 'Mi Rutina',
  '/my-attendance': 'Asistencia',
  '/my-schedule': 'Mi Horario',
  '/my-profile': 'Mi Perfil',
};

function titleFromPath(path: string): string {
  if (TITLES[path]) return TITLES[path];
  // Buscar coincidencia por prefijo más larga
  const matches = Object.keys(TITLES)
    .filter((k) => path.startsWith(k))
    .sort((a, b) => b.length - a.length);
  return matches[0] ? TITLES[matches[0]] : 'GymFit';
}

export function MobileTopBar() {
  const { theme, setTheme } = useClientThemeHydrated();
  const { logout, user } = useAuthStore();
  const router = useRouter();
  const handleLogout = () => { router.replace('/login'); void logout(); };
  const pathname = usePathname();
  const isDark = theme === 'dark';

  if (!user) return null;

  const title = titleFromPath(pathname);

  return (
    <header
      className="md:hidden fixed top-0 left-0 right-0 z-[55]"
      style={{
        background: isDark ? 'rgba(10,10,11,0.78)' : 'rgba(250,250,250,0.82)',
        backdropFilter: 'saturate(180%) blur(18px)',
        WebkitBackdropFilter: 'saturate(180%) blur(18px)',
        borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div className="px-3 h-12 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1 pl-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)', boxShadow: '0 4px 10px -2px rgba(255,90,31,0.45)' }}>
            <span className="text-white text-[13px] font-black leading-none">G</span>
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-black tracking-tight leading-none truncate"
              style={{ color: isDark ? '#FAFAFA' : '#0A0A0B' }}>
              {title}
            </p>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] leading-none mt-1 truncate"
              style={{ color: isDark ? '#71717A' : '#A3A3A3' }}>
              GymFit Pro
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="press w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              color: isDark ? '#FAFAFA' : '#0A0A0B',
            }}
            aria-label="Cambiar tema"
          >
            {isDark ? <Sun className="h-[16px] w-[16px]" strokeWidth={2.5} /> : <Moon className="h-[16px] w-[16px]" strokeWidth={2.5} />}
          </button>
          <button
            onClick={handleLogout}
            className="press w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: isDark ? 'rgba(244,63,94,0.12)' : 'rgba(244,63,94,0.10)',
              color: '#F43F5E',
            }}
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-[16px] w-[16px]" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </header>
  );
}
