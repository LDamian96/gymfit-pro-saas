import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compresión gzip/brotli en el servidor Next
  compress: true,

  // Quita header "X-Powered-By: Next.js"
  poweredByHeader: false,

  // Genera ETags para cache validation
  generateEtags: true,

  // Sin source maps en producción → menos peso, build más rápido
  productionBrowserSourceMaps: false,

  // Tree-shaking agresivo de paquetes pesados
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "date-fns",
      "recharts",
      "@base-ui/react",
      "sonner",
      "next-themes",
    ],
    // Cache de fetch del lado servidor más eficiente
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },

  images: {
    // Formatos modernos: AVIF (mejor) primero, WebP como fallback
    formats: ["image/avif", "image/webp"],
    // Cache de imágenes optimizadas: 1 año
    minimumCacheTTL: 31536000,
    // Tamaños comunes para srcset automático
    deviceSizes: [360, 640, 768, 1024, 1280, 1600],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "source.unsplash.com" },
    ],
  },

  // Headers para Cloudflare CDN + browser cache
  async headers() {
    return [
      // Assets estáticos de Next: hash en el nombre → immutable 1 año
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "CDN-Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Imágenes optimizadas por Next
      {
        source: "/_next/image",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "CDN-Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Imágenes y fuentes en /public
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico|woff|woff2|ttf|otf)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "CDN-Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // HTML del panel: NUNCA cachear en CDN (datos privados por usuario)
      {
        source: "/dashboard/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
          { key: "CDN-Cache-Control", value: "no-store" },
        ],
      },
      // Hardening básico
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
