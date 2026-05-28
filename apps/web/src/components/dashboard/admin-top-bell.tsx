'use client';

import { useAuthStore } from '@/stores/auth-store';
import { NotificationBell } from '@/components/dashboard/notification-bell';

/**
 * Topbar inline para el panel admin. Vive como primera fila del <main>,
 * NO fixed: así no se superpone con el header de cada página (donde está
 * el BranchContextBadge "Sede X").
 *
 * Solo se monta para usuarios con rol ADMIN; otros roles no ven la
 * campanita y el topbar se colapsa (no ocupa espacio).
 */
export function AdminTopBell() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.split(',').map((r) => r.trim()).includes('ADMIN');
  if (!isAdmin) return null;
  return (
    <div className="hidden md:flex justify-end items-center px-8 pt-4 -mb-4">
      <div className="rounded-full glass-card p-1 shadow-sm">
        <NotificationBell />
      </div>
    </div>
  );
}
