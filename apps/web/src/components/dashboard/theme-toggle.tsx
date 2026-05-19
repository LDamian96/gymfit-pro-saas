'use client';

import { useClientThemeHydrated } from '@/stores/client-theme-store';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme, hydrated } = useClientThemeHydrated();

  if (!hydrated) return <div className="w-9 h-9" />;

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center hover:bg-accent transition-colors"
      title={isDark ? 'Cambiar a claro' : 'Cambiar a oscuro'}
    >
      {isDark ? <Sun className="h-4 w-4 text-primary" /> : <Moon className="h-4 w-4 text-primary" />}
    </button>
  );
}
