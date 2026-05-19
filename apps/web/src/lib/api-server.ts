import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// En Docker prod el web container usa API_INTERNAL_URL para llegar al api por
// la red interna sin pasar por internet. Fallback API_URL y luego localhost dev.
const API_URL = process.env.API_INTERNAL_URL || process.env.API_URL || 'http://localhost:3002';

// Cliente para Server Components (SSR)
export async function apiServer<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Cookie: `access_token=${accessToken}` } : {}),
      ...options?.headers,
    },
    cache: 'no-store',
  });

  if (res.status === 401) {
    redirect('/login');
  }

  const json = await res.json();

  if (!json.success) {
    throw new Error(json.message || 'Error del servidor');
  }

  return json.data;
}
