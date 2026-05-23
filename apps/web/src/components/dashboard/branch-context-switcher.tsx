'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Building, Check } from 'lucide-react';
import { useBranches } from '@/hooks/use-branches';
import { useBranchContext } from '@/stores/branch-context-store';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Selector de sede activa en el sidebar. Persiste en sessionStorage.
 * Admin: dropdown con Todas + sedes activas.
 * Recep/Trainer/Cliente: fijo en su sede, sin dropdown (solo muestra el nombre).
 */
export function BranchContextSwitcher() {
  const { user } = useAuthStore();
  const { activeBranches } = useBranches();
  const { activeBranchId, locked, setActiveBranch, hydrate } = useBranchContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role?.split(',').map((r) => r.trim()).includes('ADMIN');

  // Inicializar contexto al montar:
  // - Admin: sin bloqueo, respeta sessionStorage (default '' = Todas)
  // - No-admin: bloqueado a la sede del usuario (de su JWT)
  useEffect(() => {
    if (!user) return;
    if (isAdmin) hydrate({ locked: false });
    else hydrate({ branchId: user.branch?.id, locked: true });
  }, [user, isAdmin, hydrate]);

  // Cerrar dropdown al click afuera
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Sin sedes activas → no renderizar (gimnasio sin sucursales)
  if (activeBranches.length === 0) return null;

  const active = activeBranches.find((b) => b.id === activeBranchId);
  const label = active ? active.name : 'Todas las sucursales';

  // No-admin: badge fijo, sin dropdown
  if (locked || !isAdmin) {
    return (
      <div className="mx-3 mb-3 px-3 py-2 rounded-xl flex items-center gap-2 text-[12px] font-bold"
        style={{ background: 'rgba(255,90,31,0.10)', border: '1px solid rgba(255,90,31,0.25)', color: 'var(--gym-orange)' }}>
        <Building className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate flex-1">{label}</span>
      </div>
    );
  }

  return (
    <div ref={ref} className="mx-3 mb-3 relative">
      <button onClick={() => setOpen((v) => !v)}
        className="press w-full px-3 py-2 rounded-xl flex items-center gap-2 text-[12px] font-bold transition-colors"
        style={{
          background: activeBranchId ? 'rgba(255,90,31,0.12)' : 'hsl(var(--secondary))',
          border: `1px solid ${activeBranchId ? 'rgba(255,90,31,0.30)' : 'hsl(var(--border))'}`,
          color: activeBranchId ? 'var(--gym-orange)' : 'hsl(var(--foreground))',
        }}>
        <Building className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate flex-1 text-left">{label}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 rounded-xl shadow-lg z-50 overflow-hidden"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <button onClick={() => { setActiveBranch(''); setOpen(false); }}
            className="w-full px-3 py-2.5 text-left text-[12px] font-bold hover:bg-secondary flex items-center gap-2">
            <span className="flex-1">Todas las sucursales</span>
            {!activeBranchId && <Check className="h-3.5 w-3.5" style={{ color: 'var(--gym-orange)' }} />}
          </button>
          {activeBranches.map((b) => (
            <button key={b.id} onClick={() => { setActiveBranch(b.id); setOpen(false); }}
              className="w-full px-3 py-2.5 text-left text-[12px] font-bold hover:bg-secondary flex items-center gap-2 border-t border-border">
              <span className="flex-1 truncate">{b.name}</span>
              {activeBranchId === b.id && <Check className="h-3.5 w-3.5" style={{ color: 'var(--gym-orange)' }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Badge visible para poner en el header de cualquier página.
 * Muestra "Sede X" o "TODAS" en grande, para que el admin NO se confunda
 * con qué contexto está operando al crear/registrar cosas.
 */
export function BranchContextBadge() {
  const { activeBranches } = useBranches();
  const { activeBranchId } = useBranchContext();
  if (activeBranches.length === 0) return null;
  const active = activeBranches.find((b) => b.id === activeBranchId);
  const label = active ? active.name : 'Todas las sucursales';
  const isTodas = !active;
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider"
      style={{
        background: isTodas ? 'hsl(var(--secondary))' : 'rgba(255,90,31,0.12)',
        border: `1px solid ${isTodas ? 'hsl(var(--border))' : 'rgba(255,90,31,0.35)'}`,
        color: isTodas ? 'hsl(var(--muted-foreground))' : 'var(--gym-orange)',
      }}>
      <Building className="h-3 w-3" />
      <span>{label}</span>
    </div>
  );
}
