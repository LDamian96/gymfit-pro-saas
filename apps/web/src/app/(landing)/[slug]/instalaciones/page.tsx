import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Wifi, ShowerHead, Car, Lock, Wind, Music, Droplets, Zap, Coffee, Tv, Shirt, Dumbbell } from 'lucide-react';
import { MobileTopNav } from '@/components/landing/mobile-nav';
import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';
import { type LandingData, getFacilityImage, FALLBACK_IMAGES } from '@/lib/landing-content';

const API = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

async function getLanding(slug: string): Promise<LandingData | null> {
  try {
    const res = await fetch(`${API}/api/v1/landing/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch { return null; }
}

const amenityIconMap: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>> = {
  wifi: Wifi, shower: ShowerHead, 'shower-head': ShowerHead, car: Car, parking: Car,
  lock: Lock, locker: Lock, wind: Wind, music: Music, droplets: Droplets,
  zap: Zap, coffee: Coffee, tv: Tv, shirt: Shirt, dumbbell: Dumbbell,
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getLanding(slug);
  if (!data) return { title: 'Gimnasio no encontrado' };
  return { title: `Instalaciones — ${data.tenant.name}`, description: `Conoce las instalaciones de ${data.tenant.name}.` };
}

export default async function InstalacionesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getLanding(slug);
  if (!data) notFound();

  return (
    <div className="min-h-screen text-foreground page-enter" style={{ background: 'var(--gym-ink)' }}>
      <MobileTopNav slug={slug} tenantName={data.tenant.name} />
      <LandingNav slug={slug} activePage="instalaciones" />

      {/* Hero */}
      <section className="relative h-[55vh] md:h-[72vh] flex items-end overflow-hidden grain">
        <Image src={FALLBACK_IMAGES.facilities[0]} alt="Instalaciones" fill className="object-cover opacity-50" priority sizes="100vw" />
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
            <span className="label-athletic" style={{ color: 'var(--gym-orange)' }}>/ Nuestro espacio</span>
          </div>
          <h1 className="font-display text-foreground leading-[0.88] tracking-tight" style={{ fontSize: 'clamp(2.6rem, 8vw, 6.5rem)' }}>
            INSTALACIONES DE <br /><span style={{ color: 'var(--gym-orange)' }}>PRIMER NIVEL</span>
          </h1>
        </div>
      </section>

      {/* Stats bar */}
      <div className="relative grain" style={{ background: 'var(--gym-coal)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-4 divide-x" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {[
            { v: '700', s: 'm²', l: 'Espacio' },
            { v: '200', s: '+', l: 'Equipos' },
            { v: String(data.facilities.length || 6), s: '', l: 'Zonas' },
            { v: '18', s: 'h', l: 'Abierto' },
          ].map((s, i) => (
            <div key={s.l} className="py-5 md:py-9 text-center" style={{ borderColor: i === 0 ? 'transparent' : 'rgba(255,255,255,0.06)', borderLeftWidth: i === 0 ? 0 : 1, borderLeftStyle: 'solid' }}>
              <div className="flex items-baseline justify-center">
                <span className="hero-num" style={{ fontSize: 'clamp(28px, 4.5vw, 50px)', color: 'var(--gym-orange)' }}>{s.v}</span>
                <span className="font-display" style={{ fontSize: 'clamp(13px, 1.8vw, 22px)', color: 'var(--gym-orange)' }}>{s.s}</span>
              </div>
              <p className="label-athletic mt-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Zonas */}
      <section className="relative px-4 md:px-16 py-12 md:py-28 grain" style={{ background: 'var(--gym-ink)' }}>
        <div className="max-w-6xl mx-auto">
          {/* Mobile */}
          <div className="md:hidden space-y-4">
            {data.facilities.map((fac, i) => {
              const image = getFacilityImage(fac, i);
              return (
                <div key={fac.id} className="flex gap-4 glass-card rounded-2xl p-3">
                  <div className="relative w-[100px] h-[100px] rounded-xl overflow-hidden shrink-0">
                    <Image src={image} alt={fac.name} fill className="object-cover" sizes="100px" />
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md fire-card">
                      <span className="font-display text-white text-[8px] tracking-wider">/ {String(i + 1).padStart(2, '0')}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-foreground text-[15px] tracking-tight leading-tight">{fac.name}</h3>
                    <p className="mt-1.5 text-[12px] leading-relaxed line-clamp-3" style={{ color: 'rgba(255,255,255,0.6)' }}>{fac.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop bento */}
          <div className="hidden md:block">
            {data.facilities.length > 0 && (
              <div className="grid grid-cols-[1.5fr_1fr] gap-4 mb-4">
                <div className="relative h-[440px] rounded-3xl overflow-hidden shine-border">
                  <Image src={getFacilityImage(data.facilities[0], 0)} alt={data.facilities[0].name} fill className="object-cover" sizes="60vw" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,11,13,0.92), transparent 55%)' }} />
                  <div className="absolute top-6 left-6 fire-card px-3.5 py-1.5 rounded-lg">
                    <span className="font-display text-white text-[11px] tracking-wider">/ ZONA 01</span>
                  </div>
                  <div className="absolute bottom-7 left-7 right-7">
                    <h3 className="font-display text-foreground tracking-tight leading-tight" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)' }}>{data.facilities[0].name}</h3>
                    <p className="mt-2 text-[14px] max-w-md" style={{ color: 'rgba(255,255,255,0.65)' }}>{data.facilities[0].description}</p>
                  </div>
                </div>
                {data.facilities[1] && (
                  <div className="relative h-[440px] rounded-3xl overflow-hidden shine-border">
                    <Image src={getFacilityImage(data.facilities[1], 1)} alt={data.facilities[1].name} fill className="object-cover" sizes="40vw" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,11,13,0.92), transparent 55%)' }} />
                    <div className="absolute top-6 left-6 px-3.5 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.92)' }}>
                      <span className="font-display text-[11px] tracking-wider" style={{ color: '#0A0B0D' }}>/ ZONA 02</span>
                    </div>
                    <div className="absolute bottom-7 left-7 right-7">
                      <h3 className="font-display text-foreground tracking-tight leading-tight text-[20px]">{data.facilities[1].name}</h3>
                      <p className="mt-1.5 text-[12px]" style={{ color: 'rgba(255,255,255,0.65)' }}>{data.facilities[1].description}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            {data.facilities.length > 2 && (
              <div className="grid grid-cols-3 gap-4">
                {data.facilities.slice(2).map((fac, i) => (
                  <div key={fac.id} className="relative h-[280px] rounded-3xl overflow-hidden press">
                    <Image src={getFacilityImage(fac, i + 2)} alt={fac.name} fill className="object-cover transition-transform duration-700 hover:scale-110" sizes="33vw" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,11,13,0.92), transparent 55%)' }} />
                    <div className="absolute top-4 left-4 fire-card px-2.5 py-1 rounded-md">
                      <span className="font-display text-white text-[10px] tracking-wider">/ ZONA {String(i + 3).padStart(2, '0')}</span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="font-display text-foreground text-[17px] tracking-tight leading-tight">{fac.name}</h3>
                      <p className="text-[11px] mt-1 line-clamp-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{fac.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Amenidades */}
      {data.amenities.length > 0 && (
        <section className="relative px-4 md:px-16 py-12 md:py-28 grain" style={{ background: 'var(--gym-coal)' }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <div className="inline-flex items-center gap-3 mb-3">
                <span className="w-6 h-[2px] rounded-full" style={{ background: 'var(--gym-orange)' }} />
                <span className="label-athletic" style={{ color: 'var(--gym-orange)' }}>/ Comodidades</span>
                <span className="w-6 h-[2px] rounded-full" style={{ background: 'var(--gym-orange)' }} />
              </div>
              <h2 className="font-display text-foreground leading-[0.92] tracking-tight" style={{ fontSize: 'clamp(1.8rem, 5vw, 3.2rem)' }}>
                TODO LO QUE <span style={{ color: 'var(--gym-orange)' }}>NECESITAS</span>
              </h2>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
              {data.amenities.map((am) => {
                const Icon = amenityIconMap[am.iconName] || Zap;
                return (
                  <div key={am.id} className="glass-card rounded-2xl p-4 md:p-5 text-center lift">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl fire-card mx-auto mb-2.5 flex items-center justify-center">
                      <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" strokeWidth={2.5} />
                    </div>
                    <h3 className="font-display text-foreground text-[11px] md:text-[13px] tracking-tight">{am.name}</h3>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-3 md:px-10 my-10 md:my-16">
        <div
          className="relative overflow-hidden rounded-3xl md:rounded-[36px] py-12 md:py-24 px-6 md:px-16 text-center grain"
          style={{ background: 'linear-gradient(135deg, var(--gym-orange) 0%, #E63E00 100%)' }}
        >
          <span className="label-athletic" style={{ color: 'rgba(0,0,0,0.55)' }}>/ Visita guiada</span>
          <h2 className="font-display mt-3 leading-[0.92]" style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', color: '#0A0B0D' }}>
            AGENDA <br />TU VISITA
          </h2>
          <p className="mt-4 text-[13px] md:text-base max-w-md mx-auto" style={{ color: 'rgba(0,0,0,0.7)' }}>
            Ven a conocer nuestras instalaciones de cerca.
          </p>
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
            AGENDAR <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </div>
      </section>

      <LandingFooter slug={slug} tenantName={data.tenant.name} phone={data.tenant.phone} email={data.tenant.email} address={data.tenant.address} />
      <div className="md:hidden h-20" />
    </div>
  );
}
