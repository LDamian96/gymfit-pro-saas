'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Dumbbell, BarChart3, User } from 'lucide-react';
import { useClientTheme } from '@/stores/client-theme-store';

const tabs = [
  { href: '/my-progress', label: 'Inicio', icon: Home },
  { href: '/my-routines', label: 'Rutina', icon: Dumbbell },
  { href: '/my-measurements', label: 'Medidas', icon: BarChart3 },
  { href: '/my-profile', label: 'Perfil', icon: User },
];

export function ClientBottomNav() {
  const pathname = usePathname();
  const { theme } = useClientTheme();
  const isDark = theme === 'dark';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Fondo con blur premium */}
      <div className={`absolute inset-0 ${
        isDark
          ? 'bg-[#0A0A0F]/80 border-t border-white/[0.06]'
          : 'bg-white/80 border-t border-black/[0.06]'
      } backdrop-blur-2xl`} />

      <div className="relative flex items-center justify-around px-4 pt-2 pb-7">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link key={tab.href} href={tab.href} className="flex flex-col items-center gap-1 min-w-[60px] group">
              <div className={`relative p-2.5 rounded-2xl transition-all duration-500 ease-out ${
                isActive
                  ? 'bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 shadow-[0_4px_20px_rgba(139,92,246,0.4)] scale-110'
                  : ''
              }`}>
                <tab.icon className={`h-[22px] w-[22px] transition-all duration-300 ${
                  isActive
                    ? 'text-white'
                    : isDark
                      ? 'text-white/25 group-active:text-white/40'
                      : 'text-gray-400 group-active:text-gray-600'
                }`} strokeWidth={isActive ? 2.5 : 1.8} />

                {/* Indicador activo — punto luminoso */}
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
                )}
              </div>

              <span className={`text-[10px] font-semibold transition-all duration-300 ${
                isActive
                  ? isDark ? 'text-white' : 'text-violet-600'
                  : isDark ? 'text-white/20' : 'text-gray-400'
              }`}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
