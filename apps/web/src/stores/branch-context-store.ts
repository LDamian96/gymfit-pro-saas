'use client';

import { create } from 'zustand';

/**
 * Contexto global de sede activa. Persistencia: sessionStorage (se borra al
 * cerrar sesión). El admin elige en qué sede opera y TODOS los filtros +
 * forms del panel se ajustan a esa sede. '' = "Todas las sucursales".
 *
 * Recep/Trainer/Cliente NO usan este selector: están atados a su sede,
 * el contexto se hidrata con su branchId del JWT al iniciar y queda fijo.
 */
interface BranchContextState {
  // '' = Todas; cualquier otro string = id de sede.
  activeBranchId: string;
  // Si true, el selector está bloqueado (rol no-admin, fijo a su sede).
  locked: boolean;
  setActiveBranch: (id: string) => void;
  // Llamado al login/logout para inicializar/limpiar.
  hydrate: (opts: { branchId?: string | null; locked: boolean }) => void;
  reset: () => void;
}

const SS_KEY = 'gymfit-branch-ctx';

function readSession(): string {
  if (typeof window === 'undefined') return '';
  try { return sessionStorage.getItem(SS_KEY) || ''; } catch { return ''; }
}
function writeSession(v: string) {
  if (typeof window === 'undefined') return;
  try { sessionStorage.setItem(SS_KEY, v); } catch { /* ignore */ }
}

export const useBranchContext = create<BranchContextState>((set) => ({
  activeBranchId: readSession(),
  locked: false,
  setActiveBranch: (id) => {
    writeSession(id);
    set({ activeBranchId: id });
  },
  hydrate: ({ branchId, locked }) => {
    // Rol no-admin: forzar la sede del JWT y bloquear.
    if (locked) {
      const id = branchId || '';
      writeSession(id);
      set({ activeBranchId: id, locked: true });
      return;
    }
    // Admin: respeta lo que haya en sessionStorage; si no hay, default 'Todas'.
    set({ locked: false });
  },
  reset: () => {
    if (typeof sessionStorage !== 'undefined') {
      try { sessionStorage.removeItem(SS_KEY); } catch { /* ignore */ }
    }
    set({ activeBranchId: '', locked: false });
  },
}));
