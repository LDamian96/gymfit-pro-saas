import { MobileBottomNav } from '@/components/landing/mobile-nav';

// Landing forzado en dark — el skill frontend-design vive en oscuro.
// Las tipografías (Archivo Black, Bebas Neue, JetBrains, Plus Jakarta) ya están
// cargadas en el root layout y disponibles vía clases (.font-display, etc.).
export default async function LandingSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="dark min-h-screen text-foreground" style={{ background: 'var(--gym-ink)' }}>
      {children}
      <MobileBottomNav slug={slug} />
    </div>
  );
}
