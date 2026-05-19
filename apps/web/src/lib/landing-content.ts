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
 * Imágenes de fallback cuando no hay imageUrl/photos en la DB
 */
const CDN = 'https://res.cloudinary.com/dnqkkd5nj/image/upload';

export const FALLBACK_IMAGES = {
  hero: `${CDN}/v1773893224/gym-app/landing/hero-gym.jpg`,
  services: [
    `${CDN}/v1773893265/gym-app/landing/personal-training.jpg`,
    `${CDN}/v1773893260/gym-app/landing/boxing.jpg`,
    `${CDN}/v1773893256/gym-app/landing/zone-yoga.jpg`,
    `${CDN}/v1773893254/gym-app/landing/zone-cardio.jpg`,
    `${CDN}/v1773893267/gym-app/landing/zone-funcional.jpg`,
    `${CDN}/v1773893252/gym-app/landing/zone-pesas.jpg`,
  ],
  facilities: [
    `${CDN}/v1773893252/gym-app/landing/zone-pesas.jpg`,
    `${CDN}/v1773893254/gym-app/landing/zone-cardio.jpg`,
    `${CDN}/v1773893267/gym-app/landing/zone-funcional.jpg`,
    `${CDN}/v1773893256/gym-app/landing/zone-yoga.jpg`,
    `${CDN}/v1773893258/gym-app/landing/spinning.jpg`,
    `${CDN}/v1773893269/gym-app/landing/vestidores.jpg`,
  ],
  coach: `${CDN}/v1773893250/gym-app/landing/coach.jpg`,
  pesas: `${CDN}/v1773893252/gym-app/landing/zone-pesas.jpg`,
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
