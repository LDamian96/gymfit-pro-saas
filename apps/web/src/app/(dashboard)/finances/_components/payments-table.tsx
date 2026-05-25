'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Check, X, ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { api, cachedGet, invalidateCache } from '@/lib/api';
import { useBranchContext } from '@/stores/branch-context-store';

type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';
type PaymentMethod = 'YAPE' | 'BCP' | 'CASH' | 'TRANSFER';

interface PaymentMember {
  firstName: string;
  lastName: string;
  email: string;
}

interface Payment {
  id: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  proofUrl: string | null;
  status: PaymentStatus;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  member: PaymentMember;
}

interface PaymentsMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PaymentsResponse {
  success: boolean;
  data: Payment[];
  meta: PaymentsMeta;
}

interface PaymentsTableProps {
  refreshKey: number;
}

const statusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  CONFIRMED: { label: 'Pagado', className: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300' },
  PENDING: { label: 'Pendiente', className: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300' },
  REJECTED: { label: 'Vencido', className: 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-300' },
};

const methodLabels: Record<PaymentMethod, string> = {
  YAPE: 'Yape',
  BCP: 'BCP',
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
};

const methodColors: Record<PaymentMethod, string> = {
  YAPE: '#A855F7',
  BCP: '#F59E0B',
  CASH: '#16A34A',
  TRANSFER: '#0EA5E9',
};

function formatAmount(amount: number): string {
  return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function PaymentsTable({ refreshKey }: PaymentsTableProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [meta, setMeta] = useState<PaymentsMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  // Sede activa del contexto global del sidebar.
  const branchFilter = useBranchContext((s) => s.activeBranchId);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 10 };
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (branchFilter) params.branchId = branchFilter;

      const data = await cachedGet<PaymentsResponse>('/api/v1/payments', { params, ttl: 10_000 });
      setPayments(data.data);
      setMeta(data.meta);
    } catch {
      toast.error('Error al cargar los pagos');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, branchFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments, refreshKey]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const handleStatusChange = async (paymentId: string, newStatus: PaymentStatus) => {
    setActionLoading(paymentId);
    try {
      await api.patch(`/api/v1/payments/${paymentId}/status`, { status: newStatus });
      invalidateCache('/api/v1/payments');
      invalidateCache('/api/v1/dashboard/stats');
      toast.success(newStatus === 'CONFIRMED' ? 'Pago confirmado' : 'Pago rechazado');
      await fetchPayments();
    } catch {
      toast.error('Error al actualizar el estado');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
    {/* MOBILE NATIVO — estilo libro contable / asientos */}
    <div className="md:hidden">
      {/* Chips de estado */}
      <div className="snap-row px-4 pb-3 anim-slide-up" style={{ animationDelay: '80ms' }}>
        <button onClick={() => setStatusFilter('all')} className="filter-chip" data-active={statusFilter === 'all'}>Todos</button>
        <button onClick={() => setStatusFilter('PENDING')} className="filter-chip" data-active={statusFilter === 'PENDING'}>Pendientes</button>
        <button onClick={() => setStatusFilter('CONFIRMED')} className="filter-chip" data-active={statusFilter === 'CONFIRMED'}>Confirmados</button>
        <button onClick={() => setStatusFilter('REJECTED')} className="filter-chip" data-active={statusFilter === 'REJECTED'}>Rechazados</button>
      </div>

      <div className="px-4 anim-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="rounded-2xl overflow-hidden" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          {loading ? (
            <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
              {[...Array(5)].map((_, i) => <div key={i} className="h-[80px] skeleton-shimmer" />)}
            </div>
          ) : payments.length === 0 ? (
            <div className="py-12 px-6 text-center">
              <p className="text-[13px] font-bold" style={{ color: 'hsl(var(--muted-foreground))' }}>No hay pagos registrados</p>
              <p className="text-[11px] mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Toca el botón + para registrar el primero</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
              {payments.map((payment, idx) => {
                const isExpired = new Date(payment.periodEnd) < new Date();
                const statusColor = payment.status === 'CONFIRMED' ? '#16A34A' : payment.status === 'PENDING' ? '#CA8A04' : '#EF4444';
                const statusBg = payment.status === 'CONFIRMED' ? 'rgba(22,163,74,0.10)' : payment.status === 'PENDING' ? 'rgba(202,138,4,0.10)' : 'rgba(239,68,68,0.10)';
                const recordNum = String((page - 1) * 10 + idx + 1).padStart(4, '0');
                const date = new Date(payment.createdAt);
                return (
                  <div key={payment.id} className="hover:bg-secondary/30 transition-colors">
                    {/* Asiento principal */}
                    <div className="px-3 py-3 flex items-center gap-3">
                      {/* Recibo + fecha */}
                      <div className="text-center shrink-0 w-12">
                        <p className="text-[8px] font-black uppercase tracking-wider leading-none" style={{ color: 'hsl(var(--muted-foreground))' }}>Recibo</p>
                        <p className="text-[12px] font-black tabular-nums leading-none mt-0.5" style={{ color: '#FF5A1F' }}>{recordNum}</p>
                        <p className="text-[8px] font-bold tabular-nums leading-none mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {format(date, 'dd MMM')}
                        </p>
                      </div>

                      {/* Avatar + cliente */}
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-black text-[11px]"
                        style={{ background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)' }}>
                        {payment.member.firstName[0]}{payment.member.lastName[0]}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-black truncate leading-tight">
                          {payment.member.firstName} {payment.member.lastName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
                            style={{ background: `${methodColors[payment.method]}1f`, color: methodColors[payment.method] }}>
                            {methodLabels[payment.method]}
                          </span>
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
                            style={{ background: statusBg, color: statusColor }}>
                            {statusConfig[payment.status].label}
                          </span>
                        </div>
                      </div>

                      {/* Monto + tipo (haber) */}
                      <div className="text-right shrink-0">
                        <p className="text-[9px] font-black uppercase tracking-wider leading-none" style={{ color: 'hsl(var(--muted-foreground))' }}>Haber</p>
                        <p className="text-[15px] font-black tabular-nums leading-none mt-1" style={{ color: payment.status === 'CONFIRMED' ? '#16A34A' : 'hsl(var(--foreground))' }}>
                          {formatAmount(payment.amount)}
                        </p>
                      </div>
                    </div>

                    {/* Línea de detalle: vencimiento + acciones (solo si pendiente o vencido) */}
                    {(payment.status === 'PENDING' || isExpired) && (
                      <div className="px-3 pb-3 flex items-center justify-between gap-2">
                        <p className="text-[10px] font-bold tabular-nums" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          Vence:&nbsp;
                          <span style={{ color: isExpired ? '#EF4444' : '#16A34A' }} className="font-black">
                            {format(new Date(payment.periodEnd), 'dd MMM yyyy')}
                          </span>
                        </p>
                        {payment.status === 'PENDING' && (
                          <div className="flex gap-1.5">
                            <button onClick={() => handleStatusChange(payment.id, 'CONFIRMED')} disabled={actionLoading === payment.id}
                              className="press inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider"
                              style={{ background: 'rgba(22,163,74,0.12)', color: '#16A34A' }}>
                              <Check className="h-3 w-3" strokeWidth={3} /> Aprobar
                            </button>
                            <button onClick={() => handleStatusChange(payment.id, 'REJECTED')} disabled={actionLoading === payment.id}
                              className="press inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider"
                              style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>
                              <X className="h-3 w-3" strokeWidth={3} /> Rechazar
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Paginación dentro del libro */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--secondary))' }}>
              <p className="text-[10px] font-black uppercase tracking-wider tabular-nums" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {(page - 1) * 10 + 1}–{Math.min(page * 10, meta.total)} de {meta.total}
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
    </div>

    {/* DESKTOP — header instantáneo + filas en cascada lego */}
    <div className="hidden md:block bg-card rounded-2xl border border-border overflow-hidden anim-lego">
      {/* Header tabla */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-[15px] text-foreground">Últimos Pagos</h3>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg border border-border w-[200px]">
            <Search className="h-3.5 w-3.5 text-[#A1A1AA]" />
            <input
              placeholder="Buscar pago..."
              className="flex-1 text-[12px] text-foreground placeholder:text-[#A1A1AA] outline-none bg-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none px-3 py-2 bg-card rounded-lg border border-border text-[12px] text-muted-foreground outline-none cursor-pointer"
          >
            <option value="all">Este mes ▾</option>
            <option value="PENDING">Pendientes</option>
            <option value="CONFIRMED">Confirmados</option>
            <option value="REJECTED">Rechazados</option>
          </select>
        </div>
      </div>

      {/* Desktop Thead */}
      <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr_0.7fr_0.6fr] px-5 py-2.5 bg-secondary">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Cliente / Monto</span>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Método</span>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Inscripción</span>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Vencimiento</span>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Estado</span>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide text-right">Acciones</span>
      </div>

      {loading && payments.length === 0 ? (
        // Sin "Cargando..." — solo placeholder de altura para no saltar
        <div className="h-[280px]" />
      ) : payments.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground anim-fade">No hay pagos registrados</div>
      ) : (
        <div className="anim-stagger" key={`pay-rows-${page}-${payments.length}`}>
        {payments.map((payment) => {
          const isExpired = new Date(payment.periodEnd) < new Date();
          return (
          <div key={payment.id} className="border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors">
            {/* Desktop */}
            <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr_0.7fr_0.6fr] items-center px-5 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{payment.member.firstName} {payment.member.lastName}</p>
                <p className="text-xs text-muted-foreground">{formatAmount(payment.amount)}</p>
              </div>
              <span
                className="inline-flex w-fit px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{ background: `${methodColors[payment.method]}1f`, color: methodColors[payment.method] }}
              >
                {methodLabels[payment.method]}
              </span>
              <span className="text-xs text-muted-foreground">{format(new Date(payment.createdAt), 'dd MMM yyyy')}</span>
              <span className={`text-xs font-semibold ${isExpired ? 'text-red-500' : 'text-emerald-600'}`}>{format(new Date(payment.periodEnd), 'dd MMM yyyy')}</span>
              <span className={`inline-flex w-fit px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusConfig[payment.status].className}`}>{statusConfig[payment.status].label}</span>

              {/* Acciones desktop */}
              <div className="flex items-center justify-end gap-1">
                {payment.status === 'PENDING' ? (
                  <>
                    <button onClick={() => handleStatusChange(payment.id, 'CONFIRMED')} disabled={actionLoading === payment.id} className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg disabled:opacity-40"><Check className="h-4 w-4" /></button>
                    <button onClick={() => handleStatusChange(payment.id, 'REJECTED')} disabled={actionLoading === payment.id} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg disabled:opacity-40"><X className="h-4 w-4" /></button>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground/50">—</span>
                )}
              </div>
            </div>
          </div>
          );
        })}
        </div>
      )}

      {/* Paginación */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <p className="text-xs text-[#A1A1AA]">
            Mostrando {payments.length} de {meta.total} pagos
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg text-muted-foreground/70 hover:text-foreground/80 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-muted-foreground px-2">{meta.page} / {meta.totalPages}</span>
            <button
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              className="p-1.5 rounded-lg text-muted-foreground/70 hover:text-foreground/80 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
