'use client';

import { useAuthStore } from '@/stores/auth-store';
import { NotificationBell } from '@/components/dashboard/notification-bell';

/**
 * Wrapper que fija la NotificationBell en la esquina superior derecha del
 * área de página (no del sidebar). Solo se monta para usuarios con rol ADMIN.
 *
 * Por qué fixed top-right: el popover se ancla a `top-16 right-6` vía Portal,
 * así que tener el trigger también ahí evita confusión visual (el popover
 * "salía" de un lugar y el botón estaba en otro).
 */
export function AdminTopBell() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.split(',').map((r) => r.trim()).includes('ADMIN');
  if (!isAdmin) return null;
  return (
    <div className="hidden md:flex fixed top-4 right-6 z-[55] items-center">
      <div className="rounded-full glass-card p-1 shadow-sm">
        <NotificationBell />
      </div>
    </div>
  );
}
