import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, QrCode, Activity, Dumbbell, MessageSquare, Check, Smartphone, BarChart3, ShoppingBag, Package, ShieldCheck, Clock4, MapPin, TrendingUp } from 'lucide-react';

// Todas las imágenes desde el CDN de Unsplash (hotlink permitido, entrega
// WebP/AVIF con auto=format). IDs verificados y estables, tono oscuro/gimnasio
// coherente con la estética dark + naranja. Reemplaza Cloudinary roto.
const uimg = (id: string, w = 1100) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&crop=entropy&w=${w}&q=80`;

const IMG = {
  coach: uimg('photo-1571388208497-71bedc66e932'),    // coach con cliente
  pesas: uimg('photo-1581009146145-b5ef050c2e1e'),     // zona de pesas
  cardio: uimg('photo-1538805060514-97d9cc17730c'),    // zona cardio
  personal: uimg('photo-1571388208497-71bedc66e932'),  // entrenamiento personal
  funcional: uimg('photo-1517963879433-6ad2b056d712'), // funcional / kettlebell
};

const UNSPLASH = {
  appPhone: uimg('photo-1556817411-31ae72fa3ea0', 900),     // app fitness en teléfono
  groupGym: uimg('photo-1534438327276-14e5300c3a48', 1400),  // gimnasio dramático
  athlete: uimg('photo-1571019613454-1cb2f99b2d8b', 1200),   // atleta entrenando
  facilityMain: uimg('photo-1540497077202-7c8a3999166f', 1400), // interior gym
  facility1: uimg('photo-1517836357463-d25dfeac3438', 900),  // entrenamiento
  facility2: uimg('photo-1538805060514-97d9cc17730c', 900),  // cardio
  facility3: uimg('photo-1574680096145-d05b474e2155', 900),  // interior limpio
  facility4: uimg('photo-1518310383802-640c2de311b2', 900),  // spinning
};

// === Eyebrow reutilizable ===
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <span className="w-6 h-[2px] rounded-full" style={{ background: 'var(--gym-orange)' }} />
      <span className="label-athletic" style={{ color: 'var(--gym-orange)' }}>/ {children}</span>
    </div>
  );
}

// === SECCIÓN: App Features ===
export function AppFeaturesSection() {
  const features = [
    { icon: QrCode, title: 'Acceso QR', desc: 'Ingresa al gym con tu código.' },
    { icon: Activity, title: 'Tracking', desc: 'Mide tu progreso semanal.' },
    { icon: Dumbbell, title: 'Rutinas', desc: 'Plan diseñado por tu coach.' },
    { icon: MessageSquare, title: 'Chat coach', desc: 'Dudas resueltas al instante.' },
  ];

  return (
    <section className="relative px-4 md:px-16 py-16 md:py-32 grain" style={{ background: 'var(--gym-ink)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-16">
          <Eyebrow>Tu app fitness</Eyebrow>
          <h2 className="font-display mt-3 text-foreground leading-[0.95]" style={{ fontSize: 'clamp(2.4rem, 6vw, 4.4rem)' }}>
            TODO EN <span style={{ color: 'var(--gym-orange)' }}>TU BOLSILLO</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {features.map((f) => (
              <div key={f.title} className="glass-card rounded-2xl p-4 md:p-6 lift">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl fire-card flex items-center justify-center mb-3">
                  <f.icon className="h-5 w-5 md:h-6 md:w-6 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="font-display text-foreground text-[14px] md:text-[16px] mb-1 tracking-tight">{f.title}</h3>
                <p className="text-[12px] md:text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="relative aspect-[4/3] md:aspect-[5/6] rounded-2xl md:rounded-3xl overflow-hidden order-first md:order-last shine-border">
            <Image src={UNSPLASH.appPhone} alt="App fitness" fill className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,90,31,0.20) 0%, transparent 60%)' }} />
            <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 glass-card warm rounded-xl p-3 md:p-4">
              <p className="label-athletic" style={{ color: 'var(--gym-orange)' }}>/ iOS · Android</p>
              <p className="font-display text-foreground text-[15px] md:text-[18px] mt-1.5 leading-tight">Descarga gratis con tu membresía</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// === SECCIÓN: Choose Us ===
export function ChooseUsSection() {
  const features = [
    'Coaches certificados',
    'Equipamiento premium',
    'Seguimiento semanal',
    'Nutrición incluida',
    'Acceso 7 días',
    'App exclusiva',
  ];

  return (
    <section className="relative px-4 md:px-16 py-16 md:py-32 grain" style={{ background: 'var(--gym-coal)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
          {/* Imagen */}
          <div className="relative h-[340px] md:h-[560px] rounded-2xl md:rounded-3xl overflow-hidden shine-border order-2 md:order-1">
            <Image src={IMG.pesas} alt="Zona de entrenamiento" fill className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(10,11,13,0.65) 100%)' }} />
            <div className="absolute bottom-5 left-5 right-5 md:bottom-7 md:left-7 md:right-7 flex gap-4 md:gap-8">
              {[
                { v: '4.9', l: 'Rating' },
                { v: '98', l: 'Retención', suffix: '%' },
                { v: '5', l: 'Años', suffix: '+' },
              ].map((s) => (
                <div key={s.l}>
                  <div className="flex items-baseline">
                    <span className="hero-num" style={{ fontSize: 'clamp(28px, 4vw, 44px)', color: 'var(--gym-orange)' }}>{s.v}</span>
                    {s.suffix && <span className="font-display text-[16px] md:text-[20px]" style={{ color: 'var(--gym-orange)' }}>{s.suffix}</span>}
                  </div>
                  <span className="label-athletic block mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Texto */}
          <div className="order-1 md:order-2">
            <Eyebrow>¿Por qué elegirnos?</Eyebrow>
            <h2 className="font-display mt-3 text-foreground leading-[0.92]" style={{ fontSize: 'clamp(2.4rem, 6vw, 4.4rem)' }}>
              MÁS QUE <br /><span style={{ color: 'var(--gym-orange)' }}>UN GIMNASIO</span>
            </h2>
            <p className="mt-5 text-base md:text-[17px] leading-relaxed max-w-md" style={{ color: 'rgba(255,255,255,0.65)' }}>
              No somos solo máquinas y pesas. Somos un equipo comprometido con tu transformación.
            </p>
            <ul className="grid grid-cols-2 gap-2 md:gap-3 mt-8">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-[13px] md:text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(255,90,31,0.15)' }}>
                    <Check className="h-3 w-3" style={{ color: 'var(--gym-orange)' }} strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// === SECCIÓN: Tu progreso visible ===
export function AppTrackingSection() {
  const items = [
    { icon: BarChart3, text: 'Registro de peso, grasa y masa muscular con historial completo' },
    { icon: Dumbbell, text: 'Rutinas personalizadas por día con series, reps y peso' },
    { icon: QrCode, text: 'Check-in con QR al llegar al gym — sin filas ni tarjetas' },
    { icon: Smartphone, text: 'Ve tu evolución desde cualquier dispositivo, cuando quieras' },
  ];

  return (
    <section className="relative px-4 md:px-16 py-16 md:py-32 grain" style={{ background: 'var(--gym-ink)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="relative">
            <div className="relative h-[360px] md:h-[540px] rounded-2xl md:rounded-3xl overflow-hidden shine-border">
              <Image src={IMG.cardio} alt="Tu progreso" fill className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(10,11,13,0.85) 100%)' }} />
            </div>
            <div className="hidden md:grid absolute -bottom-6 left-6 right-6 grid-cols-3 gap-3">
              {[
                { v: 'PESO · GRASA', l: 'Medidas' },
                { v: 'POR DÍA', l: 'Rutinas' },
                { v: 'QR · 24/7', l: 'Check-in' },
              ].map((s) => (
                <div key={s.l} className="glass-card rounded-xl p-3 text-center">
                  <p className="font-display text-[12px] text-foreground tracking-tight">{s.v}</p>
                  <p className="label-athletic mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Eyebrow>Tu evolución</Eyebrow>
            <h2 className="font-display mt-3 text-foreground leading-[0.92]" style={{ fontSize: 'clamp(2.2rem, 5.5vw, 4rem)' }}>
              TU PROGRESO,<br /><span style={{ color: 'var(--gym-orange)' }}>SIEMPRE VISIBLE</span>
            </h2>
            <p className="mt-5 text-base md:text-[17px] leading-relaxed max-w-md" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Tu coach registra tus medidas cada sesión. Vos ves tu evolución completa desde el celular.
            </p>
            <div className="space-y-3 mt-8">
              {items.map((f) => (
                <div key={f.text} className="glass-card rounded-xl p-3.5 md:p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg fire-card flex items-center justify-center shrink-0">
                    <f.icon className="h-4 w-4 text-white" strokeWidth={2.5} />
                  </div>
                  <p className="text-[13px] md:text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.78)' }}>{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// === SECCIÓN: Coaches ===
export function CoachesSection() {
  const checks = ['Plan 100% personalizado', 'Ajustes semanales', 'Chat en la app', 'Métricas corporales', 'Corrección en tiempo real'];

  return (
    <section className="relative px-4 md:px-16 py-16 md:py-32 grain" style={{ background: 'var(--gym-coal)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="relative h-[360px] md:h-[560px] rounded-2xl md:rounded-3xl overflow-hidden shine-border">
            <Image src={IMG.coach} alt="Coach" fill className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(10,11,13,0.7) 100%)' }} />
            <div className="absolute top-5 right-5 md:top-6 md:right-6 fire-card px-3.5 py-1.5 md:px-4 md:py-2 rounded-lg">
              <span className="font-display text-[11px] md:text-[13px] tracking-wider text-white">12 COACHES</span>
            </div>
            <div className="absolute bottom-5 left-5 right-5 md:bottom-7 md:left-7 md:right-7">
              <span className="label-athletic" style={{ color: 'rgba(255,255,255,0.6)' }}>/ Coach destacada</span>
              <p className="font-display text-foreground text-[18px] md:text-[24px] mt-1 leading-tight">CARLA · Strength &amp; Conditioning</p>
            </div>
          </div>
          <div>
            <Eyebrow>Coaching personal</Eyebrow>
            <h2 className="font-display mt-3 text-foreground leading-[0.92]" style={{ fontSize: 'clamp(2.4rem, 6vw, 4.4rem)' }}>
              NUNCA <br /><span style={{ color: 'var(--gym-orange)' }}>ENTRENAS SOLO</span>
            </h2>
            <p className="mt-5 text-base md:text-[17px] leading-relaxed max-w-md" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Cada miembro tiene un coach asignado. Te guía, te corrige, celebra tus PRs.
            </p>
            <ul className="space-y-2.5 mt-8">
              {checks.map((c) => (
                <li key={c} className="flex items-center gap-3 text-[13px] md:text-sm" style={{ color: 'rgba(255,255,255,0.78)' }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(255,90,31,0.15)' }}>
                    <Check className="h-3 w-3" style={{ color: 'var(--gym-orange)' }} strokeWidth={3} />
                  </span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// === SECCIÓN: Stats ===
export function StatsSection() {
  const stats = [
    { value: '500', suffix: '+', label: 'Miembros activos', icon: TrendingUp },
    { value: '15', suffix: '', label: 'Coaches certificados', icon: ShieldCheck },
    { value: '24', suffix: '/7', label: 'Acceso con QR', icon: Clock4 },
    { value: '2K', suffix: 'm²', label: 'Área total', icon: MapPin },
  ];
  return (
    <section className="relative px-4 md:px-16 py-12 md:py-20 grain" style={{ background: 'var(--gym-ink)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl md:rounded-[28px]">
          <Image src={UNSPLASH.groupGym} alt="Comunidad" fill className="object-cover opacity-40" sizes="(min-width: 1024px) 1100px, 100vw" />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, rgba(10,11,13,0.92) 0%, rgba(20,22,26,0.78) 50%, rgba(255,90,31,0.18) 100%)',
            }}
          />
          <div className="relative p-6 md:p-12">
            <div className="text-center mb-6 md:mb-10">
              <Eyebrow>Nuestros números</Eyebrow>
              <h2 className="font-display mt-3 text-foreground leading-[0.95]" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
                LA COMUNIDAD <span style={{ color: 'var(--gym-orange)' }}>CRECE</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
              {stats.map((s) => (
                <div key={s.label} className="glass-card rounded-2xl p-5 md:p-7">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl fire-card flex items-center justify-center mb-3">
                    <s.icon className="h-5 w-5 md:h-6 md:w-6 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex items-baseline">
                    <span className="hero-num" style={{ fontSize: 'clamp(36px, 5vw, 56px)', color: 'var(--gym-orange)' }}>
                      {s.value}
                    </span>
                    {s.suffix && (
                      <span className="font-display ml-0.5" style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', color: 'var(--gym-orange)' }}>
                        {s.suffix}
                      </span>
                    )}
                  </div>
                  <p className="label-athletic mt-2" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// === SECCIÓN: Gallery ===
interface GalleryFacility { id: string; name: string; photos: string[]; description: string | null }
const FALLBACK_FACILITIES: GalleryFacility[] = [
  { id: 'f1', name: 'Zona de Pesas', photos: [UNSPLASH.facilityMain], description: 'Equipos premium de free weights y máquinas guiadas' },
  { id: 'f2', name: 'Cardio HIIT', photos: [UNSPLASH.facility1], description: 'Cintas, bicicletas, elípticas y remos profesionales' },
  { id: 'f3', name: 'Funcional & CrossFit', photos: [UNSPLASH.facility2], description: 'Box completo con racks, kettlebells y anillas' },
  { id: 'f4', name: 'Sala de Spinning', photos: [UNSPLASH.facility3], description: 'Bicicletas profesionales con clases en vivo' },
  { id: 'f5', name: 'Boxeo & Combate', photos: [UNSPLASH.facility4], description: 'Sacos, ring y entrenadores certificados' },
  { id: 'f6', name: 'Vestidores Premium', photos: [UNSPLASH.facility1], description: 'Casilleros, duchas con agua caliente' },
];
export function GallerySection({ slug, facilities }: { slug: string; facilities: GalleryFacility[] }) {
  const real = facilities.filter((f) => f.photos && f.photos.length > 0);
  const items = (real.length > 0 ? real : FALLBACK_FACILITIES).slice(0, 6);

  return (
    <section className="relative px-4 md:px-16 py-16 md:py-32 grain" style={{ background: 'var(--gym-coal)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-10 md:mb-14 gap-3">
          <div>
            <Eyebrow>Nuestras instalaciones</Eyebrow>
            <h2 className="font-display mt-3 text-foreground leading-[0.92]" style={{ fontSize: 'clamp(2.4rem, 6vw, 4.4rem)' }}>
              UN ESPACIO <span style={{ color: 'var(--gym-orange)' }}>BRUTAL</span>
            </h2>
          </div>
          <Link href={`/${slug}/instalaciones`} className="hidden md:inline-flex items-center gap-2 label-athletic press" style={{ color: 'var(--gym-orange)' }}>
            Ver todas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {items.map((f, i) => (
            <Link
              key={f.id}
              href={`/${slug}/instalaciones`}
              className={`group relative overflow-hidden rounded-2xl press ${i === 0 ? 'md:col-span-2 md:row-span-2 aspect-square md:aspect-[4/5]' : 'aspect-[4/5]'}`}
            >
              <Image src={f.photos[0]} alt={f.name} fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,11,13,0.88) 0%, transparent 55%)' }} />
              <div className="absolute top-3 left-3 px-2 py-1 rounded-md fire-card">
                <span className="font-display text-white text-[10px] tracking-wider">/ {String(i + 1).padStart(2, '0')}</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                <h3 className="font-display text-foreground text-[16px] md:text-[22px] leading-tight tracking-tight">{f.name}</h3>
                {f.description && <p className="text-[11px] md:text-[12px] mt-1 line-clamp-2" style={{ color: 'rgba(255,255,255,0.6)' }}>{f.description}</p>}
              </div>
            </Link>
          ))}
        </div>
        <Link href={`/${slug}/instalaciones`} className="md:hidden mt-6 inline-flex items-center gap-2 label-athletic" style={{ color: 'var(--gym-orange)' }}>
          Ver todas <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

// === SECCIÓN: Shop preview ===
interface PreviewProduct { id: string; name: string; imageUrl: string | null; category: string | null; publicPrice: number; memberPrice: number | null; }
export function ShopPreviewSection({ slug, products }: { slug: string; products: PreviewProduct[] }) {
  const items = products.slice(0, 4);

  return (
    <section className="relative px-4 md:px-16 py-16 md:py-32 grain" style={{ background: 'var(--gym-ink)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header — Mobile: centrado y compacto. Desktop: 2 columnas con CTA a la derecha */}
        <div className="md:flex md:items-end md:justify-between md:gap-10 mb-10 md:mb-14">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2.5 mb-3">
              <span className="w-6 h-[2px] rounded-full" style={{ background: 'var(--gym-orange)' }} />
              <span className="label-athletic inline-flex items-center gap-1.5" style={{ color: 'var(--gym-orange)' }}>
                <ShoppingBag className="h-3 w-3" /> / Tienda
              </span>
              <span className="w-6 h-[2px] rounded-full md:hidden" style={{ background: 'var(--gym-orange)' }} />
            </div>
            <h2 className="font-display text-foreground leading-[0.92] tracking-tight" style={{ fontSize: 'clamp(2.4rem, 6vw, 4.4rem)' }}>
              PROTEÍNA <span style={{ color: 'var(--gym-orange)' }}>&amp; MÁS</span>
            </h2>
            <p className="mt-4 text-[13px] md:text-[15px] max-w-md mx-auto md:mx-0" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Suplementos premium con <span style={{ color: 'var(--gym-lime, #84CC16)', fontWeight: 700 }}>precio miembro</span> en cada producto.
            </p>
          </div>
          <Link
            href={`/${slug}/tienda`}
            className="press hidden md:inline-flex items-center gap-2 px-5 py-3 rounded-xl shrink-0"
            style={{
              background: 'rgba(255,90,31,0.10)',
              border: '1px solid rgba(255,90,31,0.25)',
              color: 'var(--gym-orange)',
            }}
          >
            <span className="label-athletic">Ver tienda</span>
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="glass-card rounded-3xl p-10 md:p-16 text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 fire-card flex items-center justify-center">
              <Package className="h-8 w-8 text-white" strokeWidth={1.5} />
            </div>
            <h3 className="font-display text-foreground text-[20px] md:text-[26px] tracking-tight">TIENDA PRÓXIMAMENTE</h3>
            <p className="text-[12px] md:text-[13px] mt-2 max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Estamos seleccionando los mejores suplementos. Pronto disponibles.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {items.map((p, i) => {
              const hasDiscount = p.memberPrice != null && p.memberPrice < p.publicPrice;
              const discount = hasDiscount ? Math.round((1 - p.memberPrice! / p.publicPrice) * 100) : 0;
              return (
                <Link
                  key={p.id}
                  href={`/${slug}/tienda`}
                  className="group card-fade press-card glass-card rounded-2xl overflow-hidden flex flex-col"
                  style={{ ['--i' as string]: i }}
                >
                  {/* Imagen — más cuadrada, con badge de descuento prominente */}
                  <div className="relative aspect-square overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt={p.name}
                        fill
                        sizes="(min-width: 1024px) 25vw, 50vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12" style={{ color: 'rgba(255,255,255,0.08)' }} strokeWidth={1.5} />
                      </div>
                    )}
                    {p.category && (
                      <span
                        className="absolute top-2.5 left-2.5 px-2 py-1 rounded-md font-display text-[9px] tracking-wider text-foreground"
                        style={{
                          background: 'rgba(10,11,13,0.78)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        {p.category}
                      </span>
                    )}
                    {hasDiscount && (
                      <span
                        className="absolute top-2.5 right-2.5 px-2 py-1 rounded-md font-display text-[10px] tracking-wider text-white"
                        style={{
                          background: 'linear-gradient(135deg, var(--gym-orange) 0%, #E63E00 100%)',
                          boxShadow: '0 4px 12px -4px rgba(255,90,31,0.5)',
                        }}
                      >
                        -{discount}%
                      </span>
                    )}
                  </div>

                  {/* Info — nombre + precios con mejor jerarquía */}
                  <div className="p-3 md:p-4 flex-1 flex flex-col gap-2.5">
                    <h3 className="font-display text-foreground text-[13px] md:text-[15px] leading-tight line-clamp-2 tracking-tight min-h-[2.4em]">
                      {p.name}
                    </h3>
                    <div className="mt-auto">
                      {hasDiscount ? (
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="hero-num" style={{ fontSize: '22px', color: 'var(--gym-lime, #84CC16)' }}>
                            S/ {p.memberPrice!.toFixed(0)}
                          </span>
                          <span
                            className="font-code text-[11px] line-through tnum"
                            style={{ color: 'rgba(255,255,255,0.35)' }}
                          >
                            S/ {p.publicPrice.toFixed(0)}
                          </span>
                        </div>
                      ) : (
                        <span className="hero-num" style={{ fontSize: '22px', color: 'var(--gym-orange)' }}>
                          S/ {p.publicPrice.toFixed(0)}
                        </span>
                      )}
                      {hasDiscount && (
                        <p className="label-athletic mt-1" style={{ color: 'var(--gym-lime, #84CC16)', fontSize: '8px' }}>
                          / Precio miembro
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* CTA mobile — ancho completo con estilo coherente */}
        <Link
          href={`/${slug}/tienda`}
          className="press md:hidden mt-7 flex items-center justify-center gap-2 py-3.5 rounded-xl"
          style={{
            background: 'rgba(255,90,31,0.10)',
            border: '1px solid rgba(255,90,31,0.25)',
            color: 'var(--gym-orange)',
          }}
        >
          <span className="label-athletic">Ver toda la tienda</span>
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      </div>
    </section>
  );
}

// === SECCIÓN: FAQ Preview ===
export function FAQPreviewSection() {
  const faqs = [
    { q: '¿Hay contratos largos?', a: 'No. Todos nuestros planes son mensuales y puedes cancelar cuando quieras.' },
    { q: '¿Necesito experiencia?', a: 'Para nada. Tenemos coaches que te guiarán desde tu primer día.' },
    { q: '¿Qué incluye la membresía?', a: 'Acceso ilimitado al gym, clases grupales, app fitness y plan de entrenamiento.' },
    { q: '¿Puedo probar antes de pagar?', a: 'Sí, ofrecemos una clase de prueba gratuita. Agenda desde la app.' },
  ];
  return (
    <section className="relative px-4 md:px-16 py-16 md:py-32 grain" style={{ background: 'var(--gym-coal)' }}>
      <div className="max-w-6xl mx-auto grid md:grid-cols-[1fr_1.2fr] gap-8 md:gap-14 items-start">
        <div className="md:sticky md:top-24">
          <div className="relative aspect-square md:aspect-[4/5] rounded-2xl md:rounded-3xl overflow-hidden shine-border">
            <Image src={UNSPLASH.athlete} alt="Atleta entrenando" fill className="object-cover" sizes="(min-width: 768px) 40vw, 100vw" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, transparent 35%, rgba(10,11,13,0.92) 100%)' }} />
            <div className="absolute bottom-5 left-5 right-5 md:bottom-7 md:left-7 md:right-7">
              <Eyebrow>FAQ</Eyebrow>
              <p className="font-display text-foreground text-[22px] md:text-[36px] leading-tight mt-3 tracking-tight">
                ¿TIENES <span style={{ color: 'var(--gym-orange)' }}>DUDAS?</span>
              </p>
            </div>
          </div>
        </div>
        <div>
          <div className="hidden md:block mb-8">
            <Eyebrow>Preguntas frecuentes</Eyebrow>
            <h2 className="font-display mt-3 text-foreground leading-[0.92]" style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)' }}>
              TODO LO QUE <br /><span style={{ color: 'var(--gym-orange)' }}>DEBES SABER</span>
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <details key={i} className="group glass-card rounded-2xl p-5 md:p-6 cursor-pointer">
                <summary className="flex items-center justify-between gap-3 list-none">
                  <h3 className="font-display text-foreground text-[14px] md:text-[18px] tracking-tight">{f.q}</h3>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform group-open:rotate-45" style={{ background: 'rgba(255,90,31,0.15)' }}>
                    <span className="text-lg font-black leading-none" style={{ color: 'var(--gym-orange)' }}>+</span>
                  </div>
                </summary>
                <p className="mt-3 text-[13px] md:text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// === SECCIÓN: CTA Final ===
export function FinalCTA({ slug }: { slug: string }) {
  return (
    <section className="px-3 md:px-10 my-8 md:my-16">
      <div
        className="relative overflow-hidden rounded-3xl md:rounded-[36px] py-14 md:py-28 px-6 md:px-16 text-center grain"
        style={{
          background: 'linear-gradient(135deg, var(--gym-orange) 0%, #E63E00 100%)',
        }}
      >
        <span className="absolute -top-20 -left-20 w-80 h-80 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', filter: 'blur(80px)' }} />
        <span className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full" style={{ background: 'rgba(0,0,0,0.15)', filter: 'blur(80px)' }} />

        <div className="relative">
          <span className="label-athletic" style={{ color: 'rgba(0,0,0,0.55)' }}>/ Tu siguiente PR</span>
          <h2 className="font-display mt-4 leading-[0.9]" style={{ fontSize: 'clamp(2.6rem, 7vw, 5.5rem)', color: '#0A0B0D' }}>
            ¿LISTO PARA <br />TRANSFORMARTE?
          </h2>
          <p className="mt-5 text-[14px] md:text-[17px] max-w-md mx-auto" style={{ color: 'rgba(0,0,0,0.7)' }}>
            Tu siguiente nivel empieza con una decisión. No mañana — hoy.
          </p>
          <Link
            href={`/${slug}/planes`}
            className="press mt-8 inline-flex items-center gap-2 px-7 py-3.5 md:px-9 md:py-4 rounded-xl text-[14px] md:text-[15px]"
            style={{
              background: '#0A0B0D',
              color: '#FFFFFF',
              fontFamily: 'var(--font-archivo-black), system-ui',
              letterSpacing: '0.02em',
              boxShadow: '0 12px 32px -8px rgba(0,0,0,0.4)',
            }}
          >
            INSCRÍBETE HOY <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-8">
            {['Sin contrato', '1ra semana gratis', 'Cancela cuando quieras'].map((item) => (
              <span key={item} className="flex items-center gap-1.5 text-[11px] md:text-xs font-bold" style={{ color: 'rgba(0,0,0,0.65)' }}>
                <Check className="h-3.5 w-3.5" strokeWidth={3} /> {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
