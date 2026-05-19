import axios, { AxiosRequestConfig } from 'axios';

// Cliente para Client Components
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    // Evita que NestJS responda 304 con body vacío en XHR (rompe GET admin).
    // El cachedGet del cliente maneja el caching de aplicación.
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  },
  // 304 no es error — procesarse como respuesta válida.
  validateStatus: (status) => (status >= 200 && status < 300) || status === 304,
  // Aumenta concurrencia/keep-alive en HTTP/2 al backend
  timeout: 20000,
});

// ============================================================
// CACHÉ EN MEMORIA + DEDUPLICACIÓN DE REQUESTS
// - Reduce llamadas duplicadas mientras se navega entre páginas
// - TTL corto por defecto (5s) para frescura
// - Dedup en vuelo: si dos componentes piden lo mismo a la vez,
//   reutiliza la misma promesa
// ============================================================
type CacheEntry = { data: unknown; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

// TTL agresivo: 5 minutos por defecto + stale-while-revalidate.
// Resultado: navegación INSTANTÁNEA (datos del cache) + refresh silencioso en bg.
// Datos frescos llegan sin que el usuario vea spinners ni skeletons.
const DEFAULT_TTL = 300_000;

function cacheKey(url: string, params?: Record<string, unknown>) {
  if (!params) return url;
  const ordered = Object.keys(params).sort().reduce<Record<string, unknown>>((acc, k) => {
    if (params[k] !== undefined && params[k] !== null && params[k] !== '') acc[k] = params[k];
    return acc;
  }, {});
  return Object.keys(ordered).length === 0 ? url : `${url}?${JSON.stringify(ordered)}`;
}

/**
 * Limpia entradas de caché. Pasa un prefijo (ej: '/api/v1/members') para invalidar
 * solo lo que cambió tras un POST/PATCH/DELETE.
 */
export function invalidateCache(prefix?: string) {
  if (!prefix) {
    cache.clear();
    inflight.clear();
    return;
  }
  for (const key of cache.keys()) if (key.includes(prefix)) cache.delete(key);
  for (const key of inflight.keys()) if (key.includes(prefix)) inflight.delete(key);
}

/**
 * GET con caché + dedup + stale-while-revalidate.
 * - Si hay caché vigente → devuelve inmediato.
 * - Si hay caché expirado → devuelve EL VIEJO inmediato y refetch en background
 *   (la próxima navegación verá data fresca, sin esperar al usuario).
 * - Sin caché → fetch normal.
 * Pasa { force: true } para forzar fetch sin usar caché.
 */
export async function cachedGet<T = unknown>(
  url: string,
  options?: { params?: Record<string, unknown>; ttl?: number; force?: boolean },
): Promise<T> {
  const ttl = options?.ttl ?? DEFAULT_TTL;
  const key = cacheKey(url, options?.params);
  const hit = cache.get(key);
  const now = Date.now();

  // 1. Caché vigente → respuesta inmediata
  if (!options?.force && hit && hit.expiresAt > now) return hit.data as T;

  // 2. Petición en vuelo: comparte la promesa
  const pending = inflight.get(key);
  if (pending && !options?.force) return pending as Promise<T>;

  // 3. Stale-while-revalidate: hay caché expirado pero usable
  //    → devuelve el viejo inmediato y dispara refetch en background
  if (!options?.force && hit && hit.expiresAt <= now) {
    void revalidate<T>(url, key, ttl, options?.params);
    return hit.data as T;
  }

  // 4. Sin nada: fetch real con dedup
  return revalidate<T>(url, key, ttl, options?.params);
}

function revalidate<T>(url: string, key: string, ttl: number, params?: Record<string, unknown>): Promise<T> {
  const config: AxiosRequestConfig = { params };
  const promise = api.get(url, config)
    .then((res) => {
      cache.set(key, { data: res, expiresAt: Date.now() + ttl });
      inflight.delete(key);
      return res as unknown as T;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, promise as Promise<unknown>);
  return promise;
}

// Interceptor: si 401, intentar refresh y reintentar
let refreshing: Promise<unknown> | null = null;

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Si ya hay un refresh en vuelo, espéralo en lugar de iniciar otro
        if (!refreshing) {
          refreshing = api.post('/api/v1/auth/refresh').finally(() => { refreshing = null; });
        }
        await refreshing;
        return api.request(originalRequest);
      } catch {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  },
);

// Funciones helper tipadas
export async function apiGet<T>(path: string): Promise<T> {
  const res = await api.get(path);
  return (res as unknown as { data: T }).data;
}

export async function apiPost<T>(path: string, data?: unknown): Promise<T> {
  const res = await api.post(path, data);
  invalidateCache(stripQuery(path));
  return (res as unknown as { data: T }).data;
}

export async function apiPatch<T>(path: string, data?: unknown): Promise<T> {
  const res = await api.patch(path, data);
  invalidateCache(stripQuery(path));
  return (res as unknown as { data: T }).data;
}

export async function apiDelete(path: string): Promise<void> {
  await api.delete(path);
  invalidateCache(stripQuery(path));
}

function stripQuery(path: string) {
  const i = path.indexOf('?');
  return i === -1 ? path : path.slice(0, i);
}

/**
 * Extrae data de la respuesta manejando doble wrap del backend
 * El interceptor axios quita response.data → queda { success, data }
 * Pero algunos services wrappean manualmente → { success, data: { success, data: [...] } }
 */
export function unwrap<T>(res: unknown): T {
  const body = res as Record<string, unknown>;
  // Si body.data es un objeto con su propia propiedad .data, es doble wrap
  if (body.data && typeof body.data === 'object' && !Array.isArray(body.data)) {
    const inner = body.data as Record<string, unknown>;
    if ('data' in inner && 'success' in inner) {
      return inner.data as T;
    }
  }
  return body.data as T;
}
