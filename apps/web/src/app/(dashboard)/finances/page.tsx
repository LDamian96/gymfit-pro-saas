'use client';

import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Clock, ArrowUpRight, Plus } from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { PaymentsTable } from './_components/payments-table';
import { PaymentForm } from './_components/payment-form';
import { ClientsEnrollmentList } from './_components/clients-enrollment-list';
import { cachedGet, invalidateCache } from '@/lib/api';

interface FinanceStats {
  totalRevenue: number;
  pendingAmount: number;
  todayAmount: number;
  pendingCount: number;
  todayPaymentCount: number;
}

const FONT = "'Plus Jakarta Sans', Inter, sans-serif";

export default function FinancesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [defaultMemberId, setDefaultMemberId] = useState<string | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<FinanceStats | null>(null);

  useEffect(() => {
    let mounted = true;
    cachedGet<{ data: { totalRevenue: number; pendingAmount: number; pendingCount: number; todayAmount: number; todayPaymentCount: number } }>(
      '/api/v1/dashboard/stats', { ttl: 15_000 },
    ).then((res) => {
      if (!mounted) return;
      setStats({
        totalRevenue: res.data.totalRevenue,
        pendingAmount: res.data.pendingAmount || 0,
        todayAmount: res.data.todayAmount || 0,
        pendingCount: res.data.pendingCount || 0,
        todayPaymentCount: res.data.todayPaymentCount || 0,
      });
    }).catch(() => { /* silencioso */ });
    return () => { mounted = false; };
  }, [refreshKey]);

  const handlePaymentSuccess = () => {
    invalidateCache('/api/v1/dashboard/stats');
    invalidateCache('/api/v1/payments');
    invalidateCache('/api/v1/members');
    setRefreshKey((prev) => prev + 1);
  };

  const openPaymentForMember = (memberId: string) => {
    setDefaultMemberId(memberId);
    setFormOpen(true);
  };

  const openPaymentBlank = () => {
    setDefaultMemberId(undefined);
    setFormOpen(true);
  };

  const statCards = [
    { title: 'Ingresos del Mes', value: stats ? `S/ ${stats.totalRevenue.toLocaleString()}` : '—', sub: '+8% vs mes anterior', icon: TrendingUp, color: 'from-emerald-500 to-teal-600' },
    { title: 'Pendientes', value: stats ? `S/ ${stats.pendingAmount.toLocaleString()}` : '—', sub: stats ? `${stats.pendingCount} pagos` : '', icon: Clock, color: 'from-amber-500 to-orange-600' },
    { title: 'Pagos Hoy', value: stats ? `S/ ${stats.todayAmount.toLocaleString()}` : '—', sub: stats ? `${stats.todayPaymentCount} transacciones` : '', icon: DollarSign, color: 'from-blue-500 to-indigo-600' },
  ];

  return (
    <>
      {/* MOBILE NATIVO — estilo libro contable.
          Tipo legos: cada bloque se ensambla rápido y elegante. */}
      <div className="md:hidden">
        <div className="px-5 pt-2 pb-4 reveal-up">
          <p className="label-athletic text-[var(--gym-orange)]">/ Panel admin</p>
          <h1 className="font-display tracking-tight leading-[0.9] mt-2 text-foreground" style={{ fontSize: 'clamp(34px, 9vw, 44px)' }}>
            MEMBRESÍAS
          </h1>
        </div>

        {/* Encabezado del libro contable — ingresos + 2 sub-totales */}
        <div className="px-4 pb-3 anim-lego" style={{ animationDelay: '50ms' }}>
          <div className="rounded-3xl overflow-hidden" style={{
            background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)',
            boxShadow: '0 14px 28px -10px rgba(255,90,31,0.45)',
          }}>
            {/* Total mes */}
            <div className="relative p-5 overflow-hidden">
              <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl" style={{ background: 'rgba(255,255,255,0.2)' }} />
              <div className="relative flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3 text-white" strokeWidth={3} />
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white opacity-90">Ingresos del mes</span>
                  </div>
                  <p className="text-[34px] font-black leading-none tracking-tight text-white mt-1.5 tabular-nums">
                    {stats ? `S/ ${stats.totalRevenue.toLocaleString()}` : '—'}
                  </p>
                  <p className="text-[10px] font-bold mt-1 text-white opacity-80">+8% vs mes anterior</p>
                </div>
              </div>
            </div>

            {/* Línea separadora estilo factura */}
            <div className="h-px" style={{ background: 'rgba(255,255,255,0.20)' }} />

            {/* Sub-totales: pendiente + hoy */}
            <div className="grid grid-cols-2">
              <div className="p-4 text-white">
                <div className="flex items-center gap-1.5 opacity-80">
                  <Clock className="h-3 w-3" strokeWidth={3} />
                  <span className="text-[9px] font-black uppercase tracking-[0.15em]">Pendientes</span>
                </div>
                <p className="text-[18px] font-black tabular-nums mt-1.5 leading-none">
                  {stats ? `S/ ${stats.pendingAmount.toLocaleString()}` : '—'}
                </p>
                <p className="text-[10px] font-bold mt-1 opacity-70">
                  {stats ? `${stats.pendingCount} ${stats.pendingCount === 1 ? 'pago' : 'pagos'}` : '—'}
                </p>
              </div>
              <div className="p-4 text-white" style={{ borderLeft: '1px solid rgba(255,255,255,0.20)' }}>
                <div className="flex items-center gap-1.5 opacity-80">
                  <DollarSign className="h-3 w-3" strokeWidth={3} />
                  <span className="text-[9px] font-black uppercase tracking-[0.15em]">Hoy</span>
                </div>
                <p className="text-[18px] font-black tabular-nums mt-1.5 leading-none">
                  {stats ? `S/ ${stats.todayAmount.toLocaleString()}` : '—'}
                </p>
                <p className="text-[10px] font-bold mt-1 opacity-70">
                  {stats ? `${stats.todayPaymentCount} ${stats.todayPaymentCount === 1 ? 'transacción' : 'transacciones'}` : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de clientes con estado de matrícula */}
        <ClientsEnrollmentList refreshKey={refreshKey} onRegisterPayment={openPaymentForMember} />

        {/* FAB para registrar pago manual (sin cliente preseleccionado) */}
        <button onClick={openPaymentBlank} className="mobile-fab" aria-label="Registrar pago">
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </div>

      {/* DESKTOP — header instantáneo (lego), stats y tabla animan por dentro */}
      <div className="hidden md:block space-y-6">
        <div className="reveal-up">
          <Header eyebrow="Panel admin" title="Membresías" description="Matrícula de clientes, pagos e ingresos">
            <button onClick={openPaymentBlank} className="btn-fire">
              <DollarSign className="h-4 w-4" /> Registrar pago
            </button>
          </Header>
        </div>

        {/* Stats cards: cascada lego — entran de a una */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 anim-stagger">
          {statCards.map((s) => (
            <div key={s.title} className="bg-card rounded-2xl border border-border p-5 hover:shadow-lg transition-shadow lift">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg`}>
                  <s.icon className="h-5 w-5 text-white" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl md:text-3xl font-black text-foreground">{s.value}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">{s.title}</p>
                <p className="text-[11px] text-muted-foreground">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <PaymentsTable refreshKey={refreshKey} />
      </div>

      <PaymentForm open={formOpen} onOpenChange={setFormOpen} onSuccess={handlePaymentSuccess} defaultMemberId={defaultMemberId} />
    </>
  );
}
