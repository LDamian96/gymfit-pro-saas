'use client';

import { useEffect, useState } from 'react';
import { cachedGet, unwrap } from '@/lib/api';

export interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { users: number; checkIns: number };
}

interface UseBranchesResult {
  branches: Branch[];
  loading: boolean;
  // Solo activas, útil para selectores en formularios.
  activeBranches: Branch[];
  // Si solo hay una sucursal activa la devuelve para auto-seleccionarla.
  defaultBranchId: string | null;
  refresh: () => Promise<void>;
}

export function useBranches(): UseBranchesResult {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  // force = true se usa en refresh() tras crear/editar sucursal → evita que el
  // cache de 60s oculte una sucursal recién creada (bug: filtros no la reconocen).
  const fetchBranches = async (force = false) => {
    try {
      const res = await cachedGet<unknown>('/api/v1/branches', { ttl: 15_000, force });
      const data = unwrap<Branch[]>(res);
      setBranches(Array.isArray(data) ? data : []);
    } catch {
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBranches(); }, []);

  const activeBranches = branches.filter((b) => b.isActive);
  const defaultBranchId = activeBranches.length === 1 ? activeBranches[0].id : null;

  return { branches, loading, activeBranches, defaultBranchId, refresh: () => fetchBranches(true) };
}
