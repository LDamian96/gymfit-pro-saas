'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';

const MESSAGES = [
  'A romper récords. ¡Buen entrenamiento!',
  'Estás en la zona. Vamos con todo.',
  'Otra sesión que cuenta. ¡Forja tu PR!',
  'Disciplina diaria = resultados reales.',
  'Tu yo del futuro te lo agradece.',
  'Hoy te ganas el día. ¡A entrenar!',
  'Constancia mata talento. Sigamos.',
];

/**
 * Polea el último check-in del usuario actual. Cuando detecta uno nuevo
 * (< 30 segundos atrás y no se ha notificado), muestra un toaster motivacional.
 * Solo activo para usuarios CLIENT.
 */
export function useCheckinNotifier() {
  const { user } = useAuthStore();
  const lastNotifiedIdRef = useRef<string | null>(null);
  const armedRef = useRef(false);

  const role = user?.role ?? '';
  const isClient = role.split(',').map((r) => r.trim()).includes('CLIENT');

  useEffect(() => {
    if (!isClient) return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch('/api/v1/checkin/my-last', { credentials: 'include' });
        if (!res.ok) return;
        const body = await res.json();
        // Doble wrap posible: {success, data: {success, data: ...}}
        const inner = body.data?.data ?? body.data;
        const ci = inner;
        if (!ci || !ci.id || !ci.timestamp) return;

        const ageMs = Date.now() - new Date(ci.timestamp).getTime();

        // En el primer poll solo registramos el id actual (sin toast) para no
        // mostrar el check-in viejo al recargar la app.
        if (!armedRef.current) {
          lastNotifiedIdRef.current = ci.id;
          armedRef.current = true;
          return;
        }

        // Nuevo check-in y reciente → mostrar toaster.
        if (ci.id !== lastNotifiedIdRef.current && ageMs < 60_000) {
          lastNotifiedIdRef.current = ci.id;
          const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
          toast.success(`Bienvenido, ${user?.firstName ?? 'atleta'}!`, {
            description: `${msg} Tu entrada quedó registrada.`,
            duration: 7000,
          });
        } else if (ci.id !== lastNotifiedIdRef.current) {
          // El id cambió pero es viejo (recarga después de mucho rato): solo actualizar.
          lastNotifiedIdRef.current = ci.id;
        }
      } catch { /* silencio */ }
    }

    poll();
    const id = setInterval(() => { if (!cancelled) poll(); }, 15_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [isClient, user?.firstName]);
}
