# Validar Consistencia API ↔ Frontend

Verifica que NO haya errores de datos entre backend y frontend. SIEMPRE responde en español.

## Qué Verifica

### 1. Schema Prisma ↔ DTOs
- Cada campo del DTO existe en el modelo Prisma
- Tipos coinciden (string, number, boolean, enum)
- Campos required en DTO son required en Prisma
- No hay campos inventados

### 2. API Response ↔ Frontend Types
- Cada campo usado en el frontend existe en la response del API
- No se accede a propiedades undefined
- Los tipos TypeScript del frontend coinciden con los del backend

### 3. Rutas API ↔ Frontend API Calls
- Cada fetch/axios call usa una ruta que existe en el backend
- Los métodos HTTP coinciden (GET, POST, PATCH, DELETE)
- Los query params y body params son correctos
- No hay rutas huérfanas (frontend llama a endpoint que no existe)

### 4. Roles y Permisos
- Las páginas protegidas verifican el rol correcto
- Los endpoints con @Roles() coinciden con los guards del frontend
- No hay pantallas accesibles sin autenticación

### 5. Navegación
- Todas las rutas del sidebar existen como páginas
- No hay links rotos
- Redirects correctos (login → dashboard, unauthorized → 403)

## Cómo Ejecutar
1. Lee TODOS los archivos .controller.ts para listar endpoints
2. Lee TODOS los archivos de pages/api calls del frontend
3. Cruza la información
4. Reporta discrepancias con ubicación exacta del archivo

## Output
```
✅ members.controller.ts ↔ members/page.tsx — OK
❌ payments.controller.ts — endpoint POST /payments existe pero frontend no lo consume
⚠️ classes/page.tsx — accede a campo 'instructor.name' pero la API devuelve 'instructor.firstName'
```
