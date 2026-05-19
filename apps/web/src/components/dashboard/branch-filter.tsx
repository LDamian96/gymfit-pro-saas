'use client';

import { Building } from 'lucide-react';
import { useBranches } from '@/hooks/use-branches';

interface BranchFilterProps {
  value: string;
  onChange: (branchId: string) => void;
  // Si es true, no muestra opción "Todas". Útil en POS donde la venta SIEMPRE se ancla a una sede.
  required?: boolean;
  // Texto para la opción "todas las sedes". Default: "Todas las sucursales".
  allLabel?: string;
  className?: string;
}

/**
 * Filtro de sede para el admin. Reglas:
 * - 0 sedes: no se renderiza nada.
 * - 1 sede: se muestra fija en modo "auto" (no selector).
 * - 2+ sedes: dropdown visible.
 *
 * Si `required` es false (default), incluye opción "Todas" para ver agregado.
 * El padre debe inicializar `value` con `defaultBranchId ?? ''` (auto-pick si hay 1).
 */
export function BranchFilter({ value, onChange, required = false, allLabel = 'Todas las sucursales', className = '' }: BranchFilterProps) {
  const { activeBranches, loading } = useBranches();

  if (loading || activeBranches.length === 0) return null;

  if (activeBranches.length === 1) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary border border-border text-[13px] ${className}`}>
        <Building className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="truncate">{activeBranches[0].name}</span>
        <span className="ml-auto text-[9px] font-black uppercase tracking-wider text-muted-foreground">Auto</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Building className="h-3.5 w-3.5 text-muted-foreground" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none px-3 py-2 pr-8 bg-card rounded-lg border border-border text-[13px] outline-none cursor-pointer focus:border-primary"
      >
        {!required && <option value="">{allLabel}</option>}
        {activeBranches.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
    </div>
  );
}
