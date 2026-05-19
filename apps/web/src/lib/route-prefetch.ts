'use client';

import { cachedGet } from './api';

/**
 * Mapa: ruta del panel → endpoints + params EXACTOS que esa ruta pide en su
 * primer fetch. Critical: los params deben coincidir 1:1 con lo que el
 * componente llama, sino la cache key no matchea y el prefetch no sirve.
 */
const ROUTE_DATA: Record<string, { url: string; params?: Record<string, unknown> }[]> = {
  '/dashboard': [
    { url: '/api/v1/dashboard/stats' },
    { url: '/api/v1/dashboard/recent-activity' },
  ],
  // members-table.tsx → page:1, limit:10, search:'', status:''  (vacíos se ignoran)
  '/members': [{ url: '/api/v1/members', params: { page: 1, limit: 10 } }],
  // payments-table.tsx → page:1, limit:10
  '/finances': [
    { url: '/api/v1/payments', params: { page: 1, limit: 10 } },
    { url: '/api/v1/dashboard/stats' },
  ],
  // staff/page.tsx → limit:50
  '/staff': [{ url: '/api/v1/staff', params: { limit: 50 } }],
  '/exercises': [{ url: '/api/v1/exercises' }],
  '/routines': [{ url: '/api/v1/routines' }],
  '/classes': [{ url: '/api/v1/classes' }],
  '/sales': [{ url: '/api/v1/sales' }],
  '/shop': [{ url: '/api/v1/products' }],
  '/brands': [{ url: '/api/v1/brands' }],
  '/product-categories': [{ url: '/api/v1/product-categories' }],
  '/landing': [{ url: '/api/v1/landing/me' }],
  '/landing/services': [{ url: '/api/v1/landing/services' }],
  '/landing/plans': [{ url: '/api/v1/landing/plans' }],
  '/landing/facilities': [{ url: '/api/v1/landing/facilities' }],
  '/landing/faq': [{ url: '/api/v1/landing/faq' }],
};

const prefetched = new Set<string>();

/**
 * Dispara fetch en background para llenar el cache.
 * Idempotente: solo lo hace una vez por ruta por sesión.
 */
export function prefetchRouteData(href: string) {
  if (prefetched.has(href)) return;
  const endpoints = ROUTE_DATA[href];
  if (!endpoints) return;
  prefetched.add(href);
  for (const ep of endpoints) {
    void cachedGet(ep.url, { params: ep.params }).catch(() => {
      // Silencio: si falla, el componente lo manejará al montar
      prefetched.delete(href);
    });
  }
}
