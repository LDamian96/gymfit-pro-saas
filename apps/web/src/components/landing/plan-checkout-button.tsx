'use client';

import { useState } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';

interface PlanCheckoutButtonProps {
  planId: string;
  tenantId: string;
  isPopular: boolean;
  label: string;
}

export function PlanCheckoutButton({ planId, tenantId, isPopular, label }: PlanCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState('');

  const handleCheckout = async () => {
    if (!showEmailInput) { setShowEmailInput(true); return; }
    if (!email || !email.includes('@')) return;

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const res = await fetch(`${apiUrl}/api/v1/mercadopago/checkout/${planId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, slug: tenantId }),
      });
      const data = await res.json();
      const url = data.data?.sandboxInitPoint || data.data?.initPoint || data.sandboxInitPoint || data.initPoint;
      if (url) window.location.href = url;
    } catch {
      alert('Error al procesar el pago. Intenta de nuevo.');
    } finally { setLoading(false); }
  };

  // Estilos de botón según contexto (sobre plan popular naranja vs plan normal oscuro).
  const primaryBg = isPopular ? '#0A0B0D' : 'linear-gradient(135deg, var(--gym-orange) 0%, #E63E00 100%)';
  const primaryColor = isPopular ? 'var(--gym-orange)' : '#FFFFFF';
  const inputBg = isPopular ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)';
  const inputBorder = isPopular ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.10)';
  const inputColor = isPopular ? '#0A0B0D' : 'var(--foreground)';
  const cancelColor = isPopular ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.45)';

  if (showEmailInput) {
    return (
      <div className="w-full space-y-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Tu email para el pago"
          className="w-full px-3.5 py-3 rounded-xl text-[13px] outline-none transition-colors"
          style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: inputColor }}
          onKeyDown={(e) => e.key === 'Enter' && handleCheckout()}
          autoFocus
        />
        <button
          onClick={handleCheckout}
          disabled={loading || !email.includes('@')}
          className="press w-full py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          style={{
            background: primaryBg,
            color: primaryColor,
            fontFamily: 'var(--font-archivo-black), system-ui',
            fontSize: '13px',
            letterSpacing: '0.02em',
            boxShadow: isPopular ? '0 8px 24px -8px rgba(0,0,0,0.45)' : '0 8px 24px -8px rgba(255,90,31,0.45)',
          }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? 'PROCESANDO…' : 'PAGAR CON MERCADO PAGO'}
        </button>
        <button
          onClick={() => setShowEmailInput(false)}
          className="press w-full text-[11px] py-1 label-athletic"
          style={{ color: cancelColor }}
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleCheckout}
      className="press w-full py-3.5 rounded-xl inline-flex items-center justify-center gap-2"
      style={{
        background: primaryBg,
        color: primaryColor,
        fontFamily: 'var(--font-archivo-black), system-ui',
        fontSize: '13px',
        letterSpacing: '0.02em',
        boxShadow: isPopular ? '0 8px 24px -8px rgba(0,0,0,0.45)' : '0 8px 24px -8px rgba(255,90,31,0.45)',
      }}
    >
      {label}
      <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
    </button>
  );
}
