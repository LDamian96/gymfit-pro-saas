import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Dumbbell, Users, Apple, Target, Trophy, ScanLine } from 'lucide-react';
import { MobileTopNav } from '@/components/landing/mobile-nav';
import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';
import { type LandingData, getServiceImage, FALLBACK_IMAGES } from '@/lib/landing-content';

const API = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

async function getLanding(slug: string): Promise<LandingData | null> {
  try {
    const res = await fetch(`${API}/api/v1/landing/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch { return null; }
}

const iconMap: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>> = {
  dumbbell: Dumbbell, users: Users, apple: Apple, target: Target, trophy: Trophy, 'scan-line': ScanLine,
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getLanding(slug);
  if (!data) return { title: 'Gimnasio no encontrado' };
  return {
    title: `Servicios — ${data.tenant.name}`,
    description: `Descubre los servicios de ${data.tenant.name}.`,
  };
}

export default async function ServiciosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getLanding(slug);
  if (!data) notFound();

  return (
    <div className="min-h-screen text-foreground page-enter" style={{ background: 'var(--gym-ink)' }}>
      <MobileTopNav slug={slug} tenantName={data.tenant.name} />
      <LandingNav slug={slug} activePage="servicios" />

      {/* Hero */}
      <section className="relative h-[55vh] md:h-[72vh] flex items-end overflow-hidden grain">
        <Image src={FALLBACK_IMAGES.services[0]} alt="Servicios" fill className="object-cover opacity-50" priority sizes="100vw" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(10,11,13,0.4) 0%, rgba(10,11,13,0.7) 70%, var(--gym-ink) 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(55% 50% at 10% 80%, rgba(255,90,31,0.22) 0%, transparent 65%)' }}
        />
        <div className="relative z-10 px-4 md:px-16 pb-12 md:pb-20 max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-[2px] rounded-full" style={{ background: 'var(--gym-orange)' }} />
            <span className="label-athletic" style={{ color: 'var(--gym-orange)' }}>/ Nuestros servicios</span>
          </div>
          <h1 className="font-display text-foreground leading-[0.88]" style={{ fontSize: 'clamp(2.6rem, 8vw, 6.5rem)' }}>
            ENTRENAMIENTO <br />QUE <span style={{ color: 'var(--gym-orange)' }}>TRANSFORMA</span>
          </h1>
        </div>
      </section>

      {/* Servicios — alternados desktop, lista mobile */}
      {data.services.map((svc, i) => {
        const isReversed = i % 2 !== 0;
        const Icon = iconMap[svc.iconName] || Dumbbell;
        const image = getServiceImage(svc, i);
        const bg = i % 2 === 0 ? 'var(--gym-ink)' : 'var(--gym-coal)';

        return (
          <section key={svc.id} className="relative px-4 md:px-16 py-10 md:py-28 grain" style={{ background: bg }}>
            <div className="max-w-6xl mx-auto">
              {/* Mobile */}
              <div className="md:hidden">
                <div className="flex gap-4">
                  <div className="relative w-[120px] h-[150px] rounded-xl overflow-hidden shrink-0 shine-border">
                    <Image src={image} alt={svc.name} fill className="object-cover" sizes="120px" />
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md fire-card">
                      <span className="font-display text-white text-[9px] tracking-wider">/ {String(i + 1).padStart(2, '0')}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className="h-4 w-4" style={{ color: 'var(--gym-orange)' }} strokeWidth={2.5} />
                      <span className="label-athletic" style={{ color: 'rgba(255,255,255,0.45)' }}>SERVICIO {String(i + 1).padStart(2, '0')}</span>
                    </div>
                    <h2 className="font-display text-foreground text-[17px] leading-tight tracking-tight">{svc.name}</h2>
                    <p className="mt-1.5 text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{svc.description}</p>
                  </div>
                </div>
              </div>

              {/* Desktop alternado */}
              <div className="hidden md:grid md:grid-cols-2 gap-16 items-center">
                <div className={`relative h-[440px] rounded-3xl overflow-hidden shine-border ${isReversed ? 'order-2' : ''}`}>
                  <Image src={image} alt={svc.name} fill className="object-cover" sizes="50vw" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 60%, rgba(10,11,13,0.4) 100%)' }} />
                  <div className="absolute top-6 left-6 fire-card px-3.5 py-2 rounded-xl">
                    <span className="font-display text-white text-[13px] tracking-wider">/ {String(i + 1).padStart(2, '0')}</span>
                  </div>
                </div>
                <div className={isReversed ? 'order-1' : ''}>
                  <div className="w-14 h-14 rounded-2xl fire-card flex items-center justify-center mb-6">
                    <Icon className="h-7 w-7 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="label-athletic" style={{ color: 'rgba(255,255,255,0.45)' }}>/ Servicio {String(i + 1).padStart(2, '0')}</span>
                  <h2 className="font-display text-foreground mt-3 leading-[0.95] tracking-tight" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.4rem)' }}>
                    {svc.name}
                  </h2>
                  <p className="mt-5 text-base leading-relaxed max-w-md" style={{ color: 'rgba(255,255,255,0.65)' }}>{svc.description}</p>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* CTA */}
      <section className="px-3 md:px-10 my-10 md:my-16">
        <div
          className="relative overflow-hidden rounded-3xl md:rounded-[36px] py-12 md:py-24 px-6 md:px-16 text-center grain"
          style={{ background: 'linear-gradient(135deg, var(--gym-orange) 0%, #E63E00 100%)' }}
        >
          <span className="label-athletic" style={{ color: 'rgba(0,0,0,0.55)' }}>/ ¿Qué esperas?</span>
          <h2 className="font-display mt-3 leading-[0.92]" style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', color: '#0A0B0D' }}>
            TU SIGUIENTE NIVEL <br />EMPIEZA HOY
          </h2>
          <Link
            href={`/${slug}/planes`}
            className="press mt-7 inline-flex items-center gap-2 px-7 py-3.5 rounded-xl"
            style={{
              background: '#0A0B0D',
              color: '#FFFFFF',
              fontFamily: 'var(--font-archivo-black), system-ui',
              fontSize: '14px',
              letterSpacing: '0.02em',
            }}
          >
            VER PLANES <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </div>
      </section>

      <LandingFooter slug={slug} tenantName={data.tenant.name} phone={data.tenant.phone} email={data.tenant.email} address={data.tenant.address} />
      <div className="md:hidden h-20" />
    </div>
  );
}
