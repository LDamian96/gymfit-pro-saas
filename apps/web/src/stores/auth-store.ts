'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar: string | null;
  memberId: string | null;
  tenant: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
  branch: { id: string; name: string } | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  // 'in' = entrando (después de login OK, antes de navegar al dashboard)
  // 'out' = saliendo (logout iniciado, antes de redirect)
  transitioning: 'in' | 'out' | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  // Pone el overlay de "entrando" inmediatamente, antes incluso de await login.
  setTransitioning: (v: 'in' | 'out' | null) => void;
}

// isLoading arranca en false: el layout SSR siempre hidrata el user antes
// de renderizar contenido. fetchUser solo se usa en flujos client puros (login).
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  transitioning: null,
  setTransitioning: (v) => set({ transitioning: v }),

  login: async (email, password) => {
    const res = await api.post('/api/v1/auth/login', { email, password });
    const data = res as unknown as { data: { user: User } };
    const user = data.data?.user || (data as unknown as { user: User }).user;
    set({ user });
    if (typeof document !== 'undefined') {
      const json = encodeURIComponent(JSON.stringify(user));
      // user_meta con TTL largo (15 min) — el SSR la lee, evita fetch a /auth/me.
      document.cookie = `user_meta=${json};path=/;max-age=900;samesite=lax`;
      // Limpia auth_pending — ya no estamos en transición optimista.
      document.cookie = 'auth_pending=;path=/;max-age=0;samesite=lax';
    }
    return user;
  },

  logout: async () => {
    // NO limpiar user del store antes de navegar — si se hace, el sidebar
    // re-renderiza con userRole='CLIENT' (default) durante el frame previo
    // al redirect → parpadeo "dos cuentas". El componente llama router.replace
    // PRIMERO y este logout corre el API + limpieza en background.
    if (typeof document !== 'undefined') {
      document.cookie = 'user_meta=;path=/;max-age=0;samesite=lax';
      // Reset contexto de sede activa
      try { sessionStorage.removeItem('gymfit-branch-ctx'); } catch { /* ignore */ }
    }
    try { await api.post('/api/v1/auth/logout'); } catch { /* ignorar */ }
    // El user se limpiará cuando el componente desmonte tras llegar al login,
    // o explicitamente desde el componente que llama.
    set({ user: null, isLoading: false, transitioning: null });
  },

  fetchUser: async () => {
    try {
      set({ isLoading: true });
      const res = await api.get('/api/v1/auth/me');
      const data = res as unknown as { data: User };
      set({ user: data.data, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },
}));
