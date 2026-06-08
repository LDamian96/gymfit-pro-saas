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

export function SchemaOrg({ data, slug, baseUrl }: Props) {
  const url = `${baseUrl}/${slug}`;
  const loc = extractLocation(data.tenant.address);
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
          addressRegion: loc.city,
          addressCountry: 'PE',
        }
      : undefined,
    // Horario tipico de gym — el admin puede ajustar despues
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '06:00', closes: '22:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '07:00', closes: '20:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Sunday'], opens: '08:00', closes: '14:00' },
    ],
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
    sameAs: [], // si agregas redes sociales del gym, van aqui
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
