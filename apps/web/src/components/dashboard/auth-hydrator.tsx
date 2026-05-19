'use client';

import { useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';

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

/**
 * Hidrata el store del cliente con el usuario que ya cargó el servidor.
 * Evita el round-trip extra de /auth/me en el navegador.
 */
export function AuthHydrator({ user }: { user: AuthUser }) {
  const hydrated = useRef(false);
  if (!hydrated.current) {
    useAuthStore.setState({ user, isLoading: false });
    hydrated.current = true;
  }
  return null;
}
