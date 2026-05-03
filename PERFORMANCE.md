# Performance — GymFit Pro

> **Objetivo:** panel admin < 1 segundo en cualquier navegación.
> **Stack:** Cloudflare CDN → Hostinger VPS → Next.js (standalone) + NestJS

## ✅ Lo que ya quedó hecho en código

### Frontend (Next.js)
- **Layout del panel pasó a Server Component** — antes hacía fetch del usuario en el navegador (gastaba 200-500ms por navegación). Ahora el HTML llega con el usuario ya hidratado.
- **9 archivos `loading.tsx` con skeletons eliminados** — ya no hay skeletons feos. Next.js mantiene la pantalla anterior visible mientras carga la nueva.
- **In-memory cache TTL: 60s → 5 minutos** con stale-while-revalidate. Navegar entre páginas ya visitadas es instantáneo, refresh en background.
- **Prefetch de datos al hover del sidebar** (`route-prefetch.ts`) — cuando pasás el mouse por "Clientes", ya empieza a cargar la lista. Click = data lista.
- **Fuentes**: 5 → 1 (`Plus Jakarta Sans`). Las dos del landing (Red Hat, Kaushan) se cargan SOLO en `/[slug]/*`. Quitadas 3 fuentes no usadas (Bebas, Space Grotesk, Archivo) que se importaban via CSS.
- **`next.config.ts` reforzado**:
  - `compress: true` — gzip/brotli en servidor
  - `optimizePackageImports` para `lucide-react`, `framer-motion`, `date-fns`, `recharts`, `@base-ui/react`, `sonner`, `next-themes` → tree-shake masivo
  - `output: "standalone"` → imagen Docker más liviana
  - `images.formats: ["image/avif", "image/webp"]` → imágenes 30-50% más livianas
  - `staleTimes` para cache de fetch agresivo
  - Headers `Cache-Control: public, max-age=31536000, immutable` para `/_next/static/*`, `/_next/image`, fuentes y svg
  - Headers `private, no-store` para HTML del panel (datos por usuario)
  - Hardening: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`
- **`<link rel="preconnect">` al backend** + dns-prefetch a Cloudinary → ahorra 100-300ms en el primer request.

### Backend (NestJS)
- **`compression` middleware** — payloads JSON 70-80% más chicos (clave para listas de clientes/pagos).
- **`trust proxy`** — Express recibe IP real del usuario detrás de Cloudflare.
- **Logger silencioso en producción** — menos overhead en cada request.
- **`x-powered-by` deshabilitado** + helmet con CSP off para no romper assets via CDN.

### Seguridad
- **JWT secrets nuevos** (64 bytes base64url) generados con `crypto.randomBytes`.
- **Credenciales SSH movidas** de `.env` → `.secrets.local` (gitignored).
- **`.env.production.example`** actualizado con secrets fuertes y notas de Cloudflare.

---

## 🔧 Configuración de Cloudflare (hacelo en el panel web)

Entrá a https://dash.cloudflare.com → tu dominio `ldmapp.com` → pestaña por pestaña:

### SSL/TLS
- **Modo:** `Full (strict)` — encriptación end-to-end
- **Always Use HTTPS:** `ON`
- **Automatic HTTPS Rewrites:** `ON`
- **Minimum TLS Version:** `1.2`

### Speed → Optimization
- **Auto Minify:** HTML ✅, CSS ✅, JS ✅
- **Brotli:** `ON` — mejor que gzip
- **Early Hints:** `ON` — manda `103` antes del HTML, el navegador empieza a precargar assets antes de que llegue la respuesta
- **Rocket Loader:** `OFF` ⚠️ — rompe Next.js
- **Mirage:** `ON` (gratis en plan paid)
- **Polish:** `Lossy` con WebP — recomprime imágenes en el edge

### Caching → Configuration
- **Caching Level:** `Standard`
- **Browser Cache TTL:** `Respect Existing Headers` (los headers que ya seteo en `next.config.ts` mandan)
- **Crawler Hints:** `ON`

### Caching → Cache Rules (crear estas 2 reglas)

**Regla 1 — assets estáticos:**
- Cuando: URI Path matches `/_next/static/*` OR ends with `.woff2 .woff .svg .png .jpg .jpeg .webp .avif .ico .css .js`
- Cache eligibility: `Eligible for cache`
- Edge TTL: `1 month`
- Browser TTL: `1 year`

**Regla 2 — HTML del panel: NUNCA cachear:**
- Cuando: URI Path starts with `/dashboard` OR `/members` OR `/finances` OR `/staff` OR `/login`
- Cache eligibility: `Bypass cache`

### Network
- **HTTP/3 (QUIC):** `ON` — más rápido en mobile
- **0-RTT Connection Resumption:** `ON`

### Page Rules (alternativa rápida si no quieres Cache Rules)
- `gym.ldmapp.com/_next/static/*` → Cache Level: `Cache Everything`, Edge Cache TTL: `1 month`
- `gym.ldmapp.com/api/*` → Cache Level: `Bypass`

---

## 🖥️ Configuración del VPS (Hostinger)

### Nginx (proxy a Next + NestJS)

```nginx
# /etc/nginx/sites-available/gym.ldmapp.com
upstream nextjs   { server 127.0.0.1:3000; keepalive 64; }
upstream nestjs   { server 127.0.0.1:3002; keepalive 64; }

server {
  listen 443 ssl http2;
  server_name gym.ldmapp.com;

  # SSL: usar certs de Cloudflare Origin (15 años) o Let's Encrypt
  ssl_certificate     /etc/ssl/cloudflare/gym.ldmapp.com.pem;
  ssl_certificate_key /etc/ssl/cloudflare/gym.ldmapp.com.key;

  # Compresión (Cloudflare ya brotli-iza en el edge, pero por si acaso)
  gzip on;
  gzip_vary on;
  gzip_proxied any;
  gzip_min_length 1024;
  gzip_types text/plain text/css text/javascript application/javascript application/json image/svg+xml;

  # Buffers grandes para evitar disco
  client_body_buffer_size 16k;
  client_max_body_size 10m;

  # Static de Next directo desde disk (evita pasar por Node)
  location /_next/static/ {
    alias /var/www/gym/apps/web/.next/static/;
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
    access_log off;
  }

  location /public/ {
    alias /var/www/gym/apps/web/public/;
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
    access_log off;
  }

  # API directo a NestJS
  location /api/ {
    proxy_pass http://nestjs;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header Connection "";
    proxy_buffering on;
    proxy_read_timeout 60s;
  }

  # Resto a Next.js
  location / {
    proxy_pass http://nextjs;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header Connection "";
  }
}

server {
  listen 80;
  server_name gym.ldmapp.com;
  return 301 https://$host$request_uri;
}
```

### PM2 (mantener procesos vivos con restart automático)

```bash
# Frontend
pm2 start npm --name gym-web -- start --cwd /var/www/gym/apps/web

# Backend
pm2 start npm --name gym-api -- run start:prod --cwd /var/www/gym/apps/api

pm2 save
pm2 startup  # autostart al boot
```

### Postgres (más rápido en VPS chico)

```ini
# postgresql.conf — VPS de 2-4 GB RAM
shared_buffers = 512MB
effective_cache_size = 1500MB
work_mem = 16MB
maintenance_work_mem = 128MB
random_page_cost = 1.1            # SSD
effective_io_concurrency = 200    # SSD
max_connections = 50
```

---

## 📊 Cómo medir que sí mejoró

```bash
# Tiempo total + breakdown desde tu máquina
curl -w "@-" -o /dev/null -s https://gym.ldmapp.com/dashboard <<'EOF'
DNS:        %{time_namelookup}s
Connect:    %{time_connect}s
SSL:        %{time_appconnect}s
TTFB:       %{time_starttransfer}s
Total:      %{time_total}s
Size:       %{size_download} bytes
EOF
```

Objetivo: **TTFB < 300ms** y **Total < 1s** en 4G.

---

## 🚀 Próximos pasos opcionales (si querés bajar de 500ms)

1. **Convertir páginas pesadas a Server Components** (members, finances) — fetch en el servidor con React `cache()`. Hoy son `'use client'` con fetch en useEffect.
2. **React Server Actions** para mutations (POST/PATCH/DELETE) → menos JavaScript al cliente.
3. **Edge caching de queries** con Redis (ya lo tenés instalado, no se está usando para cache de respuestas).
4. **Imágenes con `next/image` + `priority` en above-the-fold** + `sizes` correctos.
5. **Migrar Recharts → ECharts via lazy import** — Recharts pesa ~280KB gzipped.
