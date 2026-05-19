'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search, Check, AlertCircle, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { cachedGet } from '@/lib/api';
import { BranchFilter } from '@/components/dashboard/branch-filter';
import { useAuthStore } from '@/stores/auth-store';

interface MemberRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  membershipType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  membershipStart: string;
  membershipEnd: string;
  isActive: boolean;
  createdAt: string;
}

interface MembersResponse {
  data: MemberRow[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const PLAN_LABELS: Record<MemberRow['membershipType'], string> = {
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  ANNUAL: 'Anual',
};

type FilterKey = 'all' | 'enrolled' | 'unenrolled';

interface Props {
  refreshKey: number;
  onRegisterPayment: (memberId: string) => void;
}

export function ClientsEnrollmentList({ refreshKey, onRegisterPayment }: Props) {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.split(',').map((r) => r.trim()).includes('ADMIN');
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<MembersResponse['meta']>({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  // Filtro por sede (solo admin con 2+ sedes lo ve). '' = todas.
  const [branchFilter, setBranchFilter] = useState('');

  // Carga clientes — server-side search para incluir TODOS los que coinciden,
  // no solo los del page actual.
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    cachedGet<MembersResponse>('/api/v1/members', {
      params: {
        page,
        limit: 200,
        search,
        branchId: branchFilter || undefined,
        // Si filtro = unenrolled, pedimos a backend "inactive" (vencidos) — el isEnrolled local refina.
      },
      ttl: 10_000,
    }).then((res) => {
      if (!mounted) return;
      setMembers(res.data || []);
      setMeta(res.meta);
    }).catch(() => { if (mounted) setMembers([]); })
    .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [refreshKey, page, search, branchFilter]);

  // Determina si un cliente está MATRICULADO
  // = isActive && tiene membershipEnd vigente (no pasada)
  const isEnrolled = (m: MemberRow) => m.isActive && !isPast(new Date(m.membershipEnd));

  // Aplica filtro + búsqueda local
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      if (filter === 'enrolled' && !isEnrolled(m)) return false;
      if (filter === 'unenrolled' && isEnrolled(m)) return false;
      if (q) {
        const full = `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase();
        if (!full.includes(q)) return false;
      }
      return true;
    });
  }, [members, filter, search]);

  // Contadores para el encabezado
  const counters = useMemo(() => ({
    total: members.length,
    enrolled: members.filter(isEnrolled).length,
    unenrolled: members.filter((m) => !isEnrolled(m)).length,
  }), [members]);

  return (
    <div>
      {/* Búsqueda + filtro sede */}
      <div className="px-4 pb-3 anim-lego flex items-center gap-2" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center gap-2 px-3.5 py-3 rounded-2xl flex-1 min-w-0"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <Search className="h-4 w-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <input
            placeholder="Buscar cliente por nombre o email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-[14px] bg-transparent outline-none min-w-0"
          />
        </div>
        {isAdmin && <BranchFilter value={branchFilter} onChange={setBranchFilter} />}
      </div>

      {/* Chips simplificados */}
      <div className="snap-row px-4 pb-3 anim-lego" style={{ animationDelay: '150ms' }}>
        <button onClick={() => setFilter('all')} className="filter-chip" data-active={filter === 'all'}>
          Todos · {counters.total}
        </button>
        <button onClick={() => setFilter('enrolled')} className="filter-chip" data-active={filter === 'enrolled'}>
          Matriculados · {counters.enrolled}
        </button>
        <button onClick={() => setFilter('unenrolled')} className="filter-chip" data-active={filter === 'unenrolled'}>
          Sin matricular · {counters.unenrolled}
        </button>
      </div>

      {/* Encabezado del registro */}
      <div className="px-5 mb-2 flex items-center justify-between anim-lego" style={{ animationDelay: '180ms' }}>
        <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {filter === 'enrolled' ? 'Matriculados activos' : filter === 'unenrolled' ? 'Pendientes de matrícula' : 'Listado de clientes'}
        </p>
        <p className="text-[10px] font-black uppercase tracking-[0.15em] tabular-nums" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {filtered.length} {filtered.length === 1 ? 'registro' : 'registros'}
        </p>
      </div>

      {/* Lista — solo se renderiza cuando hay datos. Sin skeleton.
          Las cards aparecen directo con animación lego stagger. */}
      {!loading && (
      <div className="px-4 anim-lego" style={{ animationDelay: '210ms' }}>
        <div className="rounded-2xl overflow-hidden" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          {filtered.length === 0 ? (
            <div className="py-12 px-6 text-center anim-fade">
              <p className="text-[13px] font-bold" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {search ? 'Sin resultados para tu búsqueda' : filter === 'unenrolled' ? '¡Todos están matriculados!' : 'Sin clientes en esta vista'}
              </p>
              <p className="text-[11px] mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {filter === 'unenrolled' ? 'Cuando crees nuevos clientes aparecerán aquí' : 'Prueba con otro nombre o cambia el filtro'}
              </p>
            </div>
          ) : (
            <div className="divide-y anim-stagger" key={`loaded-${filter}-${filtered.length}-${page}`} style={{ borderColor: 'hsl(var(--border))' }}>
              {filtered.map((m, idx) => {
                const enrolled = isEnrolled(m);
                const expired = m.isActive && isPast(new Date(m.membershipEnd));
                const recordNum = String(idx + 1).padStart(3, '0');
                return (
                  <div key={m.id} className="px-3 py-3 flex items-center gap-3 hover:bg-secondary/30 transition-colors">
                    {/* N° */}
                    <div className="text-center shrink-0 w-10">
                      <p className="text-[8px] font-black uppercase tracking-wider leading-none" style={{ color: 'hsl(var(--muted-foreground))' }}>N°</p>
                      <p className="text-[12px] font-black tabular-nums leading-none mt-0.5" style={{ color: '#FF5A1F' }}>{recordNum}</p>
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-black text-[12px]"
                      style={{ background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)' }}>
                      {m.firstName[0]}{m.lastName[0]}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-black truncate leading-tight">
                        {m.firstName} {m.lastName}
                      </p>
                      <p className="text-[10px] truncate mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {m.email}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {enrolled ? (
                          <>
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
                              style={{ background: 'rgba(22,163,74,0.10)', color: '#16A34A' }}>
                              <Check className="h-2.5 w-2.5" strokeWidth={3} />
                              Matriculado
                            </span>
                            <span className="text-[9px] font-bold tabular-nums" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {PLAN_LABELS[m.membershipType]} · vence {format(new Date(m.membershipEnd), 'dd MMM')}
                            </span>
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
                            style={{ background: expired ? 'rgba(239,68,68,0.10)' : 'rgba(202,138,4,0.12)', color: expired ? '#EF4444' : '#CA8A04' }}>
                            <AlertCircle className="h-2.5 w-2.5" strokeWidth={3} />
                            {expired ? 'Vencido' : 'Sin matricular'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Acción matricular si no enrolled */}
                    {!enrolled ? (
                      <button onClick={() => onRegisterPayment(m.id)}
                        className="press inline-flex items-center gap-1 px-3 py-2 rounded-xl text-white text-[10px] font-black uppercase tracking-wider shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)',
                          boxShadow: '0 4px 10px -2px rgba(255,90,31,0.45)',
                        }}>
                        <Plus className="h-3 w-3" strokeWidth={3} />
                        Matricular
                      </button>
                    ) : (
                      <button onClick={() => onRegisterPayment(m.id)}
                        className="press inline-flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0"
                        style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}>
                        Renovar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Paginación */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--secondary))' }}>
              <p className="text-[10px] font-black uppercase tracking-wider tabular-nums" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {(page - 1) * meta.limit + 1}–{Math.min(page * meta.limit, meta.total)} de {meta.total}
              </p>
              <div className="flex items-center gap-1.5">
                <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="press w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-[12px] font-black tabular-nums px-2">
                  {meta.page} <span style={{ color: 'hsl(var(--muted-foreground))' }}>/ {meta.totalPages}</span>
                </span>
                <button disabled={page >= meta.totalPages} onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
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
    </div>
  );
}
