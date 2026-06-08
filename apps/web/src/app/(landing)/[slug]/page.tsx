import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MobileTopNav } from '@/components/landing/mobile-nav';
import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';
import { LandingHero } from '@/components/landing/landing-hero';
import { Marquee } from '@/components/landing/marquee';
import { AppFeaturesSection, ChooseUsSection, CoachesSection, AppTrackingSection, FinalCTA, StatsSection, ShopPreviewSection, FAQPreviewSection } from '@/components/landing/landing-sections';
import { SchemaOrg } from '@/components/landing/schema-org';
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

// Extrae distrito/ciudad del address para keywords geograficas.
// "Av. Sur 456, Surco" -> "Surco". "Av. Central 123, San Miguel, Lima" -> "San Miguel".
function extractLocation(address?: string | null): { district: string | null; city: string | null } {
  if (!address) return { district: null, city: null };
  const parts = address.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return { district: null, city: null };
  if (parts.length === 1) return { district: null, city: parts[0] };
  // Asume formato "calle, distrito[, ciudad]"
  return { district: parts[1] ?? null, city: parts[2] ?? parts[1] ?? null };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getLanding(slug);
  if (!data) return { title: 'No encontrado' };
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gym.ldmapp.com';
  // Prioridad: campos editables del admin > extraidos del address legacy
  const fallback = extractLocation(data.tenant.address);
  const district = data.tenant.district || fallback.district;
  const city = data.tenant.city || fallback.city;

  // Titulo SEO-optimizado con ubicacion (clave para "gym en X" queries)
  const locationSuffix = district
    ? ` en ${district}${city && city !== district ? `, ${city}` : ''}`
    : city
      ? ` en ${city}`
      : '';
  // Si el admin definio un seoTitle personalizado, lo usamos. Sino el generado.
  const title = data.tenant.seoTitle?.trim()
    || `${data.tenant.name} — Gimnasio${locationSuffix} | Entrenamiento, Coaching y Resultados`;

  // Descripcion factual + completa (AI extrae esto para responder consultas)
  const planMin = data.plans?.length ? Math.min(...data.plans.map((p) => p.price)) : null;
  const descParts = [
    `${data.tenant.name} es un gimnasio profesional${locationSuffix}.`,
    'Ofrece entrenamiento personalizado, coaching, rutinas con video, clases grupales y nutricion.',
    data.facilities?.length ? `${data.facilities.length} areas de entrenamiento equipadas.` : null,
    data.classes?.length ? `${data.classes.length} clases grupales semanales.` : null,
    planMin ? `Membresias desde S/${planMin}.` : null,
    data.tenant.phone ? `Contacto: ${data.tenant.phone}.` : null,
  ].filter(Boolean);
  // Si el admin definio una seoDescription propia, prevalece
  const desc = data.tenant.seoDescription?.trim() || descParts.join(' ');

  // Keywords: combina auto-generadas + custom del admin
  const autoKeywords = [
    `gimnasio ${district || city || ''}`.trim(),
    `gym ${district || city || ''}`.trim(),
    `mejor gimnasio ${district || city || ''}`.trim(),
    `mejor gym ${district || city || ''}`.trim(),
    `gimnasios cerca de ${district || city || ''}`.trim(),
    `${data.tenant.name}`,
    `entrenamiento personal ${district || ''}`.trim(),
    'fitness', 'crossfit', 'musculacion', 'entrenamiento funcional',
    'clases grupales', 'rutinas de gym', 'nutricion deportiva',
    'membresia gimnasio', 'planes de gym',
  ].filter((k) => k.length > 3);
  // Custom del admin (CSV) + auto-generadas
  const customKeywords = (data.tenant.seoKeywords || '')
    .split(',').map((k) => k.trim()).filter(Boolean);
  const keywords = [...new Set([...customKeywords, ...autoKeywords])];

  return {
    title,
    description: desc,
    keywords,
    authors: [{ name: data.tenant.name }],
    category: 'Health & Fitness',
    openGraph: {
      title,
      description: desc,
      type: 'website',
      url: `${baseUrl}/${slug}`,
      siteName: data.tenant.name,
      locale: 'es_PE',
      images: [{ url: data.tenant.logo || FALLBACK_IMAGES.hero, width: 1200, height: 630, alt: `${data.tenant.name} - Gimnasio${locationSuffix}` }],
    },
    twitter: { card: 'summary_large_image', title, description: desc, images: [data.tenant.logo || FALLBACK_IMAGES.hero] },
    alternates: { canonical: `${baseUrl}/${slug}`, languages: { 'es-PE': `${baseUrl}/${slug}` } },
    robots: {
      index: true, follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
    },
    other: {
      // Geo tags — Google + Bing los usan para resultados locales
      'geo.region': 'PE',
      'geo.placename': district || city || 'Lima',
    },
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

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gym.ldmapp.com';

  return (
    <div className="min-h-screen text-foreground page-enter" style={{ background: 'var(--gym-ink)' }}>
      {/* SEO + AEO: schemas.org (HealthClub, FAQ, Org, Breadcrumb) para
          Google rich snippets + IAs (ChatGPT, Claude, Perplexity, Gemini). */}
      <SchemaOrg data={data} slug={slug} baseUrl={baseUrl} />
      {/* Mantengo el jsonLd legacy minimo por compatibilidad (lo reemplaza SchemaOrg) */}
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
