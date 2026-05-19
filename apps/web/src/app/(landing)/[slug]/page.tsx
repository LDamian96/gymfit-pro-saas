import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MobileTopNav } from '@/components/landing/mobile-nav';
import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';
import { LandingHero } from '@/components/landing/landing-hero';
import { Marquee } from '@/components/landing/marquee';
import { AppFeaturesSection, ChooseUsSection, CoachesSection, AppTrackingSection, FinalCTA, StatsSection, ShopPreviewSection, FAQPreviewSection } from '@/components/landing/landing-sections';
import { type LandingData, getText, FALLBACK_IMAGES } from '@/lib/landing-content';

interface PreviewProduct { id: string; name: string; imageUrl: string | null; category: string | null; publicPrice: number; memberPrice: number | null; }
async function getProducts(slug: string): Promise<PreviewProduct[]> {
  try {
    const res = await fetch(`${process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/v1/products/public/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch { return []; }
}

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
  if (!data) return { title: 'No encontrado' };
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gym.ldmapp.com';
  const desc = `Únete a ${data.tenant.name}. Entrenamiento personalizado, coaching profesional y resultados reales.`;
  return {
    title: `${data.tenant.name} — Transforma tu cuerpo al máximo`,
    description: desc,
    keywords: ['gimnasio', 'entrenamiento', 'fitness', 'gym', data.tenant.name, 'rutinas', 'nutrición'],
    authors: [{ name: data.tenant.name }],
    openGraph: {
      title: `${data.tenant.name} — Gimnasio`,
      description: desc,
      type: 'website',
      url: `${baseUrl}/${slug}`,
      siteName: data.tenant.name,
      images: [{ url: data.tenant.logo || FALLBACK_IMAGES.hero, width: 1200, height: 630, alt: data.tenant.name }],
    },
    twitter: { card: 'summary_large_image', title: data.tenant.name, description: desc, images: [data.tenant.logo || FALLBACK_IMAGES.hero] },
    alternates: { canonical: `${baseUrl}/${slug}` },
  };
}

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [data, products] = await Promise.all([getLanding(slug), getProducts(slug)]);
  if (!data) notFound();

  // Textos editables desde el panel admin (con fallbacks)
  const heroTitle = getText(data.content, 'home', 'hero', 'title', 'TRANSFORMA TU\nCUERPO AL MÁXIMO');
  const heroSubtitle = getText(data.content, 'home', 'hero', 'subtitle', 'Tu transformación empieza aquí');
  const heroDescription = getText(data.content, 'home', 'hero', 'description', 'Entrenamiento personalizado, coaching profesional y un espacio diseñado para que consigas resultados reales. Sin excusas.');
  const heroImage = getText(data.content, 'home', 'hero', 'image', FALLBACK_IMAGES.hero);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${process.env.NEXT_PUBLIC_SITE_URL || 'https://gym.ldmapp.com'}/${slug}`,
    name: data.tenant.name,
    description: `Gimnasio ${data.tenant.name} — Entrenamiento personalizado y coaching profesional`,
    telephone: data.tenant.phone || '',
    email: data.tenant.email || '',
    address: data.tenant.address ? { '@type': 'PostalAddress', streetAddress: data.tenant.address } : undefined,
    image: data.tenant.logo || FALLBACK_IMAGES.hero,
    priceRange: '$$',
    openingHours: 'Mo-Fr 05:00-22:00, Sa 06:00-20:00, Su 07:00-14:00',
  };

  return (
    <div className="min-h-screen text-foreground page-enter" style={{ background: 'var(--gym-ink)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Navegación */}
      <MobileTopNav slug={slug} tenantName={data.tenant.name} />
      <LandingNav slug={slug} activePage="inicio" />

      {/* Hero — Full-width con imagen de fondo */}
      <LandingHero
        slug={slug}
        heroImage={heroImage}
        title={heroTitle}
        subtitle={heroSubtitle}
        description={heroDescription}
      />

      {/* Marquee */}
      <Marquee />

      {/* Stats del gym */}
      <StatsSection />

      {/* App Features */}
      <AppFeaturesSection />

      {/* Choose Us */}
      <ChooseUsSection />

      {/* Coaches */}
      <CoachesSection />

      {/* Shop preview */}
      <ShopPreviewSection slug={slug} products={products} />

      {/* App Tracking */}
      <AppTrackingSection />

      {/* FAQ breve */}
      <FAQPreviewSection />

      {/* CTA Final */}
      <FinalCTA slug={slug} />

      {/* Footer — datos del tenant */}
      <LandingFooter
        slug={slug}
        tenantName={data.tenant.name}
        phone={data.tenant.phone}
        email={data.tenant.email}
        address={data.tenant.address}
      />

      <div className="md:hidden h-20" />
    </div>
  );
}
