# API Client (Auth SSR + Client)

Configura el cliente HTTP que maneja cookies en Server Components y Client Components. SIEMPRE responde en español.

## Problema que resuelve
- Next.js Server Components NO tienen acceso a cookies del browser
- Las cookies HTTPOnly no se envían automáticamente en SSR
- Sin esto, auth se rompe en Server Components

## Solución: Dos clientes

### 1. Server-side (para Server Components)
```typescript
// lib/api-server.ts
import { cookies } from 'next/headers';

export async function apiServer<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  const res = await fetch(`${process.env.API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Cookie: `access_token=${accessToken}`,
      ...options?.headers,
    },
    cache: 'no-store', // o revalidate según necesidad
  });

  if (res.status === 401) {
    redirect('/login');
  }

  return res.json();
}
```

### 2. Client-side (para Client Components)
```typescript
// lib/api-client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // CRÍTICO — envía cookies
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: si 401, intentar refresh y reintentar
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await apiClient.post('/api/v1/auth/refresh');
        return apiClient.request(error.config); // reintentar
      } catch {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

## Custom Hooks
```typescript
// hooks/use-api.ts — para queries con loading/error states
// hooks/use-mutation.ts — para mutations con optimistic updates
// hooks/use-auth.ts — login, logout, user actual
```

## Variables de Entorno
```
# .env.local (frontend)
NEXT_PUBLIC_API_URL=http://localhost:3001
API_URL=http://localhost:3001  # para SSR (no NEXT_PUBLIC)
```

## CORS en Backend
```typescript
// main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL, // http://localhost:3000
  credentials: true, // CRÍTICO — permite cookies cross-origin
});
```
