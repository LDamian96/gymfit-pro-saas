# GymFit Pro

SaaS de gestión de gimnasios multi-tenant con landing público, panel admin, app cliente, POS de ventas y catálogo de suplementos.

## Stack

- **Frontend**: Next.js 16 (App Router) · Tailwind CSS · Framer Motion · shadcn/ui
- **Backend**: NestJS · Prisma · PostgreSQL · Redis · BullMQ
- **Infra**: Docker Compose · Cloudinary (media) · Nginx (reverse proxy)
- **Auth**: JWT en HTTPOnly cookies (cross-subdomain con SameSite=None)

## Estructura del monorepo

```
GYM-FITNEES-SAAS/
├── apps/
│   ├── api/      # NestJS backend
│   └── web/      # Next.js frontend
├── packages/
│   └── shared/   # tipos compartidos
├── docker/       # Dockerfiles + docker-compose.prod.yml
└── docker-compose.yml  # dev local
```

## Funcionalidades

### Landing público (`/[slug]`)
- Hero, marcas, instalaciones, planes, servicios, FAQ
- **Tienda** (`/[slug]/tienda`): catálogo con filtros por marca/categoría, paginación 10 mobile / 16 desktop, precio público vs. miembro
- ISR con `revalidate: 3600`, SEO completo (Open Graph, JSON-LD, sitemap)

### Panel admin
- **Tienda** `/shop`: tabla de productos con paginación 15, filtros por marca/visibilidad, toggle "Visible en landing", upload imagen Cloudinary
- **Marcas** `/brands` y **Categorías** `/product-categories` con CRUD
- **POS** `/pos`: punto de venta con carrito, búsqueda de miembros, **modal de pago con pagos múltiples y cálculo de vuelto**
- **Ventas** `/sales`: historial con desglose por método de pago, imagen del producto, vendedor
- **Permisos POS**: admin puede activar/desactivar venta para trainer/recepción
- **Check-in QR** + check-in manual por nombre
- Gestión de miembros, personal, ejercicios, rutinas, clases, finanzas
- Editor de landing (servicios, planes, instalaciones, FAQ)

### Mobile (clientes y staff)
- Bottom nav adaptativo por rol
- Vista de rutina con imágenes y videos demostrativos
- Botones flotantes (theme toggle + logout)
- Sheet "Más" para acceder a todas las opciones del rol

## Setup local

```bash
# 1. Variables de entorno
cp .env.example .env
# editar valores

# 2. Levantar Postgres + Redis
docker compose up -d

# 3. API
cd apps/api
npm install
npx prisma migrate deploy
npx prisma generate
npm run start:dev    # → http://localhost:3001

# 4. Web (otra terminal)
cd apps/web
npm install
npm run dev          # → http://localhost:3000
```

## Deploy producción

Usa `docker/docker-compose.prod.yml` con un archivo `.env.production` (ver `.env.production.example`):

```bash
# En el VPS
docker compose -p gymfit -f docker/docker-compose.prod.yml --env-file .env.production up -d --build
```

Necesita Nginx por delante para HTTPS y enrutar:
- `gym.tu-dominio.com` → `localhost:3010` (web)
- `gym-api.tu-dominio.com` → `localhost:3011` (api)

## Seeds disponibles

```bash
docker exec gymfit-api npx tsx prisma/seed.ts                    # data inicial
docker exec gymfit-api npx tsx prisma/seed-demo.ts               # cliente demo + rutina
docker exec gymfit-api npx tsx prisma/import-catalog.ts          # productos del catálogo (requiere /tmp/catalog-export.txt)
docker exec gymfit-api npx tsx prisma/seed-brands-categories.ts  # migra strings legacy a tablas
docker exec gymfit-api npx tsx prisma/upload-product-images.ts   # sube imágenes a Cloudinary
```

## Roles

| Rol | Acceso |
|---|---|
| ADMIN | Todo |
| TRAINER | Rutinas, miembros, clases, ejercicios, POS (si está activado) |
| RECEPTIONIST | Check-in, miembros, clases, pagos, POS (si está activado) |
| CLIENT | Mi rutina, medidas, asistencia, horario |

---

Hecho con Claude Code.
