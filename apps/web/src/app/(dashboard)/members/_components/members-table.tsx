'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Search, Pencil, Trash2, ChevronLeft, ChevronRight, ChevronDown, Activity } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { toast } from 'sonner';
import { api, cachedGet, invalidateCache } from '@/lib/api';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { MemberProgress } from '@/components/dashboard/member-progress';
import { useBranchContext } from '@/stores/branch-context-store';
import { useAuthStore } from '@/stores/auth-store';

interface Member {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatar: string | null;
  qrCode: string | null;
  membershipType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  membershipStart: string;
  membershipEnd: string;
  isActive: boolean;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  createdAt: string;
}

interface MembersMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface MembersResponse {
  success: boolean;
  data: Member[];
  meta: MembersMeta;
}

interface MembersTableProps {
  refreshKey: number;
  onEdit: (id: string) => void;
}

const membershipLabels: Record<Member['membershipType'], string> = {
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  ANNUAL: 'Anual',
};

const avatarColors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-50 dark:bg-emerald-9500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
function getAvatarColor(name: string) {
  return avatarColors[name.charCodeAt(0) % avatarColors.length];
}

// Días para considerar una membresía "por expirar" (sigue activa hasta vencer).
const EXPIRING_DAYS = 14;

function getMemberStatus(member: Member): 'inactive' | 'expiring' | 'active' {
  const end = new Date(member.membershipEnd);
  if (isPast(end)) return 'inactive';
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + EXPIRING_DAYS);
  if (end <= threshold) return 'expiring';
  return 'active';
}

function StatusBadge({ member }: { member: Member }) {
  const status = getMemberStatus(member);
  if (status === 'inactive') {
    return <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-300">Inactivo</span>;
  }
  if (status === 'expiring') {
    return <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-950 text-amber-600">Por expirar</span>;
  }
  return <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950 text-emerald-600">Activo</span>;
}

export function MembersTable({ refreshKey, onEdit }: MembersTableProps) {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.split(',').map((r) => r.trim()).includes('ADMIN');
  const [members, setMembers] = useState<Member[]>([]);
  const [meta, setMeta] = useState<MembersMeta>({ total: 0, page: 1, limit: 50, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  // Filtro por sede viene del CONTEXTO GLOBAL del sidebar (no local).
  const branchFilter = useBranchContext((s) => s.activeBranchId);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [progressMember, setProgressMember] = useState<{ id: string; name: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchMembers = useCallback(async (page: number, searchQuery: string, status: string, branch: string) => {
    setLoading(true);
    try {
      const statusParam = status === 'all' ? '' : status;
      // Caché 10s: el admin a menudo cambia filtros y vuelve, evita re-pedir lo mismo.
      const response = await cachedGet<MembersResponse>('/api/v1/members', {
        params: { page, limit: 50, search: searchQuery, status: statusParam, branchId: branch || undefined },
        ttl: 10_000,
      });
      setMembers(response.data);
      setMeta(response.meta);
    } catch {
      toast.error('Error al cargar los miembros');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers(meta.page, search, statusFilter, branchFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, statusFilter, branchFilter]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchMembers(1, value, statusFilter, branchFilter);
    }, 300);
  };

  const goToPage = (page: number) => {
    fetchMembers(page, search, statusFilter, branchFilter);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/api/v1/members/${deleteId}`);
      invalidateCache('/api/v1/members');
      toast.success('Miembro eliminado correctamente');
      fetchMembers(meta.page, search, statusFilter, branchFilter);
    } catch {
      toast.error('Error al eliminar el miembro');
    } finally {
      setDeleteId(null);
    }
  };

  // Filtro local por plan
  const filteredMembers = planFilter === 'all'
    ? members
    : members.filter(m => m.membershipType === planFilter);

  // Cuenta totales por estado (basado en la fecha de vencimiento) para el "encabezado del libro".
  // "active" incluye a los que están "por expirar" (siguen vigentes).
  const counters = {
    total: members.length,
    active: members.filter((m) => getMemberStatus(m) !== 'inactive').length,
    expiring: members.filter((m) => getMemberStatus(m) === 'expiring').length,
    inactive: members.filter((m) => getMemberStatus(m) === 'inactive').length,
  };

  return (
    <div className="md:space-y-5">
      {/* ===== MOBILE NATIVO — estilo registro/libro.
          Tipo legos: cada bloque se ensambla con cascada elegante. ===== */}
      <div className="md:hidden">
        {/* Header móvil — estilo dashboard */}
        <div className="px-5 pt-14 pb-3 anim-lego">
          <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Panel admin
          </p>
          <h1 className="text-[28px] font-black tracking-tight mt-1 leading-none">CLIENTES</h1>
        </div>

        {/* Resumen de registros — encabezado del libro */}
        <div className="px-4 pb-3 anim-lego" style={{ animationDelay: '50ms' }}>
          <div className="rounded-3xl p-5 relative overflow-hidden" style={{
            background: 'linear-gradient(135deg, #0A0A0B 0%, #2A2A2E 100%)',
            boxShadow: '0 14px 28px -10px rgba(10,10,11,0.30)',
          }}>
            <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl" style={{ background: 'rgba(255,90,31,0.30)' }} />
            <div className="relative flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Registro general
                </p>
                <p className="text-[40px] font-black leading-none tracking-tight text-white mt-1 tabular-nums">
                  {String(counters.total).padStart(3, '0')}
                </p>
                <p className="text-[10px] font-bold mt-1.5 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Clientes registrados
                </p>
              </div>
              <div className="text-right shrink-0 space-y-1">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#84CC16' }} />
                  <span className="text-[11px] font-black tabular-nums text-white">{counters.active}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.55)' }}>activos</span>
                </div>
                <div className="flex items-center justify-end gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#F59E0B' }} />
                  <span className="text-[11px] font-black tabular-nums text-white">{counters.expiring}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.55)' }}>por expirar</span>
                </div>
                <div className="flex items-center justify-end gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#F43F5E' }} />
                  <span className="text-[11px] font-black tabular-nums text-white">{counters.inactive}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.55)' }}>inactivos</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="px-4 pb-3 anim-lego" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-2 px-3.5 py-3 rounded-2xl"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <Search className="h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <input
              placeholder="Buscar por nombre o email…"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex-1 text-[14px] bg-transparent outline-none"
            />
          </div>
        </div>

        {/* Chips de filtro — el plan funciona como toggle (re-clic deselecciona). */}
        <div className="snap-row px-4 pb-4 anim-lego" style={{ animationDelay: '150ms' }}>
          <button onClick={() => setStatusFilter('all')} className="filter-chip" data-active={statusFilter === 'all'}>Todos</button>
          <button onClick={() => setStatusFilter('active')} className="filter-chip" data-active={statusFilter === 'active'}>Activos</button>
          <button onClick={() => setStatusFilter(statusFilter === 'expiring' ? 'all' : 'expiring')} className="filter-chip" data-active={statusFilter === 'expiring'}>Por expirar</button>
          <button onClick={() => setStatusFilter(statusFilter === 'inactive' ? 'all' : 'inactive')} className="filter-chip" data-active={statusFilter === 'inactive'}>Inactivos</button>
          <span className="w-px h-5 self-center mx-1" style={{ background: 'hsl(var(--border))' }} />
          <button onClick={() => setPlanFilter(planFilter === 'MONTHLY' ? 'all' : 'MONTHLY')} className="filter-chip" data-active={planFilter === 'MONTHLY'}>Mensual</button>
          <button onClick={() => setPlanFilter(planFilter === 'QUARTERLY' ? 'all' : 'QUARTERLY')} className="filter-chip" data-active={planFilter === 'QUARTERLY'}>Trimestral</button>
          <button onClick={() => setPlanFilter(planFilter === 'ANNUAL' ? 'all' : 'ANNUAL')} className="filter-chip" data-active={planFilter === 'ANNUAL'}>Anual</button>
        </div>

        {/* Encabezado del registro */}
        <div className="px-4 mb-2 flex items-center justify-between anim-lego" style={{ animationDelay: '180ms' }}>
          <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Listado · {filteredMembers.length} {filteredMembers.length === 1 ? 'registro' : 'registros'}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-[0.12em]" style={{ color: 'hsl(var(--muted-foreground))' }}>N°</span>
            <span className="text-[9px] font-black uppercase tracking-[0.12em]" style={{ color: 'hsl(var(--muted-foreground))' }}>· Cliente</span>
          </div>
        </div>

        {/* Lista tipo registro — solo se renderiza cuando hay datos.
            Sin skeleton: las cards aparecen directo con animación lego.
            key dinámico fuerza re-animación al cambiar datos. */}
        {!loading && (
        <div className="px-4 anim-lego" style={{ animationDelay: '210ms' }}>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            {filteredMembers.length === 0 ? (
              <div className="py-12 px-6 text-center anim-fade">
                <p className="text-[13px] font-bold" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {search ? 'Sin resultados para tu búsqueda' : 'Sin clientes registrados'}
                </p>
                <p className="text-[11px] mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {search ? 'Prueba con otro nombre o email' : 'Toca el botón + para agregar el primero'}
                </p>
              </div>
            ) : (
              <div className="divide-y anim-stagger" key={`loaded-${filteredMembers.length}-${meta.page}`} style={{ borderColor: 'hsl(var(--border))' }}>
                {filteredMembers.map((member, idx) => {
                  const expired = isPast(new Date(member.membershipEnd));
                  const memberStatus = getMemberStatus(member);
                  const statusLabel = memberStatus === 'inactive' ? 'inactivo' : memberStatus === 'expiring' ? 'por expirar' : 'activo';
                  const statusColor = memberStatus === 'active' ? '#16A34A' : memberStatus === 'expiring' ? '#D97706' : '#EF4444';
                  const statusBg = memberStatus === 'active' ? 'rgba(22,163,74,0.10)' : memberStatus === 'expiring' ? 'rgba(217,119,6,0.10)' : 'rgba(239,68,68,0.10)';
                  const recordNum = String((meta.page - 1) * meta.limit + idx + 1).padStart(3, '0');
                  return (
                    <div key={member.id} className="px-3 py-3 flex items-center gap-3 hover:bg-secondary/30 transition-colors">
                      {/* Número de registro */}
                      <div className="text-center shrink-0 w-10">
                        <p className="text-[10px] font-black tabular-nums leading-none" style={{ color: 'hsl(var(--muted-foreground))' }}>N°</p>
                        <p className="text-[14px] font-black tabular-nums leading-none mt-0.5" style={{ color: '#FF5A1F' }}>{recordNum}</p>
                      </div>

                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-black text-[12px]"
                        style={{ background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)' }}>
                        {member.firstName[0]}{member.lastName[0]}
                      </div>

                      {/* Info cliente */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-black truncate leading-tight">
                          {member.firstName} {member.lastName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {membershipLabels[member.membershipType]}
                          </span>
                          <span style={{ color: 'hsl(var(--muted-foreground))' }}>·</span>
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
                            style={{ background: statusBg, color: statusColor }}>
                            {statusLabel}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold mt-1 tabular-nums" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          Vence: <span style={{ color: expired ? '#EF4444' : 'hsl(var(--foreground))' }}>
                            {format(new Date(member.membershipEnd), 'dd MMM yyyy')}
                          </span>
                        </p>
                      </div>

                      {/* Acciones compactas */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button onClick={() => setProgressMember({ id: member.id, name: `${member.firstName} ${member.lastName}` })}
                          className="press w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          <Activity className="h-4 w-4" />
                        </button>
                        <button onClick={() => onEdit(member.id)}
                          className="press w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteId(member.id)}
                          className="press w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: '#EF4444' }}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Paginación dentro del registro */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--secondary))' }}>
                <p className="text-[10px] font-black uppercase tracking-wider tabular-nums" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} de {meta.total}
                </p>
                <div className="flex items-center gap-1.5">
                  <button disabled={meta.page <= 1} onClick={() => goToPage(meta.page - 1)}
                    className="press w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30"
                    style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-[12px] font-black tabular-nums px-2">
                    {meta.page} <span style={{ color: 'hsl(var(--muted-foreground))' }}>/ {meta.totalPages}</span>
                  </span>
                  <button disabled={meta.page >= meta.totalPages} onClick={() => goToPage(meta.page + 1)}
                    className="press w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30"
                    style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Diálogos compartidos (visibles en mobile) */}
        <ConfirmDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
          title="¿Eliminar este miembro?"
          description="Esta acción no se puede deshacer."
          onConfirm={handleConfirmDelete}
        />

        {progressMember && (
          <MemberProgress
            memberId={progressMember.id}
            memberName={progressMember.name}
            open={!!progressMember}
            onOpenChange={(open) => !open && setProgressMember(null)}
          />
        )}
      </div>

      {/* ===== DESKTOP — animación lego en header + cascada en filas ===== */}
      <div className="hidden md:block">
      <div className="space-y-5">
      {/* Filtros — aparecen al instante (lego rápido) */}
      <div className="flex items-center gap-2.5 anim-lego">
        <div className="flex items-center gap-2 px-3.5 py-2.5 bg-card rounded-lg border border-border w-[280px]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Buscar miembro..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex-1 text-[13px] text-foreground placeholder:text-muted-foreground outline-none bg-transparent"
          />
        </div>
        <div className="relative">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="appearance-none px-3.5 py-2.5 pr-8 bg-card rounded-lg border border-border text-[13px] text-muted-foreground outline-none cursor-pointer"
          >
            <option value="all">Plan ▾</option>
            <option value="MONTHLY">Mensual</option>
            <option value="QUARTERLY">Trimestral</option>
            <option value="ANNUAL">Anual</option>
          </select>
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none px-3.5 py-2.5 pr-8 bg-card rounded-lg border border-border text-[13px] text-muted-foreground outline-none cursor-pointer"
          >
            <option value="all">Estado ▾</option>
            <option value="active">Activos</option>
            <option value="expiring">Por expirar</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
        {/* Filtro de sede ahora es GLOBAL (selector en sidebar) */}
      </div>

      {/* Tabla — header instantáneo, filas en cascada */}
      <div className="bg-card rounded-xl border border-border overflow-hidden anim-lego" style={{ animationDelay: '40ms' }}>
        {/* Desktop Thead */}
        <div className="hidden md:grid grid-cols-[1.5fr_1.5fr_1fr_0.8fr_1fr_0.7fr] px-5 py-3 bg-secondary border-b border-border">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Nombre</span>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Email</span>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Plan</span>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Estado</span>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Vencimiento</span>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide text-right">Acciones</span>
        </div>

        {loading && filteredMembers.length === 0 ? (
          // Sin spinner, sin esqueleto. Solo un mínimo placeholder de altura
          // para que la tabla no salte. Las filas reales aparecen con cascada.
          <div className="h-[280px]" />
        ) : filteredMembers.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground anim-fade">
            No se encontraron clientes
          </div>
        ) : (
          <div className="anim-stagger" key={`rows-${meta.page}-${filteredMembers.length}`}>
          {filteredMembers.map((member) => (
            <div key={member.id} className="border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors">
              {/* Desktop: row */}
              <div className="grid grid-cols-[1.5fr_1.5fr_1fr_0.8fr_1fr_0.7fr] items-center px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full ${getAvatarColor(member.firstName)} flex items-center justify-center shrink-0`}>
                    <span className="text-primary-foreground text-[11px] font-semibold">{member.firstName[0]}{member.lastName[0]}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground truncate">{member.firstName} {member.lastName}</span>
                </div>
                <span className="text-sm text-muted-foreground truncate">{member.email}</span>
                <span className="text-sm text-muted-foreground">{membershipLabels[member.membershipType]}</span>
                <StatusBadge member={member} />
                <span className={`text-sm font-medium ${isPast(new Date(member.membershipEnd)) ? 'text-red-600' : 'text-emerald-600'}`}>
                  {format(new Date(member.membershipEnd), 'dd MMM yyyy')}
                </span>
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => setProgressMember({ id: member.id, name: `${member.firstName} ${member.lastName}` })} className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-secondary" title="Progreso"><Activity className="h-4 w-4" /></button>
                  <button onClick={() => onEdit(member.id)} className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteId(member.id)} className="p-2 text-muted-foreground hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-950">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}

        {/* Paginación */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Mostrando {filteredMembers.length} de {meta.total} miembros
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={meta.page <= 1}
                onClick={() => goToPage(meta.page - 1)}
                className="p-1.5 rounded-lg text-muted-foreground/70 hover:text-foreground/80 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - meta.page) <= 2)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      p === meta.page
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              <button
                disabled={meta.page >= meta.totalPages}
                onClick={() => goToPage(meta.page + 1)}
                className="p-1.5 rounded-lg text-muted-foreground/70 hover:text-foreground/80 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="¿Eliminar este miembro?"
        description="Esta acción no se puede deshacer."
        onConfirm={handleConfirmDelete}
      />

      {progressMember && (
        <MemberProgress
          memberId={progressMember.id}
          memberName={progressMember.name}
          open={!!progressMember}
          onOpenChange={(open) => !open && setProgressMember(null)}
        />
      )}
      </div>
      </div>
    </div>
  );
}
