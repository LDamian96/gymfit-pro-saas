'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Dumbbell } from 'lucide-react';

interface Props {
  show: boolean;
  variant: 'in' | 'out';
  /** Texto principal que se muestra mientras dura la transición. */
  label?: string;
  /** Subtexto motivacional/contextual. */
  hint?: string;
}

/**
 * Overlay full-screen brutal-athletic para login (in) y logout (out).
 * Render con Portal a body para escapar cualquier wrapper con backdrop-filter
 * o transform. Bloquea la interacción mientras navega.
 */
export function AuthTransition({ show, variant, label, hint }: Props) {
  const [mounted, setMounted] = useState(typeof window !== 'undefined');
  useEffect(() => {
    if (!mounted) setMounted(true);
  }, [mounted]);
  if (!mounted || !show) return null;

  const defaultLabel = variant === 'in' ? 'ENTRANDO' : 'HASTA PRONTO';
  const defaultHint = variant === 'in'
    ? 'Calentando tu sesión…'
    : 'Cerrando sesión segura…';

  const node = (
    <div className="fixed inset-0 z-[300] mesh-bg grain auth-transition-overlay" data-variant={variant}>
      <div className="relative h-full w-full flex flex-col items-center justify-center px-8">
        {/* Glow naranja detrás */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-[480px] h-[480px] rounded-full opacity-30 blur-[120px]"
            style={{ background: 'var(--gym-orange)' }} />
        </div>

        <div className="relative flex flex-col items-center text-center">
          {/* Logo con pulso */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center fire-card auth-transition-logo">
            <Dumbbell className="h-8 w-8 text-white" strokeWidth={2.5} />
          </div>

          <p className="label-athletic text-[var(--gym-orange)] mt-6">
            / {variant === 'in' ? 'Acceso' : 'Salida'}
          </p>

          {/* Tipografía display gigante */}
          <h2 className="font-display text-foreground tracking-tight leading-none mt-3 auth-transition-title"
            style={{ fontSize: 'clamp(48px, 9vw, 96px)' }}>
            {label ?? defaultLabel}
          </h2>

          <p className="text-[14px] text-muted-foreground mt-4 auth-transition-hint">
            {hint ?? defaultHint}
          </p>

          {/* Barra de progreso continua — sensación de actividad activa */}
          <div className="relative mt-6 h-1 w-48 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="absolute inset-y-0 left-0 w-1/3 rounded-full auth-progress-bar"
              style={{ background: 'linear-gradient(90deg, transparent 0%, var(--gym-orange) 50%, transparent 100%)' }} />
          </div>

          {/* Dots animados */}
          <div className="flex items-center gap-2 mt-4">
            <span className="auth-dot" />
            <span className="auth-dot" style={{ animationDelay: '0.15s' }} />
            <span className="auth-dot" style={{ animationDelay: '0.3s' }} />
          </div>
        </div>

        {/* Footer brand */}
        <p className="absolute bottom-8 font-code text-[10px] tracking-[0.18em] text-muted-foreground/60">
          GYMFIT · PRO 2026
        </p>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
