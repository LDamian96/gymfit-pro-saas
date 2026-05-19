import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, ChevronDown } from 'lucide-react';
import { MobileTopNav } from '@/components/landing/mobile-nav';
import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';
import { PlanCheckoutButton } from '@/components/landing/plan-checkout-button';
import { type LandingData } from '@/lib/landing-content';

const API = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

async function getLanding(slug: string): Promise<LandingData | null> {
  try {
    const res = await fetch(`${API}/api/v1/landing/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getLanding(slug);
  if (!data) return { title: 'Gimnasio no encontrado' };
  return {
    title: `Planes y Precios — ${data.tenant.name}`,
    description: `Conoce los planes de ${data.tenant.name}. Elige el que mejor se adapte a tus objetivos.`,
    openGraph: { title: `Planes — ${data.tenant.name}`, description: 'Invierte en ti.', type: 'website' },
  };
}

export default async function PlanesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getLanding(slug);
  if (!data) notFound();

  return (
    <div className="min-h-screen text-foreground pb-20 md:pb-0 mesh-bg grain page-enter" style={{ background: 'var(--gym-ink)' }}>
      <MobileTopNav slug={slug} tenantName={data.tenant.name} />
      <LandingNav slug={slug} activePage="planes" />

      <div className="hidden md:block h-[76px]" />

      {/* Header */}
      <section className="relative px-6 md:px-16 pt-16 md:pt-28 pb-12 md:pb-20 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-3 mb-5">
          <span className="w-7 h-[2px] rounded-full" style={{ background: 'var(--gym-orange)' }} />
          <span className="label-athletic" style={{ color: 'var(--gym-orange)' }}>/ Nuestros planes</span>
          <span className="w-7 h-[2px] rounded-full" style={{ background: 'var(--gym-orange)' }} />
        </div>
        <h1 className="font-display text-foreground leading-[0.88] tracking-tight" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}>
          INVIERTE EN <span style={{ color: 'var(--gym-orange)' }}>TI</span>
        </h1>
        <p className="mt-6 text-base md:text-[17px] max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.65)' }}>
          Todos los planes incluyen acceso completo. Sin sorpresas, sin contratos.
        </p>
      </section>

      {/* Pricing Cards */}
      {data.plans.length > 0 && (
        <section className="px-4 md:px-16 py-6 md:py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {data.plans.map((plan) => {
              const popular = plan.isPopular;
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl p-7 md:p-8 flex flex-col ${popular ? 'shine-border md:scale-[1.04]' : ''}`}
                  style={
                    popular
                      ? {
                          background: 'linear-gradient(135deg, var(--gym-orange) 0%, #E63E00 100%)',
                          boxShadow: 'var(--shadow-glow-lg, 0 24px 60px -16px rgba(255,90,31,0.55))',
                        }
                      : {
                          background:
                            'linear-gradient(135deg, rgba(28,31,37,0.78) 0%, rgba(20,22,26,0.78) 100%)',
                          border: '1px solid rgba(255,255,255,0.07)',
                          backdropFilter: 'blur(20px)',
                        }
                  }
                >
                  {popular && (
                    <span
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full font-display text-[10px] tracking-[0.18em] whitespace-nowrap"
                      style={{ background: '#0A0B0D', color: 'var(--gym-orange)' }}
                    >
                      MÁS ELEGIDO
                    </span>
                  )}

                  <span className="label-athletic" style={{ color: popular ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.5)' }}>
                    / Plan
                  </span>
                  <h3 className="font-display mt-2 leading-tight tracking-tight" style={{ fontSize: 'clamp(1.6rem, 3vw, 2rem)', color: popular ? '#0A0B0D' : 'var(--foreground)' }}>
                    {plan.name.toUpperCase()}
                  </h3>

                  <div className="flex items-baseline gap-1 my-6">
                    <span
                      className="font-display"
                      style={{ fontSize: 'clamp(2.4rem, 5vw, 3.4rem)', color: popular ? '#0A0B0D' : 'var(--gym-orange)' }}
                    >
                      S/{plan.price}
                    </span>
                    <span className="text-sm" style={{ color: popular ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.5)' }}>
                      /{plan.duration === 1 ? 'mes' : `${plan.duration} meses`}
                    </span>
                  </div>

                  <ul className="space-y-3 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[13.5px]" style={{ color: popular ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.72)' }}>
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: popular ? 'rgba(0,0,0,0.15)' : 'rgba(255,90,31,0.16)' }}
                        >
                          <Check className="h-3 w-3" strokeWidth={3} style={{ color: popular ? '#0A0B0D' : 'var(--gym-orange)' }} />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-7">
                    <PlanCheckoutButton
                      planId={plan.id}
                      tenantId={slug}
                      isPopular={popular}
                      label={popular ? 'EMPEZAR AHORA' : 'ELEGIR PLAN'}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* FAQ */}
      {data.faqs.length > 0 && (
        <section className="relative px-6 md:px-16 py-16 md:py-28 grain" style={{ background: 'var(--gym-coal)' }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-3 mb-3">
                <span className="w-6 h-[2px] rounded-full" style={{ background: 'var(--gym-orange)' }} />
                <span className="label-athletic" style={{ color: 'var(--gym-orange)' }}>/ Preguntas frecuentes</span>
                <span className="w-6 h-[2px] rounded-full" style={{ background: 'var(--gym-orange)' }} />
              </div>
              <h2 className="font-display text-foreground leading-[0.95] tracking-tight" style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}>
                ¿TIENES <span style={{ color: 'var(--gym-orange)' }}>DUDAS?</span>
              </h2>
            </div>
            <div className="space-y-2.5">
              {data.faqs.map((faq) => (
                <details key={faq.id} className="group glass-card rounded-2xl p-5 cursor-pointer">
                  <summary className="flex items-center justify-between gap-3 list-none">
                    <h3 className="font-display text-foreground text-[14px] md:text-[16px] tracking-tight pr-4">{faq.question}</h3>
                    <ChevronDown className="h-4 w-4 shrink-0 group-open:rotate-180 transition-transform" style={{ color: 'var(--gym-orange)' }} />
                  </summary>
                  <p className="mt-3 text-[13px] md:text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Final */}
      <section className="px-3 md:px-10 my-8 md:my-16">
        <div
          className="relative overflow-hidden rounded-3xl md:rounded-[36px] py-14 md:py-24 px-6 md:px-16 text-center grain"
          style={{ background: 'linear-gradient(135deg, var(--gym-orange) 0%, #E63E00 100%)' }}
        >
          <span className="label-athletic" style={{ color: 'rgba(0,0,0,0.55)' }}>/ Tu transformación</span>
          <h2 className="font-display mt-3 leading-[0.9]" style={{ fontSize: 'clamp(2.4rem, 6vw, 4.4rem)', color: '#0A0B0D' }}>
            ¿LISTO PARA <br />EMPEZAR?
          </h2>
          <p className="mt-4 text-[14px] md:text-[17px] max-w-md mx-auto" style={{ color: 'rgba(0,0,0,0.7)' }}>
            Tu transformación comienza con una decisión.
          </p>
          <Link
            href="/login"
            className="press mt-7 inline-flex items-center gap-2 px-8 py-4 rounded-xl"
            style={{
              background: '#0A0B0D',
              color: '#FFFFFF',
              fontFamily: 'var(--font-archivo-black), system-ui',
              fontSize: '14px',
              letterSpacing: '0.02em',
              boxShadow: '0 12px 32px -8px rgba(0,0,0,0.4)',
            }}
          >
            INSCRÍBETE AHORA <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </div>
      </section>

      <LandingFooter slug={slug} tenantName={data.tenant.name} phone={data.tenant.phone} email={data.tenant.email} address={data.tenant.address} />
      <div className="md:hidden h-20" />
    </div>
  );
}
