'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dumbbell, Home, Building2, Tag, Sparkles, ShoppingBag } from 'lucide-react';

interface MobileNavProps {
  slug: string;
  tenantName: string;
}

export function MobileTopNav({ slug, tenantName }: MobileNavProps) {
  return (
    <div
      className="md:hidden sticky top-0 z-40"
      style={{
        background: 'rgba(10,11,13,0.78)',
        backdropFilter: 'blur(20px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center justify-between px-4 h-14">
        <Link href={`/${slug}`} className="flex items-center gap-2 press">
          <div className="w-7 h-7 rounded-lg fire-card flex items-center justify-center">
            <Dumbbell className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-[13px] tracking-tight text-foreground leading-none">{tenantName.toUpperCase()}</span>
            <span className="font-code text-[8px] leading-none tracking-[0.18em]" style={{ color: 'var(--gym-orange)' }}>PRO</span>
          </div>
        </Link>
        <Link
          href={`/${slug}/planes`}
          className="press inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg fire-card text-[10px] font-display tracking-wider"
        >
          Empezar
        </Link>
      </div>
    </div>
  );
}

export function MobileBottomNav({ slug }: { slug: string }) {
  const pathname = usePathname();

  const tabs = [
    { href: `/${slug}`, label: 'Inicio', icon: Home, matchExact: true },
    { href: `/${slug}/instalaciones`, label: 'Gym', icon: Building2, matchExact: false },
    { href: `/${slug}/planes`, label: 'Planes', icon: Tag, matchExact: false },
    { href: `/${slug}/servicios`, label: 'Coaching', icon: Sparkles, matchExact: false },
    { href: `/${slug}/tienda`, label: 'Tienda', icon: ShoppingBag, matchExact: false },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(10,11,13,0.88)',
        backdropFilter: 'blur(24px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-2">
        {tabs.map((tab) => {
          const isActive = tab.matchExact ? pathname === tab.href : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="press flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-colors"
              style={{
                background: isActive ? 'rgba(255,90,31,0.12)' : 'transparent',
              }}
            >
              <Icon
                className="h-[18px] w-[18px]"
                strokeWidth={isActive ? 2.5 : 2}
                style={{ color: isActive ? 'var(--gym-orange)' : 'rgba(255,255,255,0.35)' }}
              />
              <span
                className="text-[9.5px] font-bold tracking-wider uppercase leading-none"
                style={{ color: isActive ? 'var(--gym-orange)' : 'rgba(255,255,255,0.35)' }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
