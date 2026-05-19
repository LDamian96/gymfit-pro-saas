import Link from 'next/link';
import { Dumbbell, Instagram, Facebook, Youtube, ArrowRight } from 'lucide-react';

interface LandingFooterProps {
  slug: string;
  tenantName: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export function LandingFooter({ slug, tenantName, phone, email }: LandingFooterProps) {
  return (
    <footer
      className="relative grain"
      style={{
        background: 'linear-gradient(180deg, var(--gym-coal) 0%, #050608 100%)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Mobile */}
      <div className="md:hidden px-4 py-7">
        <div className="flex items-center justify-between mb-5">
          <Link href={`/${slug}`} className="flex items-center gap-2 press">
            <div className="w-8 h-8 rounded-lg fire-card flex items-center justify-center">
              <Dumbbell className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display text-foreground text-[13px] tracking-tight">{tenantName.toUpperCase()}</span>
          </Link>
          <div className="flex gap-2">
            {[Instagram, Facebook, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="press w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: 'rgba(255,255,255,0.55)' }} />
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
          {[
            { href: `/${slug}`, label: 'Inicio' },
            { href: `/${slug}/servicios`, label: 'Servicios' },
            { href: `/${slug}/planes`, label: 'Planes' },
            { href: `/${slug}/instalaciones`, label: 'Instalaciones' },
            { href: `/${slug}/tienda`, label: 'Tienda' },
          ].map((l) => (
            <Link key={l.label} href={l.href} className="label-athletic" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {l.label}
            </Link>
          ))}
        </div>

        {(email || phone) && (
          <div className="flex flex-col gap-1 mb-4 font-code text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {email && <span>{email}</span>}
            {phone && <span>{phone}</span>}
          </div>
        )}

        <p className="label-athletic" style={{ color: 'rgba(255,255,255,0.25)' }}>© 2026 {tenantName}</p>
      </div>

      {/* Desktop */}
      <div className="hidden md:block px-16 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Top — logo + newsletter */}
          <div className="flex items-start justify-between gap-8 pb-10 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div>
              <Link href={`/${slug}`} className="flex items-center gap-2.5 press">
                <div className="w-10 h-10 rounded-xl fire-card flex items-center justify-center">
                  <Dumbbell className="h-5 w-5 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-foreground text-[18px] tracking-tight">{tenantName.toUpperCase()}</span>
                  <span className="font-code text-[10px] tracking-[0.22em]" style={{ color: 'var(--gym-orange)' }}>PRO</span>
                </div>
              </Link>
              <p className="mt-4 max-w-md text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Tu gimnasio, tu transformación. Resultados reales con el respaldo de coaches certificados.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="tu@email.com"
                className="w-60 px-4 py-3 rounded-xl text-[13px] text-foreground outline-none transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              />
              <button className="btn-fire">
                Suscribirme <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Columnas */}
          <div className="grid grid-cols-4 gap-10 py-10">
            <div>
              <h4 className="label-athletic mb-4" style={{ color: 'var(--gym-orange)' }}>/ Navegación</h4>
              <ul className="space-y-2.5">
                {[
                  { l: 'Inicio', h: '' },
                  { l: 'Servicios', h: '/servicios' },
                  { l: 'Planes', h: '/planes' },
                  { l: 'Instalaciones', h: '/instalaciones' },
                  { l: 'Tienda', h: '/tienda' },
                ].map((it) => (
                  <li key={it.l}>
                    <Link
                      href={`/${slug}${it.h}`}
                      className="text-[13px] transition-colors press"
                      style={{ color: 'rgba(255,255,255,0.6)' }}
                    >
                      {it.l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="label-athletic mb-4" style={{ color: 'var(--gym-orange)' }}>/ Horarios</h4>
              <ul className="space-y-2.5 text-[13px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <li>Lun-Vie · 5am-10pm</li>
                <li>Sáb · 6am-8pm</li>
                <li>Dom · 7am-2pm</li>
              </ul>
            </div>
            <div>
              <h4 className="label-athletic mb-4" style={{ color: 'var(--gym-orange)' }}>/ Contacto</h4>
              <ul className="space-y-2.5 text-[13px] font-code" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {email && <li>{email}</li>}
                {phone && <li>{phone}</li>}
              </ul>
            </div>
            <div>
              <h4 className="label-athletic mb-4" style={{ color: 'var(--gym-orange)' }}>/ Síguenos</h4>
              <div className="flex gap-2">
                {[Instagram, Facebook, Youtube].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="press w-10 h-10 rounded-xl flex items-center justify-center transition-colors group"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <Icon className="h-4 w-4 group-hover:text-[var(--gym-orange)] transition-colors" style={{ color: 'rgba(255,255,255,0.55)' }} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <span className="label-athletic" style={{ color: 'rgba(255,255,255,0.25)' }}>
              © 2026 {tenantName} · Todos los derechos reservados
            </span>
            <span className="font-code text-[10px] tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.25)' }}>
              POWERED BY GYMFIT PRO
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
