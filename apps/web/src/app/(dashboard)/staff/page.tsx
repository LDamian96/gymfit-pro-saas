'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { StaffForm } from './_components/staff-form';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { api, cachedGet, invalidateCache } from '@/lib/api';
import { useBranchContext } from '@/stores/branch-context-store';
import { BranchContextBadge } from '@/components/dashboard/branch-context-switcher';
import { toast } from 'sonner';

type StaffRole = 'RECEPTIONIST' | 'TRAINER';

interface StaffMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatar: string | null;
  role: StaffRole;
  isActive: boolean;
  branchId: string | null;
  branch?: { id: string; name: string } | null;
  createdAt: string;
}

interface StaffFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: StaffRole;
  branchId: string;
}

interface StaffApiResponse {
  success: boolean;
  data: StaffMember[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const ROLE_LABELS: Record<StaffRole, string> = {
  RECEPTIONIST: 'Recepcionista',
  TRAINER: 'Entrenador',
};

const ROLE_BADGE_STYLES: Record<StaffRole, string> = {
  RECEPTIONIST: 'bg-blue-50 text-blue-600',
  TRAINER: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600',
};

const avatarColors: Record<StaffRole, string> = {
  TRAINER: 'bg-violet-500',
  RECEPTIONIST: 'bg-amber-500',
};

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  // hasLoaded: una vez que cargamos por primera vez ya nunca mostramos "vacío",
  // mostramos los datos previos del cache. Sin spinners. Sin parpadeo.
  const [hasLoaded, setHasLoaded] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  // Sede activa viene del CONTEXTO GLOBAL (selector en sidebar).
  const branchFilter = useBranchContext((s) => s.activeBranchId);

  const fetchStaff = useCallback(async (bId: string) => {
    try {
      // cachedGet con stale-while-revalidate: si ya está en cache lo devuelve
      // INSTANTÁNEO y refetcha en background.
      const response = await cachedGet<StaffApiResponse>('/api/v1/staff', {
        params: { limit: 50, ...(bId ? { branchId: bId } : {}) },
      });
      setStaff(response.data);
      setHasLoaded(true);
    } catch {
      toast.error('Error al cargar el personal');
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchStaff(branchFilter);
  }, [fetchStaff, branchFilter]);

  const refresh = () => {
    invalidateCache('/api/v1/staff');
    fetchStaff(branchFilter);
  };

  const handleCreate = async (data: StaffFormData) => {
    const payload: Record<string, string> = {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
    };
    if (data.phone) payload.phone = data.phone;
    if (data.branchId) payload.branchId = data.branchId;

    try {
      await api.post('/api/v1/staff', payload);
      toast.success('Personal creado correctamente');
      refresh();
    } catch {
      toast.error('Error al crear el personal');
      throw new Error('Error al crear');
    }
  };

  const handleEdit = async (data: StaffFormData) => {
    if (!editingStaff) return;
    const payload: Record<string, string> = {};
    if (data.firstName) payload.firstName = data.firstName;
    if (data.lastName) payload.lastName = data.lastName;
    if (data.email) payload.email = data.email;
    if (data.phone) payload.phone = data.phone;
    if (data.role) payload.role = data.role;
    if (data.password) payload.password = data.password;
    if (data.branchId !== undefined) payload.branchId = data.branchId;

    try {
      await api.patch(`/api/v1/staff/${editingStaff.id}`, payload);
      toast.success('Personal actualizado');
      setEditingStaff(null);
      refresh();
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/api/v1/staff/${deleteId}`);
      toast.success('Personal eliminado');
      refresh();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="md:space-y-6">
      <div className="reveal-up">
        <Header eyebrow="Equipo" title="Personal" description="Entrenadores y recepcionistas con asignación de sucursal">
          <div className="flex items-center gap-3">
            <BranchContextBadge />
            <button onClick={() => setCreateOpen(true)} className="btn-fire">
              <Plus className="h-4 w-4" strokeWidth={3} /> Agregar personal
            </button>
          </div>
        </Header>
      </div>

      {/* MOBILE header */}
      <div className="md:hidden px-5 pt-2 pb-4 reveal-up">
        <p className="label-athletic text-[var(--gym-orange)]">/ Equipo</p>
        <h1 className="font-display tracking-tight leading-[0.9] mt-2 text-foreground" style={{ fontSize: 'clamp(34px, 9vw, 44px)' }}>
          PERSONAL
        </h1>
      </div>

      {/* Cards de personal — cascada lego.
          - hasLoaded false: render vacío sin skeleton (transición instantánea desde la página anterior)
          - hasLoaded true + 0 staff: empty state
          - hasLoaded true + datos: cards con anim-stagger.
          key fuerza re-animación cuando cambia el set de datos. */}
      {hasLoaded && staff.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground/70 anim-fade">
          No se encontró personal
        </div>
      ) : (
        <div
          key={`staff-${staff.length}`}
          className="px-4 md:px-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 anim-stagger"
        >
          {staff.map((member) => (
            <div
              key={member.id}
              className="bg-card rounded-2xl border border-border p-6 hover:shadow-sm transition-shadow lift"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${avatarColors[member.role]} flex items-center justify-center`}>
                    {member.avatar ? (
                      <img src={member.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-primary-foreground text-base font-bold">
                        {member.firstName[0]}{member.lastName[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-foreground">
                      {member.firstName} {member.lastName}
                    </h3>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditingStaff(member); setEditOpen(true); }}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteId(member.id)}
                    className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium ${ROLE_BADGE_STYLES[member.role]}`}>
                  {ROLE_LABELS[member.role]}
                </span>
                {member.branch?.name && (
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-muted-foreground">
                    {member.branch.name}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-6 pt-4 border-t border-border">
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {(member as { _count?: { members?: number } })._count?.members ?? '—'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Clientes</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-muted-foreground">—</p>
                  <p className="text-[11px] text-muted-foreground">Puntualidad</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <StaffForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
      />

      <StaffForm
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleEdit}
        staff={editingStaff}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="¿Eliminar este personal?"
        description="Esta acción no se puede deshacer."
        onConfirm={handleConfirmDelete}
      />

      {/* FAB móvil */}
      <button onClick={() => setCreateOpen(true)} className="md:hidden mobile-fab" aria-label="Agregar personal">
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>
    </div>
  );
}
