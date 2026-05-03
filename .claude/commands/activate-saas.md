# Activar Modo SaaS Multi-Tenant

Convierte la app normal (un gym) a SaaS multi-tenant. SIEMPRE responde en español.
EJECUTAR SOLO cuando el usuario diga "ahora SaaS" o "activa multi-tenant".

## Estado Actual (App Normal)
- Schema Prisma YA tiene tenantId en TODAS las tablas ✅
- Enums de roles (ADMIN, RECEPTIONIST, TRAINER, CLIENT) ✅
- Modelo Tenant con slug, plan, branding ✅
- Decorator @CurrentTenant() creado ✅
- Guard RolesGuard creado ✅
- Seed con UN solo tenant fijo ✅

## Cambios a realizar (Backend)

### 1. Activar filtro tenantId en CADA service
Antes (app normal):
```typescript
async findAll() {
  return this.prisma.member.findMany();
}
```

Después (SaaS):
```typescript
async findAll(tenantId: string) {
  return this.prisma.member.findMany({
    where: { tenantId },
  });
}
```

**Archivos a modificar:**
- `modules/members/members.service.ts` — agregar tenantId a TODOS los métodos
- `modules/staff/staff.service.ts`
- `modules/payments/payments.service.ts`
- `modules/routines/routines.service.ts`
- `modules/classes/classes.service.ts`
- `modules/progress/progress.service.ts`
- `modules/checkin/checkin.service.ts`
- `modules/gamification/gamification.service.ts`
- `modules/landing/landing.service.ts`
- `modules/faq/faq.service.ts`
- `modules/branches/branches.service.ts`
- `modules/dashboard/dashboard.service.ts`

### 2. Activar tenantId en CADA controller
Antes (app normal):
```typescript
@Get()
findAll() {
  return this.service.findAll();
}
```

Después (SaaS):
```typescript
@Get()
findAll(@CurrentTenant() tenantId: string) {
  return this.service.findAll(tenantId);
}
```

**Mismo listado de controllers que arriba.**

### 3. Agregar tenantId al JWT
Archivo: `modules/auth/auth.service.ts`
```typescript
// En login(), agregar al payload:
const payload: JwtPayload = {
  sub: user.id,
  email: user.email,
  role: user.role,
  tenantId: user.tenantId, // ← ACTIVAR
};
```

### 4. Crear endpoint de Registro (crea gym + admin)
Archivo: `modules/auth/auth.controller.ts`
```
POST /api/v1/auth/register
Body: { email, password, firstName, lastName, gymName }
```
- Crea Tenant con slug generado desde gymName
- Crea User con role ADMIN vinculado al tenant
- Retorna tokens + user + tenant

### 5. Validación de aislamiento
Agregar en CADA service.findOne():
```typescript
async findOne(id: string, tenantId: string) {
  const item = await this.prisma.member.findUnique({ where: { id } });
  if (!item || item.tenantId !== tenantId) {
    throw new NotFoundException('No encontrado');
  }
  return item;
}
```

## Cambios a realizar (Frontend)

### 6. Página de Registro
Crear: `app/(auth)/register/page.tsx`
- Form: nombre del gym, email, password, nombre, apellido
- Al registrar → redirect a /dashboard
- Animaciones con Framer Motion
- Validación con zod

### 7. Landing dinámico por slug
Cambiar: `app/(landing)/[slug]/page.tsx`

Antes (app normal):
```tsx
// Landing fija, contenido hardcoded o de un solo tenant
export default function LandingPage() { ... }
```

Después (SaaS):
```tsx
// ISR con revalidate cada hora
export async function generateMetadata({ params }): Promise<Metadata> {
  const gym = await getGymBySlug(params.slug);
  return { title: gym.name, description: `${gym.name} — Tu Gimnasio` };
}

export default async function LandingPage({ params }) {
  const gym = await getGymBySlug(params.slug);
  const services = await getServicesBySlug(params.slug);
  // ...render con datos del tenant
}

export const revalidate = 3600; // ISR cada hora
```

**Subrutas del landing dinámico:**
- `[slug]/page.tsx` — Inicio
- `[slug]/servicios/page.tsx`
- `[slug]/planes/page.tsx`
- `[slug]/instalaciones/page.tsx`

### 8. Endpoints públicos del landing
```
GET /api/v1/landing/:slug — Contenido hero, CTA
GET /api/v1/landing/:slug/services — Servicios del gym
GET /api/v1/landing/:slug/plans — Planes del gym
GET /api/v1/landing/:slug/facilities — Instalaciones
GET /api/v1/landing/:slug/classes — Clases (opcional)
GET /api/v1/landing/:slug/faq — Preguntas frecuentes
```
Estos endpoints NO requieren autenticación, buscan por slug del tenant.

### 9. SEO dinámico por tenant
- `generateMetadata()` en cada página del landing
- JSON-LD con datos del gym (LocalBusiness)
- Open Graph con logo del gym
- Sitemap dinámico que lista todos los tenants activos
- `robots.ts` que permite indexar landings

### 10. Super Admin (opcional, fase posterior)
- Panel para gestionar TODOS los gyms
- Ver stats globales
- Activar/desactivar tenants
- Cambiar plan de tenants (FREE/BASIC/PRO)

## Checklist de verificación
- [ ] Cada query de Prisma filtra por tenantId
- [ ] JWT incluye tenantId
- [ ] findOne() verifica que el recurso pertenece al tenant
- [ ] Registro crea tenant + admin
- [ ] Landing se carga por slug
- [ ] SEO metadata dinámico por tenant
- [ ] Un gym NO puede ver datos de otro
- [ ] Ejecutar `/security-check` para verificar aislamiento

## Estimación
- Backend: ~2 horas (es agregar tenantId a queries existentes)
- Frontend registro: ~1 hora
- Landing dinámico: ~2 horas
- SEO: ~1 hora
- Total: ~6 horas de trabajo real
