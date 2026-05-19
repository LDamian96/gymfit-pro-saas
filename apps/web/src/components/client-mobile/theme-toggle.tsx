'use client';

import { useClientTheme } from '@/stores/client-theme-store';
import { Sun, Moon } from 'lucide-react';

export function MobileThemeToggle() {
  const { theme, setTheme } = useClientTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
      style={{
        background: isDark ? '#18181B' : '#F5F5F7',
        color: isDark ? '#FAFAFA' : '#0A0A0B',
        border: isDark ? '1px solid #27272A' : '1px solid #E5E5E5',
      }}
      aria-label="Cambiar tema"
    >
      {isDark ? <Sun className="h-4 w-4" strokeWidth={2.5} /> : <Moon className="h-4 w-4" strokeWidth={2.5} />}
    </button>
  );
}
