'use client';

import { useEffect } from 'react';
import { prefetchRouteData } from '@/lib/route-prefetch';

/**
 * Calienta el cache de los routes más usados del panel apenas el dashboard
 * monta. Corre en idle (no compite con el render) y solo prefetchea las
 * rutas a las que el rol del usuario tiene acceso.
 *
 * Resultado: el "primer click" en /members, /finances, /staff llega con
 * la data ya cargada → navegación instantánea.
 */

const PREFETCH_BY_ROLE: Record<string, string[]> = {
  ADMIN: ['/members', '/finances', '/staff', '/exercises', '/routines', '/classes'],
  RECEPTIONIST: ['/members', '/checkin', '/classes', '/pos'],
  TRAINER: ['/members', '/exercises', '/routines', '/classes'],
  CLIENT: ['/my-progress', '/my-routines', '/my-attendance', '/my-schedule'],
};

export function WarmCache({ role }: { role: string }) {
  useEffect(() => {
    const userRoles = role.split(',').map((r) => r.trim());
    const routes = new Set<string>();
    for (const r of userRoles) {
      const list = PREFETCH_BY_ROLE[r];
      if (list) list.forEach((route) => routes.add(route));
    }

    // requestIdleCallback con fallback a setTimeout: prefetch sin bloquear
    // el render del dashboard. Si el navegador está ocupado, espera.
    const idle = (cb: () => void) => {
      type IdleFn = (cb: () => void, opts?: { timeout: number }) => number;
      const ric = (window as unknown as { requestIdleCallback?: IdleFn }).requestIdleCallback;
      if (ric) ric(cb, { timeout: 1500 });
      else setTimeout(cb, 250);
    };

    idle(() => {
      for (const route of routes) prefetchRouteData(route);
    });
  }, [role]);

  return null;
}
