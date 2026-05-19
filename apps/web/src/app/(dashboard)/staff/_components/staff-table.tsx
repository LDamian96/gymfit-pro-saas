'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { staggerContainer, staggerItem } from '@/animations/variants';
import { StaffForm } from './staff-form';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

// Tipos del personal
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
  createdAt: string;
}

interface StaffFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: StaffRole;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface StaffApiResponse {
  success: boolean;
  data: StaffMember[];
  meta: PaginationMeta;
}

// Mapa de roles a español
const ROLE_LABELS: Record<StaffRole, string> = {
  RECEPTIONIST: 'Recepcionista',
  TRAINER: 'Entrenador',
};

// Colores de badge por rol
const ROLE_BADGE_STYLES: Record<StaffRole, string> = {
  RECEPTIONIST: 'bg-blue-50 text-blue-700 border-blue-200',
  TRAINER: 'bg-purple-50 text-purple-700 border-purple-200',
};

// Filtros de rol disponibles
type RoleFilter = 'ALL' | StaffRole;

interface RoleFilterOption {
  value: RoleFilter;
  label: string;
}

const ROLE_FILTERS: RoleFilterOption[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'RECEPTIONIST', label: 'Recepcionistas' },
  { value: 'TRAINER', label: 'Entrenadores' },
];

export function StaffTable() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [loading, setLoading] = useState(true);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Estado del formulario de edición
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Obtener personal del servidor
  const fetchStaff = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        search,
      });
      if (roleFilter !== 'ALL') {
        params.set('role', roleFilter);
      }

      const res = await api.get(`/api/v1/staff?${params.toString()}`);
      const response = res as unknown as StaffApiResponse;
      setStaff(response.data);
      setMeta(response.meta);
    } catch {
      toast.error('Error al cargar el personal');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  // Recargar cuando cambian filtros
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchStaff(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [fetchStaff]);

  // Eliminar personal
  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/api/v1/staff/${deleteId}`);
      toast.success('Personal eliminado correctamente');
      fetchStaff(meta.page);
    } catch {
      toast.error('Error al eliminar el personal');
    } finally {
      setDeleteId(null);
    }
  };

  // Abrir formulario de edición
  const handleEdit = (member: StaffMember) => {
    setEditingStaff(member);
    setEditDialogOpen(true);
  };

  // Enviar edición
  const handleEditSubmit = async (data: StaffFormData) => {
    if (!editingStaff) return;

    // Construir payload sin campos vacíos
    const payload: Record<string, string> = {};
    if (data.firstName) payload.firstName = data.firstName;
    if (data.lastName) payload.lastName = data.lastName;
    if (data.email) payload.email = data.email;
    if (data.phone) payload.phone = data.phone;
    if (data.role) payload.role = data.role;
    if (data.password) payload.password = data.password;

    try {
      await api.patch(`/api/v1/staff/${editingStaff.id}`, payload);
      toast.success('Personal actualizado correctamente');
      setEditingStaff(null);
      fetchStaff(meta.page);
    } catch {
      toast.error('Error al actualizar el personal');
    }
  };

  // Obtener iniciales para avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Barra de filtros */}
      <div className="flex items-center justify-between gap-4">
        {/* Filtros de rol */}
        <div className="flex items-center gap-2">
          {ROLE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setRoleFilter(filter.value)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                roleFilter === filter.value
                  ? 'bg-foreground text-white'
                  : 'bg-secondary text-muted-foreground hover:bg-muted'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
          <Input
            placeholder="Buscar personal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-[260px] h-9 text-sm bg-card"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[13px] font-semibold text-muted-foreground">Personal</TableHead>
              <TableHead className="text-[13px] font-semibold text-muted-foreground">Teléfono</TableHead>
              <TableHead className="text-[13px] font-semibold text-muted-foreground">Rol</TableHead>
              <TableHead className="text-[13px] font-semibold text-muted-foreground">Estado</TableHead>
              <TableHead className="text-[13px] font-semibold text-muted-foreground">Fecha de ingreso</TableHead>
              <TableHead className="text-[13px] font-semibold text-muted-foreground w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="wait">
              {loading ? (
                // Skeleton de carga dentro de la tabla
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell colSpan={6}>
                      <div className="h-10 bg-secondary rounded animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))
              ) : staff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground/70">
                    No se encontró personal
                  </TableCell>
                </TableRow>
              ) : (
                <motion.tbody
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="contents"
                >
                  {staff.map((member) => (
                    <motion.tr
                      key={member.id}
                      variants={staggerItem}
                      className="border-b last:border-b-0 hover:bg-secondary/50 transition-colors"
                    >
                      {/* Nombre y email */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={member.avatar ?? undefined} />
                            <AvatarFallback className="bg-secondary text-muted-foreground text-xs font-medium">
                              {getInitials(member.firstName, member.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-[13px] font-medium text-foreground">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-[12px] text-muted-foreground/70">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Teléfono */}
                      <TableCell className="text-[13px] text-muted-foreground">
                        {member.phone ?? '—'}
                      </TableCell>

                      {/* Rol */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-medium ${ROLE_BADGE_STYLES[member.role]}`}
                        >
                          {ROLE_LABELS[member.role]}
                        </Badge>
                      </TableCell>

                      {/* Estado */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              member.isActive ? 'bg-emerald-500' : 'bg-zinc-300'
                            }`}
                          />
                          <span className="text-[13px] text-muted-foreground">
                            {member.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </TableCell>

                      {/* Fecha */}
                      <TableCell className="text-[13px] text-muted-foreground">
                        {formatDate(member.createdAt)}
                      </TableCell>

                      {/* Acciones */}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-secondary transition-colors"
                          >
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground/70" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(member)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteId(member.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </motion.tbody>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-[13px] text-muted-foreground/70">
            Mostrando {staff.length} de {meta.total} registros
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => fetchStaff(meta.page - 1)}
              className="h-8"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <span className="text-[13px] text-muted-foreground px-2">
              {meta.page} / {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => fetchStaff(meta.page + 1)}
              className="h-8"
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="¿Eliminar este personal?"
        description="Esta acción no se puede deshacer."
        onConfirm={handleConfirmDelete}
      />

      {/* Diálogo de edición */}
      <StaffForm
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleEditSubmit}
        staff={editingStaff}
      />
    </div>
  );
}
