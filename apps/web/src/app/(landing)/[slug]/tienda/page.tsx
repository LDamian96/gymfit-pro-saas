import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MobileTopNav } from '@/components/landing/mobile-nav';
import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';
import { type LandingData } from '@/lib/landing-content';
import { ShopBrowser } from '@/components/landing/shop-browser';

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
  if (!data) return { title: 'Tienda no encontrada' };
  return {
    title: `Tienda & Suplementos — ${data.tenant.name}`,
    description: `Suplementos, proteínas y accesorios en ${data.tenant.name}. Precios especiales para miembros.`,
  };
}

export default async function TiendaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getLanding(slug);
  if (!data) notFound();

  return (
    <div className="min-h-screen text-foreground page-enter" style={{ background: 'var(--gym-ink)' }}>
      <MobileTopNav slug={slug} tenantName={data.tenant.name} />
      <LandingNav slug={slug} activePage="tienda" />

      <ShopBrowser slug={slug} tenantName={data.tenant.name} />

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
