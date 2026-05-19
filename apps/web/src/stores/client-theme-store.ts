'use client';

import { create } from 'zustand';
import { useEffect } from 'react';

export type ClientTheme = 'dark' | 'light';

interface ClientThemeState {
  theme: ClientTheme;
  hydrated: boolean;
  setTheme: (theme: ClientTheme) => void;
  toggleTheme: () => void;
  hydrate: () => void;
}

function applyHtmlClass(theme: ClientTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('dark', 'light', 'brown', 'emerald', 'midnight', 'aurora');
  root.classList.add(theme);
}

export const useClientTheme = create<ClientThemeState>((set, get) => ({
  theme: 'light',
  hydrated: false,

  setTheme: (theme) => {
    localStorage.setItem('gymfit-client-theme', theme);
    applyHtmlClass(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const next: ClientTheme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('gymfit-client-theme', next);
    applyHtmlClass(next);
    set({ theme: next });
  },

  hydrate: () => {
    if (get().hydrated) return;
    const saved = localStorage.getItem('gymfit-client-theme') as ClientTheme | null;
    const theme: ClientTheme = saved === 'dark' || saved === 'light' ? saved : 'light';
    applyHtmlClass(theme);
    set({ theme, hydrated: true });
  },
}));

export function useClientThemeHydrated() {
  const store = useClientTheme();
  useEffect(() => { store.hydrate(); }, [store]);
  return store;
}
