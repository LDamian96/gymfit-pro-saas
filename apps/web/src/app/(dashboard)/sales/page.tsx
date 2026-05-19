'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Receipt, TrendingUp, Banknote, Smartphone, CreditCard, ShoppingCart, User, Calendar, Package, UserCheck, Clock } from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { cachedGet, unwrap } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { BranchFilter } from '@/components/dashboard/branch-filter';

interface SaleItem {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  isMemberPrice: boolean;
  productName: string;
  product?: { name: string; imageUrl: string | null };
}

interface SalePayment {
  id: string;
  method: string;
  amount: number;
  reference: string | null;
}

interface Sale {
  id: string;
  total: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
  notes: string | null;
  customerName: string | null;
  createdAt: string;
  seller: { firstName: string; lastName: string };
  member: { user: { firstName: string; lastName: string } } | null;
  items: SaleItem[];
  payments?: SalePayment[];
}

interface SalesResponse {
  items: Sale[];
  total: number;
  page: number;
  totalPages: number;
  summary: { totalRevenue: number; count: number };
}

type IconCmp = React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>;
const PAYMENT_LABEL: Record<string, { label: string; color: string; Icon: IconCmp }> = {
  CASH: { label: 'Efectivo', color: '#16A34A', Icon: Banknote },
  YAPE: { label: 'Yape', color: '#A855F7', Icon: Smartphone },
  PLIN: { label: 'Plin', color: '#06B6D4', Icon: Smartphone },
  BCP: { label: 'BCP', color: '#F59E0B', Icon: CreditCard },
  CARD: { label: 'Tarjeta', color: '#0EA5E9', Icon: CreditCard },
  OTHER: { label: 'Otro', color: '#737373', Icon: Receipt },
  MIXED: { label: 'Mixto', color: '#FF5A1F', Icon: Receipt },
};

const FONT = "'Plus Jakarta Sans', Inter, sans-serif";

export default function SalesPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<SalesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [expanded, setExpanded] = useState<string | null>(null);
  // Filtro por sede (solo admin lo ve). '' = todas las sucursales.
  const [branchFilter, setBranchFilter] = useState('');

  const isAdmin = user?.role?.split(',').map((r) => r.trim()).includes('ADMIN');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cachedGet<unknown>('/api/v1/sales', {
        params: { from, to, page, limit: 20, branchId: branchFilter || undefined },
        ttl: 15_000,
      });
      setData(unwrap<SalesResponse>(res));
    } catch { setData(null); }
    finally { setLoading(false); }
  }, [from, to, page, branchFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sales = data?.items || [];
  const totalRevenue = data?.summary.totalRevenue || 0;
  const totalCount = data?.summary.count || 0;

  // Desglose por método de pago — preferimos el array `payments` cuando viene (multi-método),
  // si no, caemos al `paymentMethod` simple por toda la venta.
  const breakdown: Record<string, { amount: number; count: number }> = {};
  for (const s of sales) {
    if (s.payments && s.payments.length > 0) {
      for (const p of s.payments) {
        const key = p.method;
        if (!breakdown[key]) breakdown[key] = { amount: 0, count: 0 };
        breakdown[key].amount += p.amount;
        breakdown[key].count += 1;
      }
    } else {
      const key = s.paymentMethod || 'OTHER';
      if (!breakdown[key]) breakdown[key] = { amount: 0, count: 0 };
      breakdown[key].amount += s.total;
      breakdown[key].count += 1;
    }
  }
  const breakdownEntries = Object.entries(breakdown).sort((a, b) => b[1].amount - a[1].amount);

  return (
    <div className="md:space-y-5" style={{ fontFamily: FONT }}>
      <div className="reveal-up">
        <Header
          eyebrow={isAdmin ? 'Panel admin' : 'Mis ventas'}
          title={isAdmin ? 'Todas las ventas' : 'Mis ventas'}
          description={isAdmin ? 'Historial completo del gimnasio' : 'Tus ventas registradas en el sistema'}
        />
      </div>

      {/* MOBILE header */}
      <div className="md:hidden px-5 pt-2 pb-4 reveal-up">
        <p className="label-athletic text-[var(--gym-orange)]">/ {isAdmin ? 'Panel admin' : 'Mis ventas'}</p>
        <h1 className="font-display tracking-tight leading-[0.9] mt-2 text-foreground" style={{ fontSize: 'clamp(34px, 9vw, 44px)' }}>
          VENTAS
        </h1>
      </div>

      {/* Filtros: fechas + sede (sede solo para admin con 2+ sucursales) */}
      <div className="px-4 md:px-0 flex items-center gap-3 flex-wrap mb-3 md:mb-0 anim-lego" style={{ animationDelay: '60ms' }}>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-card border border-border w-full md:w-auto">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="text-sm bg-transparent outline-none flex-1 min-w-0" />
          <span className="text-muted-foreground text-sm">→</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="text-sm bg-transparent outline-none flex-1 min-w-0" />
        </div>
        {isAdmin && <BranchFilter value={branchFilter} onChange={setBranchFilter} />}
      </div>

      {/* Stats cards — cascada lego */}
      <div className="px-4 md:px-0 grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-3 mb-3 md:mb-0 anim-stagger">
        <StatCard icon={TrendingUp} label="Ingresos" value={`S/ ${totalRevenue.toFixed(2)}`} bg="rgba(255,90,31,0.15)" color="#FF5A1F" highlight />
        <StatCard icon={Receipt} label="Ventas" value={String(totalCount)} bg="rgba(34,197,94,0.15)" color="#16A34A" />
        <StatCard icon={ShoppingCart} label="Promedio" value={totalCount > 0 ? `S/ ${(totalRevenue / totalCount).toFixed(2)}` : 'S/ 0'} bg="rgba(168,85,247,0.15)" color="#A855F7" />
      </div>

      {/* Desglose por método de pago — cuánto entró por efectivo, yape, etc. */}
      {breakdownEntries.length > 0 && !loading && (
        <div className="px-4 md:px-0 mb-3 md:mb-0 anim-lego" style={{ animationDelay: '120ms' }}>
          <p className="label-athletic text-muted-foreground mb-2 md:mb-3">/ Ingresos por método</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {breakdownEntries.map(([method, info]) => {
              const opt = PAYMENT_LABEL[method] || PAYMENT_LABEL.OTHER;
              const pct = totalRevenue > 0 ? (info.amount / totalRevenue) * 100 : 0;
              return (
                <div key={method} className="rounded-2xl p-3 md:p-4 bg-card border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${opt.color}1f` }}>
                      <opt.Icon className="h-4 w-4" style={{ color: opt.color }} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold truncate">{opt.label}</p>
                      <p className="text-[9px] text-muted-foreground tabular-nums">{info.count} {info.count === 1 ? 'pago' : 'pagos'}</p>
                    </div>
                  </div>
                  <p className="hero-num tnum" style={{ fontSize: '24px', color: opt.color }}>S/ {info.amount.toFixed(2)}</p>
                  <div className="h-1 mt-2 rounded-full overflow-hidden" style={{ background: 'hsl(var(--secondary))' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: opt.color }} />
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-1 tabular-nums">{pct.toFixed(1)}% del total</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista — sin skeleton, animación lego al llegar datos */}
      {!loading && sales.length === 0 ? (
        <div className="mx-4 md:mx-0 bg-card rounded-2xl border border-border p-12 text-center anim-fade">
          <Receipt className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-bold">Sin ventas en este rango</p>
          <p className="text-sm text-muted-foreground mt-1">Ajusta las fechas o registra una venta</p>
        </div>
      ) : !loading && (
        <div className="mx-4 md:mx-0 bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border anim-stagger" key={`sales-${sales.length}-${page}`}>
          {sales.map((s) => {
            const pay = PAYMENT_LABEL[s.paymentMethod] || PAYMENT_LABEL.OTHER;
            const isOpen = expanded === s.id;
            const customer = s.member
              ? { label: `${s.member.user.firstName} ${s.member.user.lastName}`, type: 'member' as const }
              : s.customerName
                ? { label: s.customerName, type: 'walkin' as const }
                : { label: 'Cliente del mostrador', type: 'anonymous' as const };
            const date = new Date(s.createdAt);
            const itemsCount = s.items.reduce((acc, it) => acc + it.quantity, 0);
            return (
              <div key={s.id}>
                <button onClick={() => setExpanded(isOpen ? null : s.id)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${pay.color}20` }}>
                    <pay.Icon className="h-5 w-5" style={{ color: pay.color }} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-black truncate">{customer.label}</p>
                      {customer.type === 'member' && (
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase shrink-0" style={{ background: 'rgba(22,163,74,0.15)', color: '#16A34A' }}>Miembro</span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>{itemsCount} {itemsCount === 1 ? 'producto' : 'productos'}</span>
                      <span>·</span>
                      <span style={{ color: pay.color }}>{pay.label}</span>
                      {isAdmin && (
                        <>
                          <span>·</span>
                          <span>por <span className="font-black">{s.seller.firstName} {s.seller.lastName}</span></span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[16px] font-black" style={{ color: '#FF5A1F' }}>S/ {s.total.toFixed(2)}</p>
                    <p className="text-[9px] text-muted-foreground flex items-center gap-1 justify-end">
                      <Clock className="h-2.5 w-2.5" />
                      {date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })} · {date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-2 bg-secondary/40 space-y-3">
                    {/* Detalles cabecera */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                      <Detail icon={Calendar} label="Fecha" value={date.toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })} />
                      <Detail icon={Clock} label="Hora" value={date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} />
                      <Detail icon={UserCheck} label="Vendedor" value={`${s.seller.firstName} ${s.seller.lastName}`} />
                      <Detail icon={User} label="Cliente" value={customer.label} />
                    </div>

                    {/* Items con imagen */}
                    <div className="space-y-2">
                      {s.items.map((it) => {
                        const img = it.product?.imageUrl;
                        return (
                          <div key={it.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-card border border-border">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-secondary">
                              {img ? (
                                <Image src={img} alt={it.productName} fill className="object-cover" sizes="48px" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground/30" /></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-black truncate">{it.product?.name || it.productName}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,90,31,0.15)', color: '#FF5A1F' }}>
                                  ×{it.quantity}
                                </span>
                                <span className="text-[10px] text-muted-foreground">@ S/ {it.unitPrice.toFixed(2)} c/u</span>
                                {it.isMemberPrice && (
                                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase" style={{ background: 'rgba(22,163,74,0.15)', color: '#16A34A' }}>Precio miembro</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Subtotal</p>
                              <p className="text-[15px] font-black">S/ {it.subtotal.toFixed(2)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagos (si hay desglose) */}
                    {s.payments && s.payments.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Pagos ({s.payments.length})</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                          {s.payments.map((pmt) => {
                            const po = PAYMENT_LABEL[pmt.method] || PAYMENT_LABEL.OTHER;
                            return (
                              <div key={pmt.id} className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border">
                                <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: `${po.color}20` }}>
                                  <po.Icon className="h-3.5 w-3.5" style={{ color: po.color }} strokeWidth={2.5} />
                                </div>
                                <span className="text-[11px] font-black flex-1">{po.label}</span>
                                <span className="text-[12px] font-black">S/ {pmt.amount.toFixed(2)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Total + vuelto */}
                    <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(255,90,31,0.08), rgba(255,90,31,0.02))', border: '1px solid rgba(255,90,31,0.2)' }}>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Total · Pagado · Vuelto</p>
                        <div className="flex items-baseline gap-2 text-[11px] flex-wrap">
                          <span>S/ {s.total.toFixed(2)} total</span>
                          {s.paidAmount > 0 && <span className="text-muted-foreground">· S/ {s.paidAmount.toFixed(2)} pagado</span>}
                          {s.changeAmount > 0.001 && <span className="font-black" style={{ color: '#16A34A' }}>· S/ {s.changeAmount.toFixed(2)} vuelto</span>}
                        </div>
                        {s.notes && <p className="text-[10px] text-muted-foreground italic mt-1 max-w-xs truncate">&ldquo;{s.notes}&rdquo;</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-[24px] font-black leading-none" style={{ color: '#FF5A1F' }}>S/ {s.total.toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">vía {pay.label}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-4 py-2 rounded-lg bg-card border border-border text-sm font-bold disabled:opacity-40">Anterior</button>
          <span className="px-4 py-2 text-sm">Página {page} de {data.totalPages}</span>
          <button disabled={page === data.totalPages} onClick={() => setPage(page + 1)} className="px-4 py-2 rounded-lg bg-card border border-border text-sm font-bold disabled:opacity-40">Siguiente</button>
        </div>
      )}
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon: IconCmp; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={2.5} />
      <div className="min-w-0">
        <p className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-[11px] font-black truncate">{value}</p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, bg, color, highlight }: { icon: IconCmp; label: string; value: string; bg: string; color: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 border ${highlight ? '' : 'border-border bg-card'}`}
      style={highlight ? { background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)', borderColor: 'transparent', boxShadow: '0 8px 24px rgba(255,90,31,0.25)' } : {}}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3`} style={{ background: highlight ? 'rgba(255,255,255,0.2)' : bg }}>
        <Icon className="h-5 w-5" style={{ color: highlight ? '#FFF' : color }} strokeWidth={2.5} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: highlight ? 'rgba(255,255,255,0.85)' : 'hsl(var(--muted-foreground))' }}>{label}</p>
      <p className="text-[22px] font-black leading-none mt-1" style={{ color: highlight ? '#FFF' : 'hsl(var(--foreground))' }}>{value}</p>
    </div>
  );
}
