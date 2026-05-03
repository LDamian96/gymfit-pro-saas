# Inicializar Infraestructura Docker

Crea la infraestructura base del proyecto. SIEMPRE responde en español.

## Tareas
1. Crear `docker-compose.yml` con:
   - PostgreSQL (puerto 5432, db: gymfit, user: gymfit, pass: gymfit_dev)
   - Redis (puerto 6379)
   - pgAdmin (puerto 5050, opcional)
2. Crear `.env.example` con todas las variables necesarias
3. Crear `.env` copiando el example
4. Crear `.gitignore` completo
5. Crear estructura de carpetas monorepo:
   ```
   apps/web/     (Next.js)
   apps/api/     (NestJS)
   packages/shared/  (tipos compartidos)
   ```

## Reglas
- NO especificar versiones de imágenes Docker (usar :latest o tag estable como :16 para postgres)
- Variables de entorno para TODO (nunca hardcodear secrets)
- Docker volumes para persistencia de datos
