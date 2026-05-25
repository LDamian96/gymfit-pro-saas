'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Recalcula la posición del dropdown cuando se abre o cambia el viewport.
  useEffect(() => {
    if (!open || !btnRef.current) return;
    const update = () => {
      const r = btnRef.current!.getBoundingClientRect();
      setPos({ left: r.left, top: r.bottom + 4, width: r.width });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  const isAdmin = user?.role?.split(',').map((r) => r.trim()).includes('ADMIN');

  // Inicializar contexto al montar:
  // - Admin: sin bloqueo, respeta sessionStorage (default '' = Todas)
  // - No-admin: bloqueado a la sede del usuario (de su JWT)
  useEffect(() => {
    if (!user) return;
    if (isAdmin) hydrate({ locked: false });
    else hydrate({ branchId: user.branch?.id, locked: true });
  }, [user, isAdmin, hydrate]);

  // Cierre al click afuera lo maneja el backdrop del portal (más confiable que
  // un document listener: el dropdown vive en <body> y un .contains() del wrapper
  // lo daría como "fuera", cerrándose ANTES de aplicar la selección).

  // No-admin (recep/trainer/cliente): badge fijo con SU sede. No pueden leer
  // /api/v1/branches (solo admin), así que usamos user.branch del JWT.
  if (locked || !isAdmin) {
    const sedeName = user?.branch?.name;
    if (!sedeName) return null; // sin sede asignada → no mostrar nada
    return (
      <div className="mx-3 mb-3 px-3 py-2 rounded-xl flex items-center gap-2 text-[12px] font-bold"
        style={{ background: 'rgba(255,90,31,0.10)', border: '1px solid rgba(255,90,31,0.25)', color: 'var(--gym-orange)' }}>
        <Building className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate flex-1">{sedeName}</span>
      </div>
    );
  }

  // Admin sin sedes activas → no renderizar (gimnasio sin sucursales)
  if (activeBranches.length === 0) return null;

  const active = activeBranches.find((b) => b.id === activeBranchId);
  const label = active ? active.name : 'Todas las sucursales';

  const dropdown = open && pos && mounted ? createPortal(
    <>
      {/* Backdrop transparente para cerrar al click afuera (solo móvil) */}
      <div onClick={() => setOpen(false)}
        style={{ position: 'fixed', inset: 0, zIndex: 999 }} />
      <div className="branch-dropdown bg-card text-foreground border border-border rounded-xl shadow-2xl overflow-hidden"
        style={{
          position: 'fixed',
          left: pos.left,
          top: pos.top,
          width: pos.width,
          minWidth: 200,
          zIndex: 1000, // sobre TODO (drawer móvil z-50, native-bar z-50, contenido)
        }}>
        <button onClick={() => { setActiveBranch(''); setOpen(false); }}
          className="w-full px-3 py-2.5 text-left text-[12px] font-bold text-foreground hover:bg-secondary flex items-center gap-2 min-w-0">
          <span className="flex-1 truncate min-w-0">Todas las sucursales</span>
          {!activeBranchId && <Check className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--gym-orange)' }} />}
        </button>
        {activeBranches.map((b) => (
          <button key={b.id} onClick={() => { setActiveBranch(b.id); setOpen(false); }}
            className="w-full px-3 py-2.5 text-left text-[12px] font-bold text-foreground hover:bg-secondary flex items-center gap-2 border-t border-border min-w-0">
            <span className="flex-1 truncate min-w-0">{b.name}</span>
            {activeBranchId === b.id && <Check className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--gym-orange)' }} />}
          </button>
        ))}
      </div>
      <style jsx>{`
        .branch-dropdown {
          animation: branchDropdownIn 180ms cubic-bezier(0.16, 1, 0.3, 1) both;
          transform-origin: top;
        }
        @keyframes branchDropdownIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>,
    document.body,
  ) : null;

  return (
    <div className="mx-3 mb-3">
      <button ref={btnRef} onClick={() => setOpen((v) => !v)}
        className="press w-full px-3 py-2 rounded-xl flex items-center gap-2 text-[12px] font-bold transition-colors min-w-0"
        style={{
          background: activeBranchId ? 'rgba(255,90,31,0.12)' : 'hsl(var(--secondary))',
          border: `1px solid ${activeBranchId ? 'rgba(255,90,31,0.30)' : 'hsl(var(--border))'}`,
          color: activeBranchId ? 'var(--gym-orange)' : 'hsl(var(--foreground))',
        }}>
        <Building className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate flex-1 text-left min-w-0">{label}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {dropdown}
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
  const { user } = useAuthStore();
  const isAdmin = user?.role?.split(',').map((r) => r.trim()).includes('ADMIN');
  // No-admin: no puede leer /branches → usar su sede del JWT.
  if (!isAdmin) {
    const sedeName = user?.branch?.name;
    if (!sedeName) return null;
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider"
        style={{ background: 'rgba(255,90,31,0.12)', border: '1px solid rgba(255,90,31,0.35)', color: 'var(--gym-orange)' }}>
        <Building className="h-3 w-3" />
        <span>{sedeName}</span>
      </div>
    );
  }
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
