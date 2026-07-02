import type { MetadataRoute } from 'next';

// Sitemap RAIZ (/sitemap.xml) — es el que robots.txt anuncia a Google/IAs.
// Antes solo existia el sitemap por-slug ((landing)/[slug]/sitemap.ts) y el
// raiz devolvia 404. Lista las paginas publicas de cada gimnasio activo.
const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://gym.ldmapp.com';
const API = process.env.API_INTERNAL_URL || process.env.API_URL || 'http://localhost:3002';

async function getSlugs(): Promise<string[]> {
  try {
    // El landing publico expone el tenant por slug; sin endpoint de listado,
    // validamos el slug principal. Si en el futuro hay multiples tenants,
    // agregar aqui un endpoint publico de slugs.
    const res = await fetch(`${API}/api/v1/landing/gymfit-pro`, { next: { revalidate: 3600 } });
    return res.ok ? ['gymfit-pro'] : [];
  } catch {
    return ['gymfit-pro'];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getSlugs();
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];
  for (const slug of slugs) {
    entries.push(
      { url: `${BASE}/${slug}`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
      { url: `${BASE}/${slug}/servicios`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
      { url: `${BASE}/${slug}/planes`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
      { url: `${BASE}/${slug}/instalaciones`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
      { url: `${BASE}/${slug}/tienda`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    );
  }
  return entries;
}
