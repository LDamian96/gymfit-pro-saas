'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Banknote, Smartphone, CreditCard, Receipt, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, cachedGet, unwrap, invalidateCache } from '@/lib/api';

interface MemberOption { id: string; firstName: string; lastName: string; email: string; }
interface PlanOption { id: string; name: string; price: number; duration: number; }

type Method = 'CASH' | 'YAPE' | 'BCP' | 'TRANSFER';
interface PaymentEntry { method: Method; amount: number; reference?: string; }

interface PaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultMemberId?: string;
}

type IconCmp = React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>;
const METHOD_OPTIONS: { value: Method; label: string; icon: IconCmp; color: string }[] = [
  { value: 'CASH', label: 'Efectivo', icon: Banknote, color: '#16A34A' },
  { value: 'YAPE', label: 'Yape', icon: Smartphone, color: '#A855F7' },
  { value: 'BCP', label: 'BCP', icon: CreditCard, color: '#F59E0B' },
  { value: 'TRANSFER', label: 'Transferencia', icon: Receipt, color: '#0EA5E9' },
];

export function PaymentForm({ open, onOpenChange, onSuccess, defaultMemberId }: PaymentFormProps) {
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [memberQuery, setMemberQuery] = useState('');
  const [memberId, setMemberId] = useState('');
  const [planId, setPlanId] = useState('');
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [method, setMethod] = useState<Method>('CASH');
  const [amountStr, setAmountStr] = useState('');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [membersRes, plansRes] = await Promise.all([
        cachedGet<{ data: MemberOption[] }>('/api/v1/members', { params: { limit: 200 }, ttl: 30_000 }),
        cachedGet<unknown>('/api/v1/admin/plans', { ttl: 60_000 }),
      ]);
      setMembers(membersRes.data || []);
      const plansData = unwrap<PlanOption[]>(plansRes);
      setPlans(Array.isArray(plansData) ? plansData : []);
    } catch { toast.error('Error al cargar datos'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (open) {
      fetchData();
      setMemberId(defaultMemberId || '');
      setMemberQuery('');
      setPlanId('');
      setPayments([]);
      setMethod('CASH');
      setAmountStr('');
      setReference('');
    }
  }, [open, fetchData, defaultMemberId]);

  const handlePlanChange = (id: string) => {
    setPlanId(id);
    const plan = plans.find((p) => p.id === id);
    // Pre-llenar el monto del próximo pago a agregar con el saldo pendiente.
    if (plan) setAmountStr(String(plan.price));
  };

  const selectedPlan = plans.find((p) => p.id === planId);
  const selectedMember = members.find((m) => m.id === memberId);

  // Filtrar lista por la búsqueda inline (solo se aplica cuando no hay seleccionado).
  const filteredMembers = (() => {
    const q = memberQuery.trim().toLowerCase();
    if (!q || memberId) return members;
    return members.filter((m) =>
      `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(q)
    );
  })();

  const totalPlan = selectedPlan?.price ?? 0;
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const diff = +(paid - totalPlan).toFixed(2);
  const missing = diff < 0 ? Math.abs(diff) : 0;
  const change = diff > 0 ? diff : 0;
  // Solo se considera "completo" cuando pagó al menos el total. Si pagó de más, se permite
  // solo vuelto razonable (efectivo); no permitimos seguir agregando pagos.
  const isComplete = totalPlan > 0 && diff >= -0.001;

  const addPayment = () => {
    if (isComplete) { toast.error('El pago ya está completo'); return; }
    const a = parseFloat(amountStr.replace(',', '.'));
    if (!a || a <= 0) { toast.error('Monto inválido'); return; }
    // Para métodos no-efectivo, NO se permite generar vuelto (no tendría sentido devolver
    // dinero por Yape/transferencia). Limitamos al monto faltante.
    if (method !== 'CASH' && a > missing + 0.001) {
      toast.error(`Por ${method === 'YAPE' ? 'Yape' : method === 'BCP' ? 'BCP' : 'transferencia'} no puede exceder S/ ${missing.toFixed(2)} (lo que falta)`);
      return;
    }
    // Para efectivo permitimos exceder (genera vuelto) pero limitamos a 2× del faltante
    // para evitar typos catastróficos (ej. 90 en lugar de 9).
    if (method === 'CASH' && a > missing * 2 + 0.001 && missing > 0) {
      toast.error(`Monto demasiado alto. Falta solo S/ ${missing.toFixed(2)}`);
      return;
    }
    setPayments([...payments, { method, amount: +a.toFixed(2), reference: reference || undefined }]);
    const newPaid = paid + a;
    const newMissing = totalPlan - newPaid;
    setAmountStr(newMissing > 0.001 ? String(+newMissing.toFixed(2)) : '');
    setReference('');
  };

  const removePayment = (i: number) => {
    setPayments(payments.filter((_, idx) => idx !== i));
  };

  const isValid = memberId && planId && payments.length > 0 && isComplete && selectedPlan;

  const handleSubmit = async () => {
    if (!isValid || !selectedPlan) return;
    setSubmitting(true);
    try {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + selectedPlan.duration * 30);

      // Crear un Payment por cada método. El backend solo soporta uno por request,
      // así que mandamos paralelos.
      await Promise.all(payments.map((p) =>
        api.post('/api/v1/payments', {
          memberId,
          amount: p.amount,
          method: p.method,
          reference: p.reference || `${selectedPlan.name}-${Date.now()}`,
          periodStart: now.toISOString(),
          periodEnd: endDate.toISOString(),
        })
      ));
      invalidateCache('/api/v1/payments');
      invalidateCache('/api/v1/members');
      toast.success(`Pago registrado — ${selectedPlan.name} S/${totalPlan}`);
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string | string[] } } };
      const msg = e.response?.data?.message;
      const text = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al registrar');
      toast.error(text);
    } finally { setSubmitting(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }} onClick={() => onOpenChange(false)}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full md:max-w-[560px] md:rounded-3xl rounded-t-[28px] bg-card border-t md:border border-border flex flex-col"
        style={{ maxHeight: '92vh', boxShadow: '0 -16px 48px -8px rgba(0,0,0,0.40)' }}>

        {/* Drag handle mobile */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="sheet-handle" />
        </div>

        {/* Header */}
        <div className="px-6 pt-4 pb-4 border-b border-border flex items-center justify-between gap-3 shrink-0">
          <div>
            <p className="label-athletic text-[var(--gym-orange)]">/ Membresía</p>
            <h3 className="font-display text-[22px] tracking-tight text-foreground leading-tight">Registrar pago</h3>
          </div>
          <button onClick={() => onOpenChange(false)} className="press w-9 h-9 rounded-xl flex items-center justify-center bg-secondary border border-border">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
            {/* Cliente — autocomplete inline */}
            <div>
              <label className="label-athletic text-muted-foreground mb-2 block">/ Cliente</label>
              {selectedMember ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary border border-border">
                  <div className="w-9 h-9 rounded-xl fire-card flex items-center justify-center">
                    <span className="text-[11px] font-display text-white">{selectedMember.firstName?.[0]}{selectedMember.lastName?.[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold truncate text-foreground">{selectedMember.firstName} {selectedMember.lastName}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{selectedMember.email}</p>
                  </div>
                  <button onClick={() => { setMemberId(''); setMemberQuery(''); }} className="press p-1.5 rounded text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    value={memberQuery}
                    onChange={(e) => setMemberQuery(e.target.value)}
                    placeholder="Buscar cliente por nombre o email…"
                    autoComplete="off"
                    className="w-full px-3.5 py-3 rounded-xl bg-secondary/50 border border-border text-foreground text-[14px] outline-none focus:border-primary focus:bg-secondary transition-colors"
                  />
                  {memberQuery.trim().length >= 1 && (
                    <div className="rounded-xl bg-card border border-border max-h-[180px] overflow-y-auto">
                      {filteredMembers.length === 0 ? (
                        <p className="text-[12px] text-muted-foreground text-center py-3">Sin coincidencias</p>
                      ) : (
                        filteredMembers.slice(0, 8).map((m) => (
                          <button
                            key={m.id}
                            onClick={() => { setMemberId(m.id); setMemberQuery(''); }}
                            className="w-full flex items-center gap-2 p-2.5 hover:bg-secondary/60 text-left border-b border-border last:border-0"
                          >
                            <div className="w-8 h-8 rounded-lg fire-card flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-display text-white">{m.firstName?.[0]}{m.lastName?.[0]}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-bold truncate text-foreground">{m.firstName} {m.lastName}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{m.email}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Plan */}
            <div>
              <label className="label-athletic text-muted-foreground mb-2 block">/ Plan</label>
              <select
                value={planId}
                onChange={(e) => handlePlanChange(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl bg-secondary/50 border border-border text-foreground text-[14px] outline-none focus:border-primary focus:bg-secondary transition-colors"
              >
                <option value="">Seleccionar plan…</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — S/{p.price} · {p.duration === 1 ? '1 mes' : `${p.duration} meses`}</option>
                ))}
              </select>
            </div>

            {/* Resumen del plan */}
            {selectedPlan && (
              <div className="p-4 rounded-2xl glass-card warm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="label-athletic text-[var(--gym-orange)]">/ Total a cobrar</p>
                    <p className="font-display text-[14px] text-muted-foreground mt-1">{selectedPlan.name}</p>
                  </div>
                  <p className="hero-num" style={{ fontSize: '38px', color: 'var(--gym-orange)' }}>S/ {selectedPlan.price}</p>
                </div>
              </div>
            )}

            {/* Sección pagos — solo si hay plan */}
            {selectedPlan && (
              <div className="space-y-3">
                <p className="label-athletic text-muted-foreground">/ ¿Cómo pagó?</p>

                {isComplete ? (
                  /* Mensaje COMPLETO cuando ya se cubrió el total — bloquea agregar más */
                  <div
                    className="p-4 rounded-2xl text-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(132,204,22,0.16), rgba(132,204,22,0.06))',
                      border: '1px solid rgba(132,204,22,0.35)',
                    }}
                  >
                    <p className="label-athletic" style={{ color: 'var(--gym-lime, #84CC16)' }}>/ Pago completo</p>
                    <p className="hero-num tnum mt-2" style={{ fontSize: '32px', color: 'var(--gym-lime, #84CC16)' }}>
                      ✓ S/ {totalPlan.toFixed(2)}
                    </p>
                    <p className="text-[11px] mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {change > 0.001 ? `Vuelto a entregar: S/ ${change.toFixed(2)}` : 'Sin vuelto'}
                    </p>
                    <p className="text-[10px] mt-2 text-muted-foreground">
                      Para ajustar, elimina algún pago de la lista
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Método chips */}
                    <div className="grid grid-cols-4 gap-2">
                      {METHOD_OPTIONS.map((m) => (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => setMethod(m.value)}
                          className="press flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all"
                          style={{
                            background: method === m.value ? `${m.color}1f` : 'transparent',
                            borderColor: method === m.value ? m.color : 'var(--border)',
                          }}
                        >
                          <m.icon className="h-4 w-4" style={{ color: m.color }} strokeWidth={2.5} />
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: method === m.value ? m.color : 'hsl(var(--foreground))' }}>{m.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Monto + Referencia + Add */}
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        max={method === 'CASH' ? undefined : missing.toFixed(2)}
                        value={amountStr}
                        onChange={(e) => setAmountStr(e.target.value)}
                        placeholder={missing > 0 ? `Falta S/ ${missing.toFixed(2)}` : 'Monto S/'}
                        className="w-full px-3.5 py-3 rounded-xl bg-secondary/50 border border-border text-foreground text-[14px] outline-none focus:border-primary focus:bg-secondary transition-colors"
                      />
                      <button
                        type="button"
                        onClick={addPayment}
                        disabled={!amountStr || parseFloat(amountStr) <= 0}
                        className="btn-fire disabled:opacity-40"
                      >
                        <Plus className="h-4 w-4" /> Agregar
                      </button>
                    </div>
                    <input
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="Referencia (opcional · nro Yape, últimos 4 tarjeta…)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground text-[12px] outline-none focus:border-primary focus:bg-secondary transition-colors"
                    />
                  </>
                )}

                {/* Lista de pagos agregados */}
                {payments.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    {payments.map((p, i) => {
                      const opt = METHOD_OPTIONS.find((o) => o.value === p.method)!;
                      return (
                        <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary border border-border">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${opt.color}1f` }}>
                            <opt.icon className="h-4 w-4" style={{ color: opt.color }} strokeWidth={2.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold">{opt.label}</p>
                            {p.reference && <p className="font-code text-[10px] text-muted-foreground truncate">{p.reference}</p>}
                          </div>
                          <span className="font-code text-[14px] font-bold text-foreground tnum">S/ {p.amount.toFixed(2)}</span>
                          <button onClick={() => removePayment(i)} className="press p-1.5 rounded text-muted-foreground hover:text-red-500">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Estado del pago — pagado / falta / vuelto */}
                {payments.length > 0 && (
                  <div className="p-3 rounded-xl bg-secondary/50 border border-border space-y-1">
                    <div className="flex items-baseline justify-between text-[12px]">
                      <span className="text-muted-foreground">Pagado</span>
                      <span className="font-code font-bold tnum">S/ {paid.toFixed(2)}</span>
                    </div>
                    {missing > 0 && (
                      <div className="flex items-baseline justify-between text-[12px]">
                        <span style={{ color: '#EF4444' }}>Falta</span>
                        <span className="font-code font-bold tnum" style={{ color: '#EF4444' }}>S/ {missing.toFixed(2)}</span>
                      </div>
                    )}
                    {change > 0.001 && (
                      <div className="flex items-baseline justify-between text-[12px]">
                        <span style={{ color: 'var(--gym-lime)' }}>Vuelto</span>
                        <span className="font-code font-bold tnum" style={{ color: 'var(--gym-lime)' }}>S/ {change.toFixed(2)}</span>
                      </div>
                    )}
                    {isComplete && (
                      <p className="text-[10px] font-bold uppercase tracking-wider pt-1" style={{ color: 'var(--gym-lime)' }}>
                        ✓ Listo para registrar
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer sticky */}
        {!loading && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0"
            style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
            <button onClick={() => onOpenChange(false)} className="btn-ghost">Cancelar</button>
            <button onClick={handleSubmit} disabled={!isValid || submitting} className="btn-fire disabled:opacity-50">
              {submitting ? 'Registrando…' : 'Registrar pago'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
