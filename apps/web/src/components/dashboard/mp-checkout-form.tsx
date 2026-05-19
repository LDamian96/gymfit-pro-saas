'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, ExternalLink, Copy, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface MpCheckoutFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MpCheckoutForm({ open, onOpenChange }: MpCheckoutFormProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [plansRes, membersRes] = await Promise.all([
        api.get('/api/v1/admin/plans'),
        api.get('/api/v1/members?limit=100'),
      ]);
      setPlans((plansRes as unknown as { data: Plan[] }).data || []);
      setMembers((membersRes as unknown as { data: Member[] }).data || []);
    } catch {
      toast.error('Error al cargar datos');
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchData();
      setCheckoutUrl('');
      setSelectedPlan('');
      setSelectedMember('');
    }
  }, [open, fetchData]);

  const handleGenerate = async () => {
    if (!selectedPlan || !selectedMember) return;
    setLoading(true);
    try {
      const res = await api.post('/api/v1/mercadopago/admin/checkout', {
        planId: selectedPlan,
        memberId: selectedMember,
      });
      const data = res as unknown as { data: { sandboxInitPoint: string; initPoint: string } };
      const url = data.data?.sandboxInitPoint || data.data?.initPoint || (data as unknown as { sandboxInitPoint: string }).sandboxInitPoint || '';
      setCheckoutUrl(url);
      toast.success('Link de pago generado');
    } catch {
      toast.error('Error al generar link de pago');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(checkoutUrl);
    setCopied(true);
    toast.success('Link copiado');
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedPlanData = plans.find((p) => p.id === selectedPlan);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cobrar con Mercado Pago</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Seleccionar miembro */}
          <div>
            <label className="text-sm font-medium text-foreground">Miembro</label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:border-primary/50"
            >
              <option value="">Seleccionar miembro...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName} — {m.email}
                </option>
              ))}
            </select>
          </div>

          {/* Seleccionar plan */}
          <div>
            <label className="text-sm font-medium text-foreground">Plan</label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:border-primary/50"
            >
              <option value="">Seleccionar plan...</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — S/{p.price} ({p.duration === 1 ? '1 mes' : `${p.duration} meses`})
                </option>
              ))}
            </select>
          </div>

          {/* Resumen */}
          {selectedPlanData && selectedMember && (
            <div className="p-4 rounded-xl bg-secondary border border-border">
              <p className="text-sm text-muted-foreground">Total a cobrar</p>
              <p className="text-2xl font-bold text-foreground">S/ {selectedPlanData.price}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedPlanData.name} — {selectedPlanData.duration === 1 ? '1 mes' : `${selectedPlanData.duration} meses`}
              </p>
            </div>
          )}

          {/* Botón generar */}
          {!checkoutUrl && (
            <button
              onClick={handleGenerate}
              disabled={loading || !selectedPlan || !selectedMember}
              className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? 'Generando...' : 'Generar Link de Pago'}
            </button>
          )}

          {/* Link generado */}
          {checkoutUrl && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-2">
                  ¡Link generado! Envíalo al miembro.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white dark:bg-black/20 px-2 py-1.5 rounded truncate text-foreground">
                    {checkoutUrl}
                  </code>
                  <button onClick={copyLink} className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors">
                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-emerald-600" />}
                  </button>
                </div>
              </div>

              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-[#009EE3] text-white font-bold rounded-lg hover:bg-[#0088CC] transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="h-4 w-4" /> Abrir en Mercado Pago
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
