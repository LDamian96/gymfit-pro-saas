import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { ClientMobileShell } from '@/components/client-mobile/shell';
import { Toaster } from '@/components/ui/sonner';
import { AuthHydrator } from '@/components/dashboard/auth-hydrator';
import { WarmCache } from '@/components/dashboard/warm-cache';
import { AdminTopBell } from '@/components/dashboard/admin-top-bell';

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar: string | null;
  memberId: string | null;
  tenant: { id: string; name: string; slug: string; logo: string | null };
  branch: { id: string; name: string } | null;
}

// API_INTERNAL_URL: en Docker prod es http://api:3011 (red interna).
// API_URL: fallback (compose alterno).
// localhost:3002: fallback dev local.
const API_URL = process.env.API_INTERNAL_URL || process.env.API_URL || 'http://localhost:3002';

// Layout SSR — el shell se renderiza ANTES de mandar HTML al navegador.
// 0 flicker, 0 spinner, 0 fetch HTTP — el user viene en una cookie no-httponly
// que el login set desde el client. Esto elimina el round-trip al API y hace
// que la transición login → dashboard sea instantánea.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const authPending = cookieStore.get('auth_pending')?.value === '1';
  const userMetaRaw = cookieStore.get('user_meta')?.value;

  // 1) Intenta leer user de cookie `user_meta` (set por el client post-login o optimista).
  let user: AuthUser | null = null;
  if (userMetaRaw) {
    try {
      user = JSON.parse(decodeURIComponent(userMetaRaw)) as AuthUser;
    } catch { user = null; }
  }

  // 2) Si no hay access_token Y no hay user_meta optimista → al login.
  if (!accessToken && !(authPending && user)) {
    redirect('/login');
  }

  // 3) Fallback: si user_meta no se pudo parsear pero tenemos access_token, fetch /auth/me.
  if (!user && accessToken) {
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/me`, {
        headers: { Cookie: `access_token=${accessToken}` },
        next: { revalidate: 60, tags: [`user-${accessToken.slice(-12)}`] },
      });
      if (res.ok) {
        const json = await res.json();
        user = json?.data ?? null;
      }
    } catch { /* api caída */ }
  }

  if (!user) redirect('/login');

  return (
    <>
      {/* Hidrata el store del cliente con el user del SSR (no hay fetch extra) */}
      <AuthHydrator user={user} />

      {/* Calienta cache en idle: el primer click a /members, /finances, etc.
          ya tiene los datos listos → navegación instantánea */}
      <WarmCache role={user.role} />

      {/* Mobile shell — UNIVERSAL para todos los roles */}
      <div className="md:hidden">
        <ClientMobileShell>{children}</ClientMobileShell>
      </div>

      {/* Desktop — sidebar + main + campanita fixed top-right */}
      <div className="hidden md:flex h-screen bg-background text-foreground">
        <Sidebar />
        <main className="flex-1 ml-[256px] p-8 overflow-y-auto relative">{children}</main>
        <AdminTopBell />
      </div>

      <Toaster position="top-right" richColors />
    </>
  );
}
