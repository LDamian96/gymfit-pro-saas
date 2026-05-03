# Inicializar Backend NestJS

Crea el backend NestJS con Clean Architecture. SIEMPRE responde en español.

## Tareas
1. Inicializar NestJS en `apps/api/` (SIN especificar versión)
2. Instalar dependencias core:
   ```
   npm i @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt
   npm i @prisma/client class-validator class-transformer
   npm i bcrypt cookie-parser helmet
   npm i bullmq ioredis
   npm i cloudinary multer @nestjs/platform-express
   npm i -D prisma @types/passport-jwt @types/bcrypt @types/cookie-parser @types/multer
   ```
3. Configurar estructura Clean Architecture:
   ```
   apps/api/src/
   ├── common/           # Guards, decorators, interceptors, filters, pipes
   │   ├── guards/
   │   ├── decorators/
   │   ├── interceptors/
   │   ├── filters/
   │   └── pipes/
   ├── config/           # Configuración (env, cloudinary, redis, bull)
   ├── modules/          # Módulos por dominio
   │   ├── auth/
   │   ├── tenants/
   │   ├── members/
   │   ├── staff/
   │   ├── payments/
   │   ├── routines/
   │   ├── classes/
   │   ├── progress/
   │   ├── checkin/
   │   ├── gamification/
   │   ├── landing/
   │   ├── faq/
   │   └── branches/
   ├── prisma/           # Prisma service, schema, migrations
   └── main.ts
   ```
4. Crear PrismaService como módulo global
5. Crear ResponseInterceptor (formato estándar)
6. Crear HttpExceptionFilter (errores consistentes)
7. Configurar CORS, helmet, cookie-parser en main.ts
8. NO crear endpoints aún — solo la estructura

## Formato de Respuesta Estándar
```typescript
{
  success: boolean;
  data: T | null;
  message?: string;
  meta?: { total: number; page: number; limit: number; }
}
```

## Reglas
- NUNCA usar `any`
- Todos los DTOs con class-validator
- ConfigModule.forRoot() con validación de env
