'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Dumbbell, ArrowRight } from 'lucide-react';

interface LandingNavProps {
  slug: string;
  activePage?: 'inicio' | 'servicios' | 'planes' | 'instalaciones' | 'tienda';
}

export function LandingNav({ slug, activePage = 'inicio' }: LandingNavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { href: `/${slug}`, label: 'Inicio', key: 'inicio' as const },
    { href: `/${slug}/servicios`, label: 'Servicios', key: 'servicios' as const },
    { href: `/${slug}/planes`, label: 'Planes', key: 'planes' as const },
    { href: `/${slug}/instalaciones`, label: 'Instalaciones', key: 'instalaciones' as const },
    { href: `/${slug}/tienda`, label: 'Tienda', key: 'tienda' as const },
  ];

  return (
    <nav
      className="hidden md:flex items-center justify-between px-10 h-[76px] fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(10,11,13,0.78)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px) saturate(1.3)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(1.3)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
      }}
    >
      {/* Logo */}
      <Link href={`/${slug}`} className="flex items-center gap-2.5 press">
        <div className="w-9 h-9 rounded-xl fire-card flex items-center justify-center">
          <Dumbbell className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-[15px] tracking-tight text-foreground leading-none">GYMFIT</span>
          <span className="font-code text-[9px] tracking-[0.22em] leading-none" style={{ color: 'var(--gym-orange)' }}>PRO</span>
        </div>
      </Link>

      {/* Links */}
      <div className="flex items-center gap-1">
        {links.map((link) => {
          const active = activePage === link.key;
          return (
            <Link
              key={link.key}
              href={link.href}
              className="press relative px-4 py-2 rounded-lg transition-all"
              style={{
                color: active ? 'var(--gym-orange)' : 'rgba(255,255,255,0.65)',
                background: active ? 'rgba(255,90,31,0.10)' : 'transparent',
              }}
            >
              <span className="label-athletic text-[10.5px]">{link.label}</span>
              {active && (
                <span
                  className="absolute left-1/2 -bottom-0.5 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: 'var(--gym-orange)' }}
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* CTA */}
      <Link href={`/${slug}/planes`} className="btn-fire">
        Empezar <ArrowRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
