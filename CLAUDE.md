# GymFit Pro — Reglas del Proyecto

## Idioma
- SIEMPRE responder en español
- Comentarios de código en español
- Nombres de variables/funciones en inglés (convención técnica)

## Reglas Absolutas
- Después de CADA implementación o modificación de código, SIEMPRE dar las URLs:
  - **Dashboard:** `http://72.60.251.43:3010/login`
  - **Landing:** `http://72.60.251.43:3010/gymfit-pro`
- NUNCA tocar build, dist, .next, node_modules
- NUNCA especificar versiones al instalar paquetes (`npm i next` NO `npm i next@14.2.3`)
- NUNCA usar `any` en TypeScript — siempre tipos explícitos
- NUNCA inventar campos que no existan en el schema de Prisma
- NUNCA olvidar campos al crear DTOs, responses o consumir APIs
- NUNCA hacer push sin que el usuario lo pida
- NUNCA crear archivos README.md sin que lo pidan

## Tech Stack
- **Frontend**: Next.js (App Router), shadcn/ui, Framer Motion, TailwindCSS
- **Backend**: NestJS, Prisma ORM, PostgreSQL
- **Infra**: Docker, Redis (cache), BullMQ (colas)
- **Auth**: JWT + HTTPOnly cookies (NO localStorage)
- **Imágenes**: Cloudinary (NUNCA guardar imágenes localmente)
- **Validación**: class-validator + zod (frontend)

## Arquitectura
- **Backend**: Clean Architecture + SOLID + Repository Pattern
- **Frontend**: Feature-based structure, Server Components por defecto
- **API**: RESTful, versionada (/api/v1/), respuestas consistentes
- **Seguridad**: OWASP Top 10 (solo lo necesario: XSS, CSRF, SQLi, Auth)

## Estructura del Proyecto
```
GYM-FITNEES-SAAS/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # NestJS backend
├── packages/
│   └── shared/       # Tipos compartidos, constantes
├── docker-compose.yml
├── .env.example
└── CLAUDE.md
```

## Convenciones de Código
- NestJS: módulos por dominio (members/, payments/, auth/, etc.)
- Next.js: app router, layouts por sección, loading.tsx, error.tsx
- DTOs: siempre con class-validator decorators
- Responses: formato `{ success: boolean, data: T, message?: string }`
- Errores: HttpException con códigos HTTP correctos
- Prisma: soft delete donde aplique (deletedAt)

## Flujo de Desarrollo (OBLIGATORIO — NO SALTARSE)
```
1. Crear endpoint backend (controller + service + dto)
2. PROBAR el endpoint con curl/httpie (POST, GET, PATCH, DELETE)
3. Verificar que TODAS las peticiones responden correctamente
4. SI FALLA → arreglar ANTES de continuar
5. SI PASA → recién implementar la página frontend que consume ese endpoint
6. Repetir con el siguiente endpoint
```
- NUNCA crear frontend sin haber probado el endpoint primero
- NUNCA avanzar al siguiente endpoint si el actual tiene errores
- NUNCA asumir que funciona — PROBAR con datos reales del seed

## Estrategia de Rendering y SEO (OBLIGATORIO)

### Rendering por tipo de página
| Página | Rendering | Por qué |
|--------|-----------|---------|
| Landing (/inicio, /servicios, /planes, /instalaciones) | **SSG** `generateStaticParams` + `revalidate` | Contenido semi-estático, máximo SEO, carga instantánea |
| Landing por tenant (`/[slug]/*`) | **ISR** `revalidate: 3600` | Cada gym tiene su landing, se regenera cada hora |
| Panel Admin (dashboard, members, etc.) | **SSR** con `cookies()` | Datos dinámicos, autenticado, NO necesita SEO |
| Login/Register | **SSR** | Redirige si ya está autenticado |
| API routes internas | **Route Handlers** | Proxy al backend NestJS |

### SEO obligatorio en Landing
- `metadata` export en CADA layout.tsx y page.tsx del landing
- Open Graph tags (og:title, og:description, og:image)
- Twitter Card tags
- Canonical URL
- JSON-LD structured data (LocalBusiness para cada gym)
- Sitemap dinámico (`app/sitemap.ts`)
- robots.txt (`app/robots.ts`)
- Alt text en TODAS las imágenes
- Semantic HTML (h1, h2, h3 correctos, nav, main, footer, section, article)
- next/image para TODAS las imágenes (lazy loading, WebP, srcset automático)

### Template SEO para Landing
```tsx
// app/(landing)/[slug]/page.tsx
import type { Metadata } from 'next';

export async function generateMetadata({ params }): Promise<Metadata> {
  const gym = await getGymBySlug(params.slug);
  return {
    title: `${gym.name} — Tu Gimnasio`,
    description: gym.description,
    openGraph: {
      title: gym.name,
      description: gym.description,
      images: [{ url: gym.logo, width: 1200, height: 630 }],
      type: 'website',
    },
  };
}
```

### Reglas de Rendering
- NUNCA usar `'use client'` en páginas de landing (rompe SSG/SEO)
- Animaciones de Framer Motion: usar `LazyMotion` + `domAnimation` para reducir bundle
- Componentes interactivos del landing: extraer a Client Components pequeños
- Panel admin: Server Components para fetch, Client Components para interactividad
- `loading.tsx` en CADA ruta del panel (skeletons animados)
- `error.tsx` en CADA ruta del panel (error boundary)
- `not-found.tsx` global y por segmento

## Referencia de Datos (FUENTE DE VERDAD)
Antes de crear cualquier endpoint o página, consultar:
1. El schema de Prisma para campos disponibles
2. Los DTOs para validaciones
3. La memoria del proyecto para funcionalidades definidas
4. Los archivos .pen para el diseño visual

## Referencia de Diseño (OBLIGATORIO)
- **Panel Admin** → Diseño de `Gym.pen` (sidebar blanca, fondo #FAFAFA, tablas, badges)
- **Landing Público** → Diseño de `probando.pen` (dark mode, naranja #FF4D00, glass cards)
- **Mobile App** → Diseño de `Gym.pen` sección mobile (gradientes purple/teal/pink)
- Antes de implementar una página, SIEMPRE consultar el diseño con `/design-ref`

## Skills Disponibles (20 total)

### Orquestación
- `/orchestrate` — Cerebro del proyecto. Sabe el orden, qué falta, qué skill ejecutar

### Infraestructura
- `/init-infra` — Docker, PostgreSQL, Redis, estructura monorepo
- `/init-backend` — NestJS con Clean Architecture
- `/init-frontend` — Next.js + shadcn + Framer Motion

### Backend
- `/prisma-schema` — Schema completo de base de datos (FUENTE DE VERDAD de campos)
- `/auth-setup` — JWT + HTTPOnly cookies + roles + guards
- `/create-module <nombre>` — Módulo NestJS completo con validadores exactos
- `/multi-tenant` — Flujo de aislamiento de datos por gimnasio
- `/cloudinary-setup` — Upload de imágenes
- `/redis-bull-setup` — Cache + jobs asíncronos
- `/seed-data` — Datos iniciales de prueba

### Frontend
- `/create-page <nombre>` — Página del dashboard con animaciones
- `/create-component <nombre>` — Componente React reutilizable
- `/api-client` — Cliente HTTP con auth SSR + Client (cookies)
- `/design-ref` — Consultar diseño de Gym.pen y probando.pen

### Tipos y Contratos
- `/shared-types` — Tipos compartidos Prisma → Backend → Frontend
- `/api-reference` — TODOS los endpoints con DTOs exactos (consultar ANTES de fetch)

### Calidad y Seguridad
- `/test-endpoint <modulo>` — Probar endpoint con curl ANTES de hacer frontend
- `/validate` — Verificar consistencia API ↔ Frontend (CERO ERRORES)
- `/error-handling` — Manejo estándar de errores en ambos lados
- `/security-check` — Auditoría OWASP

### SaaS (ejecutar DESPUÉS de tener la app normal funcionando)
- `/activate-saas` — Convierte la app normal a SaaS multi-tenant. Tiene TODOS los cambios listados: filtro tenantId, registro, landing dinámico por slug, SEO por tenant, aislamiento de datos
