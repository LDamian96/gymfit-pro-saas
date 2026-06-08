import type { LandingData } from '@/lib/landing-content';

/**
 * Inyecta JSON-LD structured data para SEO + AEO (Answer Engine Optimization).
 * Google lo usa para rich snippets en SERP y resultados locales.
 * Las IAs (ChatGPT, Claude, Perplexity, Gemini) lo extraen para citar el
 * negocio cuando alguien pregunta "mejor gym en X".
 *
 * Esquemas inyectados:
 *  - HealthClub (subtype de LocalBusiness): info principal del gym
 *  - FAQPage: si hay FAQs definidas
 *  - Service por cada servicio destacado
 *  - BreadcrumbList: navegacion
 */
interface Props {
  data: LandingData;
  slug: string;
  baseUrl: string;
}

function extractLocation(address?: string | null): { street: string | null; district: string | null; city: string | null; region: string } {
  if (!address) return { street: null, district: null, city: null, region: 'PE' };
  const parts = address.split(',').map((s) => s.trim()).filter(Boolean);
  return {
    street: parts[0] ?? null,
    district: parts[1] ?? null,
    city: parts[2] ?? parts[1] ?? 'Lima',
    region: 'PE',
  };
}

// Convierte el JSON de openingHours { mon: {open: '06:00', close: '22:00'}, ... }
// al formato schema.org OpeningHoursSpecification.
function buildOpeningHours(oh?: Record<string, { open: string; close: string } | null> | null) {
  const dayMap: Record<string, string> = {
    mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
    fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
  };
  if (!oh || typeof oh !== 'object') {
    // Defaults: Lun-Vie 6-22, Sab 7-20, Dom 8-14
    return [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '06:00', closes: '22:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '07:00', closes: '20:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Sunday'], opens: '08:00', closes: '14:00' },
    ];
  }
  return Object.entries(oh)
    .filter(([, v]) => v && v.open && v.close)
    .map(([k, v]) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: dayMap[k] || k,
      opens: v!.open,
      closes: v!.close,
    }));
}

export function SchemaOrg({ data, slug, baseUrl }: Props) {
  const url = `${baseUrl}/${slug}`;
  // Prioridad: campos editables del admin > extraidos del address legacy
  const fallback = extractLocation(data.tenant.address);
  const loc = {
    street: fallback.street,
    district: data.tenant.district || fallback.district,
    city: data.tenant.city || fallback.city || 'Lima',
    region: data.tenant.region || 'Lima',
  };
  const planMin = data.plans?.length ? Math.min(...data.plans.map((p) => p.price)) : null;
  const planMax = data.plans?.length ? Math.max(...data.plans.map((p) => p.price)) : null;
  const priceRange = planMin && planMax ? `S/${planMin} - S/${planMax}` : 'S/$$';

  // Schema 1: HealthClub (gimnasio) — es el principal
  const healthClub = {
    '@context': 'https://schema.org',
    '@type': ['HealthClub', 'LocalBusiness', 'SportsActivityLocation'],
    '@id': `${url}#gym`,
    name: data.tenant.name,
    description: `Gimnasio profesional${loc.district ? ` en ${loc.district}` : ''}. Entrenamiento personalizado, coaching, clases grupales, rutinas con video y nutricion.`,
    url,
    image: data.tenant.logo || `${baseUrl}/og-default.png`,
    logo: data.tenant.logo,
    telephone: data.tenant.phone,
    email: data.tenant.email,
    priceRange,
    address: data.tenant.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: loc.street,
          addressLocality: loc.district,
          addressRegion: loc.region || loc.city,
          addressCountry: data.tenant.country || 'PE',
        }
      : undefined,
    // Coordenadas para "near me" queries de Google + IA
    geo: data.tenant.latitude && data.tenant.longitude
      ? {
          '@type': 'GeoCoordinates',
          latitude: data.tenant.latitude,
          longitude: data.tenant.longitude,
        }
      : undefined,
    hasMap: data.tenant.googleMapsUrl || undefined,
    // Horarios — editable desde admin, default si no esta seteado
    openingHoursSpecification: buildOpeningHours(data.tenant.openingHours),
    // Facilities como amenityFeature (clave para IA: "qué tiene este gym")
    amenityFeature: data.facilities?.map((f) => ({
      '@type': 'LocationFeatureSpecification',
      name: f.name,
      value: true,
    })) || [],
    // Servicios ofrecidos como hasOfferCatalog
    hasOfferCatalog: data.services?.length
      ? {
          '@type': 'OfferCatalog',
          name: 'Servicios',
          itemListElement: data.services.map((s) => ({
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: s.name,
              description: s.description,
            },
          })),
        }
      : undefined,
    // Planes como Offers
    makesOffer: data.plans?.map((p) => ({
      '@type': 'Offer',
      name: p.name,
      description: p.features?.join(', '),
      price: p.price,
      priceCurrency: 'PEN',
      availability: 'https://schema.org/InStock',
      url,
    })) || [],
    // sameAs: redes sociales — IA las usa para verificar identidad del negocio
    sameAs: [
      data.tenant.instagramUrl,
      data.tenant.facebookUrl,
      data.tenant.tiktokUrl,
      data.tenant.whatsappNumber ? `https://wa.me/${data.tenant.whatsappNumber.replace(/\D/g, '')}` : null,
    ].filter(Boolean),
  };

  // Schema 2: FAQ — las IAs aman las FAQs para extraer respuestas directas
  const faqSchema = data.faqs?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: data.faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.answer,
          },
        })),
      }
    : null;

  // Schema 3: Breadcrumbs
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: data.tenant.name, item: url },
    ],
  };

  // Schema 4: Organization (para entity de marca)
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${url}#org`,
    name: data.tenant.name,
    url,
    logo: data.tenant.logo || `${baseUrl}/og-default.png`,
    contactPoint: data.tenant.phone
      ? {
          '@type': 'ContactPoint',
          telephone: data.tenant.phone,
          contactType: 'customer service',
          areaServed: 'PE',
          availableLanguage: ['es'],
        }
      : undefined,
  };

  const schemas = [healthClub, organization, breadcrumb, faqSchema].filter(Boolean);

  return (
    <>
      {schemas.map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
    </>
  );
}
