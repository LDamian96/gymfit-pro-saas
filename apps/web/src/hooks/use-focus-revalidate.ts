'use client';

import { useEffect, useRef } from 'react';

/**
 * Llama el callback cuando la pestaña recupera foco o vuelve a ser visible.
 * Útil para revalidar listas que pudieron cambiar en otra pestaña/ventana
 * (ej. el admin creó un grupo muscular en /muscle-groups y vuelve a /exercises).
 */
export function useFocusRevalidate(callback: () => void) {
  const ref = useRef(callback);
  ref.current = callback;

  useEffect(() => {
    const onFocus = () => ref.current();
    const onVisible = () => { if (document.visibilityState === 'visible') ref.current(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
}
