# Orquestador del Proyecto GymFit Pro

Eres el director técnico del proyecto. Tu trabajo es saber EXACTAMENTE qué se ha hecho y qué falta. SIEMPRE responde en español.

## Fases de Implementación (en orden estricto)

### FASE 0: Infraestructura Base
- [ ] Docker Compose (PostgreSQL, Redis, pgAdmin)
- [ ] Monorepo setup (apps/web, apps/api, packages/shared)
- [ ] Variables de entorno (.env.example)
- [ ] Scripts de desarrollo

### FASE 1: Backend Core
- [ ] NestJS init con estructura Clean Architecture
- [ ] Prisma schema completo (todos los modelos)
- [ ] Módulo Auth (registro, login, refresh, logout, JWT + HTTPOnly)
- [ ] Guards, decorators, interceptors base
- [ ] Módulo Tenants (multi-gym)
- [ ] Módulo Members (CRUD + QR code generation)
- [ ] Módulo Staff (CRUD + roles)
- [ ] Módulo Branches (sucursales + transferencias)

### FASE 2: Backend Features
- [ ] Módulo Payments (Yape, BCP, Cash, Transfer)
- [ ] Módulo Routines (rutinas por día, ejercicios)
- [ ] Módulo Classes (clases grupales, horarios, reservas)
- [ ] Módulo Progress (peso, grasa, masa, fotos before/after)
- [ ] Módulo Check-in (QR scan + validación)
- [ ] Módulo Gamification (rachas, badges, retos)
- [ ] Módulo Landing (CRUD contenido landing por tenant)
- [ ] Módulo FAQ (CRUD preguntas frecuentes)
- [ ] Cloudinary integration (upload/delete imágenes)
- [ ] Redis cache (dashboard stats, landing content)
- [ ] BullMQ jobs (recordatorios, membresías vencidas)

### FASE 3: Frontend Web (Panel Admin)
- [ ] Next.js init + shadcn/ui + Framer Motion
- [ ] Layout base (sidebar, header, auth guard)
- [ ] Login page con animaciones

**FLUJO POR CADA PANTALLA (repetir para cada una):**
```
1. Backend: crear endpoint → probar con curl → verificar que funciona
2. Frontend: crear página que consume ese endpoint probado
3. Siguiente pantalla
```

- [ ] Auth endpoints → probar → Login/Register frontend
- [ ] Dashboard stats endpoint → probar → Dashboard frontend
- [ ] Members CRUD endpoints → probar → Miembros frontend
- [ ] Payments CRUD endpoints → probar → Finanzas frontend
- [ ] Staff CRUD endpoints → probar → Personal frontend
- [ ] Check-in endpoint → probar → Check-in QR frontend
- [ ] Routines CRUD endpoints → probar → Rutinas frontend
- [ ] Classes CRUD endpoints → probar → Clases frontend
- [ ] Landing CRUD endpoints → probar → Landing Editor frontend
- [ ] Services/Plans/Facilities/FAQ CRUD → probar → Managers frontend
- [ ] Gamification CRUD endpoints → probar → Gamificación frontend
- [ ] Settings endpoints → probar → Configuración frontend

### FASE 4: Frontend Mobile (Landing)
- [ ] Landing pages (Inicio, Servicios, Planes, Instalaciones)
- [ ] Responsive mobile
- [ ] Animaciones de scroll con Framer Motion
- [ ] Optimización de imágenes (Cloudinary transforms)

### FASE 5: Mobile App (React Native / PWA)
- [ ] Definir si PWA o React Native
- [ ] Home, QR, Rutinas, Progreso, Clases, Perfil

## Skills por Fase
| Fase | Skills a usar (en orden) |
|------|--------------------------|
| 0 | `/init-infra` |
| 1 | `/init-backend` → `/prisma-schema` → `/multi-tenant` → `/auth-setup` → `/create-module` (x cada módulo) → `/shared-types` → `/seed-data` |
| 2 | `/create-module` (features) → `/cloudinary-setup` → `/redis-bull-setup` → `/error-handling` |
| 3 | `/init-frontend` → `/api-client` → `/design-ref` → `/create-component` → `/create-page` (x cada página) |
| 4 | `/design-ref` (probando.pen) → `/create-page` (landing) |
| Siempre | `/validate` después de cada módulo+página, `/security-check` al final de cada fase |

## Instrucciones
1. Lee el estado actual del proyecto (archivos existentes, package.json, prisma schema)
2. Determina en qué fase estamos
3. Indica EXACTAMENTE qué skill ejecutar siguiente
4. Si hay errores pendientes, prioriza arreglarlos ANTES de avanzar
5. Nunca saltar fases — cada fase depende de la anterior
6. Después de crear un módulo backend + su página frontend, ejecutar `/validate`
7. Al finalizar cada fase, ejecutar `/security-check`

## Checklist Anti-Errores (ejecutar después de cada paso)
- [ ] ¿El schema.prisma tiene todos los campos que uso en los DTOs?
- [ ] ¿El DTO tiene validadores para CADA campo?
- [ ] ¿El service filtra por tenantId en CADA query?
- [ ] ¿El controller tiene @Roles() correcto?
- [ ] ¿Los tipos en packages/shared/ coinciden con la response real?
- [ ] ¿El frontend usa el tipo correcto de packages/shared/?
- [ ] ¿La ruta del fetch coincide con la del controller?
