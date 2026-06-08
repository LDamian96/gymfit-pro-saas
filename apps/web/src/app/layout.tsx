import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Bebas_Neue, Archivo_Black, JetBrains_Mono } from "next/font/google";
import { ClientThemeHydrator } from "@/components/providers/theme-hydrator";
import "./globals.css";

// Script INLINE en <head> — aplica el tema desde localStorage ANTES de
// cualquier render de React. Sin flicker, sin race condition con
// useClientTheme. Antes habia DOS sistemas (next-themes + useClientTheme)
// con defaults distintos compitiendo: por eso a veces el panel salia dark
// despues de un logout, o algunas partes en otro tema tras navegacion.
const THEME_INIT_SCRIPT = `
(function(){
  try {
    var t = localStorage.getItem('gymfit-client-theme');
    if (t !== 'dark' && t !== 'light') t = 'light';
    document.documentElement.classList.add(t);
    // Sincroniza la barra del navegador (URL/status bar) con el tema
    // ANTES de render para evitar flicker entre light->dark al cargar.
    var col = t === 'dark' ? '#0A0B0D' : '#F7F5F1';
    var m = document.querySelector('meta[name="theme-color"]:not([media])');
    if (!m) { m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); }
    m.content = col;
    // Sobreescribe las variantes con media (las que mete Next del viewport)
    document.querySelectorAll('meta[name="theme-color"][media]').forEach(function(x){ x.content = col; });
  } catch(e) {
    document.documentElement.classList.add('light');
  }
})();
`;

// Body — Plus Jakarta para texto general, números tabulares.
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

// Display — Archivo Black para títulos pesados (vibe gym poster).
const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

// Display compacto — Bebas Neue para hero numerals (estilo athletic poster).
const bebas = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

// Mono — JetBrains para QR/IDs/timestamps.
const jetBrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GymFit Pro",
  description: "Tu gimnasio, tu transformación",
  metadataBase: new URL("https://gym.ldmapp.com"),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAFA" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0B" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Tema aplicado SINCRONO antes de cualquier render — sin flicker */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {/* Pre-conexión al backend → ahorra 100-300ms en el primer fetch */}
        {process.env.NEXT_PUBLIC_API_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL} crossOrigin="use-credentials" />
        )}
        {/* DNS-prefetch para Cloudinary (imágenes) */}
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body
        className={`${plusJakarta.variable} ${archivoBlack.variable} ${bebas.variable} ${jetBrains.variable} antialiased`}
        style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif" }}
      >
        <ClientThemeHydrator />
        {children}
      </body>
    </html>
  );
}
