# Inicializar Frontend Next.js

Crea el frontend con Next.js App Router + shadcn/ui + Framer Motion. SIEMPRE responde en español.

## Tareas
1. Inicializar Next.js en `apps/web/` (SIN especificar versión)
2. Instalar dependencias:
   ```
   npx shadcn@latest init
   npm i framer-motion
   npm i zustand
   npm i zod react-hook-form @hookform/resolvers
   npm i axios
   npm i date-fns
   npm i lucide-react
   npm i next-themes
   npm i sonner (toasts)
   npm i recharts (gráficos dashboard)
   ```
3. Configurar estructura:
   ```
   apps/web/
   ├── src/
   │   ├── app/
   │   │   ├── (auth)/          # Login, Register (sin sidebar)
   │   │   ├── (dashboard)/     # Panel admin (con sidebar)
   │   │   │   ├── layout.tsx   # Sidebar + header
   │   │   │   ├── page.tsx     # Dashboard
   │   │   │   ├── members/
   │   │   │   ├── finances/
   │   │   │   ├── staff/
   │   │   │   ├── classes/
   │   │   │   ├── routines/
   │   │   │   ├── checkin/
   │   │   │   ├── landing/
   │   │   │   ├── gamification/
   │   │   │   └── settings/
   │   │   ├── (landing)/       # Landing pública
   │   │   │   ├── [slug]/      # Landing por tenant
   │   │   │   │   ├── page.tsx
   │   │   │   │   ├── servicios/
   │   │   │   │   ├── planes/
   │   │   │   │   └── instalaciones/
   │   │   └── layout.tsx
   │   ├── components/
   │   │   ├── ui/              # shadcn components
   │   │   ├── shared/          # Componentes reutilizables
   │   │   ├── dashboard/       # Componentes del panel
   │   │   └── landing/         # Componentes del landing
   │   ├── hooks/               # Custom hooks
   │   ├── lib/
   │   │   ├── api.ts           # Axios instance con interceptors
   │   │   ├── utils.ts         # Utilidades
   │   │   └── validations.ts   # Schemas Zod
   │   ├── stores/              # Zustand stores
   │   ├── types/               # TypeScript types
   │   └── animations/          # Framer Motion variants
   ```
4. Configurar Axios con credentials: 'include' para cookies
5. Crear tema oscuro/claro con next-themes
6. Crear layout del dashboard con sidebar animada

## Animaciones Base (Framer Motion)
```typescript
// animations/variants.ts
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
};

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
};

export const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 }
};
```

## Reglas
- Server Components por defecto, 'use client' solo donde se necesite
- Loading states con skeletons animados
- Error boundaries en cada ruta
- Optimistic updates donde aplique
- NUNCA fetch directo — siempre usar el api client configurado
