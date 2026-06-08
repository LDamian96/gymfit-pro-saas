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

// Colores que matchean el bg del panel para que la barra del navegador
// (URL en mobile, status bar en iOS PWA, etc) se adapte al tema activo.
// Light: cream del panel admin. Dark: casi negro del panel admin.
const THEME_COLORS: Record<ClientTheme, string> = {
  light: '#F7F5F1',
  dark: '#0A0B0D',
};

function applyHtmlClass(theme: ClientTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('dark', 'light', 'brown', 'emerald', 'midnight', 'aurora');
  root.classList.add(theme);

  // Sincroniza la barra del navegador con el tema de la app. Sin esto, la
  // barra solo respeta prefers-color-scheme del SO (no el toggle nuestro).
  const color = THEME_COLORS[theme];
  // 1) meta name="theme-color" (Chrome Android, Edge, Brave, PWAs en iOS)
  let metaTC = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])');
  if (!metaTC) {
    metaTC = document.createElement('meta');
    metaTC.name = 'theme-color';
    document.head.appendChild(metaTC);
  }
  metaTC.content = color;
  // Algunas variantes con media= que Next.js genera del viewport — las
  // sobreescribimos para que no compitan con el toggle de la app.
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"][media]')
    .forEach((m) => { m.content = color; });
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
