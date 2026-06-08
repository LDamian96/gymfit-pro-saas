// Helper para obtener contenido dinámico del landing desde LandingContent
// El admin puede editar textos e imágenes por sección+página

export interface LandingContentItem {
  id: string;
  section: string;
  page: string;
  content: Record<string, string | string[] | Record<string, string>[]>;
  order: number;
}

/**
 * Busca contenido de una sección específica en una página
 * Retorna el JSON content o undefined si no existe
 */
export function getContent(
  contents: LandingContentItem[],
  page: string,
  section: string,
): Record<string, string | string[] | Record<string, string>[]> | undefined {
  const item = contents.find((c) => c.page === page && c.section === section);
  return item?.content;
}

/**
 * Obtiene un valor string de contenido con fallback
 */
export function getText(
  contents: LandingContentItem[],
  page: string,
  section: string,
  key: string,
  fallback: string,
): string {
  const content = getContent(contents, page, section);
  if (!content || typeof content[key] !== 'string') return fallback;
  return content[key] as string;
}

/**
 * Interfaz compartida de datos del landing
 */
export interface LandingData {
  tenant: {
    name: string;
    slug: string;
    logo: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    // SEO + AEO fields editables desde panel admin
    district?: string | null;
    city?: string | null;
    region?: string | null;
    country?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    instagramUrl?: string | null;
    facebookUrl?: string | null;
    tiktokUrl?: string | null;
    whatsappNumber?: string | null;
    googleMapsUrl?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    seoKeywords?: string | null;
    openingHours?: Record<string, { open: string; close: string } | null> | null;
  };
  content: LandingContentItem[];
  services: {
    id: string;
    name: string;
    description: string;
    iconName: string;
    imageUrl: string | null;
  }[];
  plans: {
    id: string;
    name: string;
    price: number;
    duration: number;
    features: string[];
    isPopular: boolean;
  }[];
  facilities: {
    id: string;
    name: string;
    description: string;
    photos: string[];
  }[];
  classes: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    maxCapacity: number;
    instructor: { firstName: string; lastName: string };
  }[];
  faqs: { id: string; question: string; answer: string }[];
  amenities: { id: string; name: string; iconName: string }[];
}

/**
 * Imágenes de fallback cuando no hay imageUrl/photos en la DB.
 *
 * Servidas desde el CDN de Unsplash (images.unsplash.com), que permite hotlink
 * y entrega WebP/AVIF optimizado con `auto=format`. Tono oscuro/cinematográfico
 * coherente con la estética dark + naranja del landing. IDs estables y curados
 * temáticamente (pesas, cardio, coach, boxing, yoga, spinning, vestidores).
 */
const U = 'https://images.unsplash.com';

// Helper: arma una URL de Unsplash optimizada. `crop=entropy` centra en el
// sujeto; calidad 80 + auto-format mantiene la imagen ligera para LCP.
function ux(id: string, w = 1600): string {
  return `${U}/${id}?auto=format&fit=crop&crop=entropy&w=${w}&q=80`;
}

export const FALLBACK_IMAGES = {
  // Gimnasio oscuro y dramático — funciona de fondo del hero con overlay.
  hero: ux('photo-1534438327276-14e5300c3a48', 2000),
  services: [
    ux('photo-1571388208497-71bedc66e932'), // entrenamiento personal
    ux('photo-1549719386-74dfcbf7dbed'),     // boxing
    ux('photo-1588286840104-8957b019727f'),  // yoga
    ux('photo-1538805060514-97d9cc17730c'),  // cardio / cinta
    ux('photo-1517963879433-6ad2b056d712'),  // funcional / kettlebell
    ux('photo-1581009146145-b5ef050c2e1e'),  // zona de pesas
  ],
  facilities: [
    ux('photo-1581009146145-b5ef050c2e1e'),  // zona de pesas
    ux('photo-1538805060514-97d9cc17730c'),  // zona cardio
    ux('photo-1517963879433-6ad2b056d712'),  // zona funcional
    ux('photo-1588286840104-8957b019727f'),  // yoga
    ux('photo-1518310383802-640c2de311b2'),  // spinning
    ux('photo-1574680096145-d05b474e2155'),  // vestidores / interior limpio
  ],
  coach: ux('photo-1571388208497-71bedc66e932'),  // coach con cliente
  pesas: ux('photo-1581009146145-b5ef050c2e1e'),  // zona de pesas
};

/**
 * Obtiene la imagen de un servicio con fallback
 */
export function getServiceImage(service: { imageUrl: string | null }, index: number): string {
  return service.imageUrl || FALLBACK_IMAGES.services[index] || FALLBACK_IMAGES.services[0];
}

/**
 * Obtiene la foto de una instalación con fallback
 */
export function getFacilityImage(facility: { photos: string[] }, index: number): string {
  return facility.photos?.[0] || FALLBACK_IMAGES.facilities[index] || FALLBACK_IMAGES.facilities[0];
}
