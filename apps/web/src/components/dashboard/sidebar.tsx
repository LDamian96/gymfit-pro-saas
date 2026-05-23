'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid, Users, CreditCard, UserCheck, ScanLine, Dumbbell, Calendar,
  Settings, Globe, Sparkles, Tag, Building, HelpCircle, Trophy, LogOut,
  Menu, X, Activity, ShoppingBag, Package, Store, Receipt,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/dashboard/theme-toggle';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { prefetchRouteData } from '@/lib/route-prefetch';
import { cachedGet, unwrap } from '@/lib/api';
import { BranchContextSwitcher } from '@/components/dashboard/branch-context-switcher';

type RoleKey = 'ADMIN' | 'TRAINER' | 'RECEPTIONIST' | 'CLIENT';
type IconCmp = React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>;
interface NavItemConfig { href: string; label: string; icon: IconCmp; roles: RoleKey[]; }

const mainNav: NavItemConfig[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid, roles: ['ADMIN'] },
  { href: '/my-progress', label: 'Inicio', icon: LayoutGrid, roles: ['CLIENT'] },
  { href: '/my-measurements', label: 'Mis Medidas', icon: Activity, roles: ['CLIENT'] },
  { href: '/my-routines', label: 'Mi Rutina', icon: Dumbbell, roles: ['CLIENT'] },
  { href: '/my-attendance', label: 'Mi Asistencia', icon: UserCheck, roles: ['CLIENT'] },
  { href: '/my-schedule', label: 'Mi Horario', icon: Calendar, roles: ['CLIENT'] },
  { href: '/members', label: 'Clientes', icon: Users, roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] },
  { href: '/finances', label: 'Membresías', icon: CreditCard, roles: ['ADMIN'] },
  { href: '/branches', label: 'Sucursales', icon: Building, roles: ['ADMIN'] },
  { href: '/staff', label: 'Personal', icon: UserCheck, roles: ['ADMIN'] },
  { href: '/checkin', label: 'Check-in QR', icon: ScanLine, roles: ['ADMIN', 'RECEPTIONIST'] },
  { href: '/attendance', label: 'Asistencias', icon: Activity, roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] },
  { href: '/exercises', label: 'Ejercicios', icon: Dumbbell, roles: ['ADMIN', 'TRAINER'] },
  { href: '/muscle-groups', label: 'Grupos Musculares', icon: Activity, roles: ['ADMIN', 'TRAINER'] },
  { href: '/routines', label: 'Rutinas', icon: Activity, roles: ['ADMIN', 'TRAINER'] },
  { href: '/classes', label: 'Clases', icon: Calendar, roles: ['ADMIN', 'TRAINER', 'RECEPTIONIST'] },
  { href: '/pos', label: 'Vender', icon: Store, roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] },
  { href: '/sales', label: 'Ventas', icon: Receipt, roles: ['ADMIN', 'RECEPTIONIST', 'TRAINER'] },
  { href: '/shop', label: 'Tienda', icon: ShoppingBag, roles: ['ADMIN'] },
  { href: '/brands', label: 'Marcas', icon: Tag, roles: ['ADMIN'] },
  { href: '/product-categories', label: 'Categorías', icon: Package, roles: ['ADMIN'] },
  { href: '/settings', label: 'Configuración', icon: Settings, roles: ['ADMIN'] },
];

const landingNav: NavItemConfig[] = [
  { href: '/landing', label: 'Mi Landing', icon: Globe, roles: ['ADMIN'] },
  { href: '/landing/services', label: 'Servicios', icon: Sparkles, roles: ['ADMIN'] },
  { href: '/landing/plans', label: 'Planes', icon: Tag, roles: ['ADMIN'] },
  { href: '/landing/facilities', label: 'Instalaciones', icon: Building, roles: ['ADMIN'] },
  { href: '/landing/faq', label: 'FAQ', icon: HelpCircle, roles: ['ADMIN'] },
];

function NavItem({ href, label, icon: Icon, onClick }: { href: string; label: string; icon: IconCmp; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <Link
      href={href}
      prefetch
      onClick={onClick}
      onMouseEnter={() => prefetchRouteData(href)}
      onTouchStart={() => prefetchRouteData(href)}
      className={cn(
        'group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-display tracking-tight transition-all duration-200',
        isActive
          ? 'text-foreground'
          : 'text-muted-foreground hover:text-foreground',
      )}
      style={isActive ? {
        background: 'linear-gradient(135deg, rgba(255,90,31,0.12), rgba(255,90,31,0.04))',
        border: '1px solid rgba(255,90,31,0.18)',
      } : { border: '1px solid transparent' }}
    >
      {/* Indicador activo: barra naranja a la izquierda */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
          style={{ background: 'var(--gym-orange)', boxShadow: '0 0 10px var(--gym-orange-glow)' }} />
      )}
      <Icon className="h-[17px] w-[17px] shrink-0"
        strokeWidth={isActive ? 2.5 : 2}
        style={{ color: isActive ? 'var(--gym-orange)' : undefined }} />
      <span>{label}</span>
    </Link>
  );
}

function filterByRole(items: NavItemConfig[], role: string): NavItemConfig[] {
  const userRoles = role.split(',').map((r) => r.trim()) as RoleKey[];
  return items.filter((item) => item.roles.some((r) => userRoles.includes(r)));
}

/**
 * Grupos del sidebar ADMIN. Cada item se asigna a un grupo por href.
 * Si un href no aparece en este mapa, va al grupo "Otros" al final.
 * Para roles no-admin se ignora y se renderiza una lista plana.
 */
const ADMIN_GROUPS: { label: string; hrefs: string[] }[] = [
  { label: 'Operación', hrefs: ['/dashboard', '/members', '/finances', '/checkin', '/staff', '/branches'] },
  { label: 'Ventas', hrefs: ['/pos', '/sales', '/shop', '/brands', '/product-categories'] },
  { label: 'Entrenamiento', hrefs: ['/routines', '/exercises', '/muscle-groups', '/classes'] },
  { label: 'Ajustes', hrefs: ['/settings'] },
];

function groupAdminItems(items: NavItemConfig[]): { label: string; items: NavItemConfig[] }[] {
  const byHref = new Map(items.map((i) => [i.href, i]));
  const used = new Set<string>();
  const groups: { label: string; items: NavItemConfig[] }[] = [];
  for (const g of ADMIN_GROUPS) {
    const groupItems = g.hrefs.map((h) => byHref.get(h)).filter((x): x is NavItemConfig => !!x);
    if (groupItems.length > 0) {
      groups.push({ label: g.label, items: groupItems });
      groupItems.forEach((i) => used.add(i.href));
    }
  }
  // Items no agrupados (por seguridad si se agrega uno nuevo)
  const leftovers = items.filter((i) => !used.has(i.href));
  if (leftovers.length > 0) groups.push({ label: 'Otros', items: leftovers });
  return groups;
}

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    // Navega PRIMERO (cliente sigue viendo dashboard hasta que login monta) —
    // luego dispara la limpieza del API en background. Evita el "flash CLIENT"
    // que pasaba al setear user=null en el store mientras seguimos en /dashboard.
    router.replace('/login');
    void logout();
  };

  const userRole = user?.role || 'CLIENT';
  const roleList = userRole.split(',').map((r) => r.trim());
  const isAdmin = roleList.includes('ADMIN');

  // Permiso de Membresías para Recep/Trainer según setting del tenant.
  const [memb, setMemb] = useState<{ trainer: boolean; recep: boolean } | null>(null);
  useEffect(() => {
    if (isAdmin || (!roleList.includes('RECEPTIONIST') && !roleList.includes('TRAINER'))) return;
    cachedGet<unknown>('/api/v1/tenant/settings', { ttl: 60_000 })
      .then((r) => {
        const d = unwrap<{ trainerMembershipEnabled?: boolean; receptionistMembershipEnabled?: boolean }>(r);
        setMemb({ trainer: !!d?.trainerMembershipEnabled, recep: !!d?.receptionistMembershipEnabled });
      })
      .catch(() => setMemb(null));
  }, [isAdmin, userRole]); // eslint-disable-line react-hooks/exhaustive-deps

  let filteredMain = filterByRole(mainNav, userRole);
  // Inyectar /finances (Membresías) si el setting habilita al rol.
  const canMembership =
    (roleList.includes('RECEPTIONIST') && memb?.recep) ||
    (roleList.includes('TRAINER') && memb?.trainer);
  if (canMembership && !filteredMain.some((i) => i.href === '/finances')) {
    const fin = mainNav.find((i) => i.href === '/finances');
    if (fin) filteredMain = [...filteredMain, fin];
  }
  const filteredLanding = filterByRole(landingNav, userRole);
  const showLanding = filteredLanding.length > 0;
  const adminGroups = isAdmin ? groupAdminItems(filteredMain) : null;
  const closeMobile = () => setMobileOpen(false);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center fire-card shrink-0">
            <Dumbbell className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-display text-[16px] tracking-tight leading-none text-foreground">GYMFIT</p>
            <p className="font-code text-[8px] tracking-[0.18em] mt-1 text-[var(--gym-orange)] leading-none">PRO · 2026</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button onClick={closeMobile} className="md:hidden p-1.5 rounded-lg text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Selector global de SEDE activa — el contexto de toda la app. */}
      <BranchContextSwitcher />

      {/* Nav — admin con grupos, otros roles lista plana */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {isAdmin && adminGroups ? (
          // ADMIN: render por grupos con label-athletic separator
          <>
            {adminGroups.map((g) => (
              <div key={g.label} className="mb-2">
                <div className="px-3 pt-2 pb-1.5">
                  <span className="label-athletic text-muted-foreground">/ {g.label}</span>
                </div>
                {g.items.map((item) => (
                  <NavItem key={item.href} {...item} onClick={closeMobile} />
                ))}
              </div>
            ))}
          </>
        ) : (
          // Otros roles: lista plana sin separadores (poco menú)
          <>
            <div className="px-3 pb-2">
              <span className="label-athletic text-muted-foreground">/ Menú</span>
            </div>
            {filteredMain.map((item) => (
              <NavItem key={item.href} {...item} onClick={closeMobile} />
            ))}
          </>
        )}

        {showLanding && (
          <>
            <div className="pt-3 pb-1.5 px-3">
              <span className="label-athletic text-muted-foreground">/ Landing</span>
            </div>
            {filteredLanding.map((item) => (
              <NavItem key={item.href} {...item} onClick={closeMobile} />
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4">
        <div className="flex items-center gap-3 p-3 rounded-2xl glass-card">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-[11px] font-display text-white" style={{ background: 'linear-gradient(135deg, var(--gym-orange) 0%, var(--gym-orange-dark) 100%)' }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-bold truncate text-foreground">{user?.firstName} {user?.lastName}</p>
            <p className="font-code text-[9px] tracking-[0.12em] truncate uppercase text-[var(--gym-orange)]">{userRole.replace(',', ' · ')}</p>
          </div>
          <button onClick={handleLogout} className="press p-2 rounded-lg transition-colors text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border px-4 h-14 flex items-center justify-between">
        <button onClick={() => setMobileOpen(true)} className="p-2 text-muted-foreground hover:text-foreground rounded-lg">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">G</span>
          </div>
          <span className="font-black text-foreground text-sm">GymFit</span>
        </div>
        <ThemeToggle />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeMobile} />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-card flex flex-col shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop */}
      <aside className="hidden md:flex w-[256px] h-screen flex-col fixed left-0 top-0 z-40 transition-colors duration-300 border-r border-border"
        style={{ background: 'var(--card)' }}>
        {sidebarContent}
      </aside>
    </>
  );
}
