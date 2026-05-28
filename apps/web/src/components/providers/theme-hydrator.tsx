'use client';

import { useEffect } from 'react';
import { useClientTheme } from '@/stores/client-theme-store';

/**
 * Hidrata el store de tema desde localStorage en el primer mount.
 * Garantiza que el state de Zustand coincida con la clase aplicada por
 * el script inline del <head>. Sin esto, los componentes que leen
 * useClientTheme(s => s.theme) podrian quedar con el default 'light'
 * aunque la pagina ya este renderizada en dark.
 */
export function ClientThemeHydrator() {
  const hydrate = useClientTheme((s) => s.hydrate);
  useEffect(() => { hydrate(); }, [hydrate]);
  return null;
}
