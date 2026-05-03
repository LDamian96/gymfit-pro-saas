# Probar Endpoint

Prueba un endpoint recién creado con peticiones reales. SIEMPRE responde en español.
NUNCA avanzar al frontend sin pasar estas pruebas.

## Uso
`/test-endpoint <modulo>`
Ejemplo: `/test-endpoint members`

## Proceso
1. Verificar que Docker está corriendo (PostgreSQL + Redis)
2. Verificar que el backend compila sin errores (`npm run start:dev`)
3. Ejecutar las pruebas de cada método HTTP

## Pruebas por endpoint

### Para cada CRUD ejecutar:

#### 1. POST (Crear)
```bash
curl -X POST http://localhost:3001/api/v1/<modulo> \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=<token>" \
  -d '{ campos del CreateDto }'
```
Verificar:
- [ ] Status 201
- [ ] Response con formato `{ success: true, data: { ... } }`
- [ ] Todos los campos del DTO presentes en la response
- [ ] El registro se creó en la DB (verificar con GET)

#### 2. GET (Listar)
```bash
curl http://localhost:3001/api/v1/<modulo>?page=1&limit=10 \
  -H "Cookie: access_token=<token>"
```
Verificar:
- [ ] Status 200
- [ ] Response con formato paginado `{ success, data: [...], meta: { total, page, limit } }`
- [ ] Solo muestra datos del tenant del usuario (NO de otros gyms)
- [ ] Filtro de búsqueda funciona (?search=texto)

#### 3. GET :id (Detalle)
```bash
curl http://localhost:3001/api/v1/<modulo>/<id> \
  -H "Cookie: access_token=<token>"
```
Verificar:
- [ ] Status 200 con ID válido
- [ ] Status 404 con ID inexistente
- [ ] Status 404 si el recurso es de otro tenant

#### 4. PATCH (Actualizar)
```bash
curl -X PATCH http://localhost:3001/api/v1/<modulo>/<id> \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=<token>" \
  -d '{ campos a actualizar }'
```
Verificar:
- [ ] Status 200
- [ ] Solo se actualizaron los campos enviados
- [ ] Campos no enviados mantienen su valor original

#### 5. DELETE (Eliminar)
```bash
curl -X DELETE http://localhost:3001/api/v1/<modulo>/<id> \
  -H "Cookie: access_token=<token>"
```
Verificar:
- [ ] Status 200
- [ ] El registro ya no aparece en GET (soft delete o hard delete según modelo)

### Pruebas de seguridad
- [ ] Sin token → 401 Unauthorized
- [ ] Con rol sin permisos → 403 Forbidden
- [ ] Con tenantId de otro gym → 404 Not Found (no 403, para no revelar existencia)

### Pruebas de validación
- [ ] Body vacío → 400 con mensaje de validación
- [ ] Campo con tipo incorrecto → 400
- [ ] Campo required faltante → 400 con nombre del campo

## Output esperado
```
✅ POST /api/v1/members — 201 Created
✅ GET /api/v1/members — 200 OK (3 registros)
✅ GET /api/v1/members/:id — 200 OK
✅ PATCH /api/v1/members/:id — 200 OK
✅ DELETE /api/v1/members/:id — 200 OK
✅ Sin auth → 401
✅ Rol incorrecto → 403
✅ Validación → 400 con detalles
✅ Otro tenant → 404

RESULTADO: 9/9 pruebas pasaron → LISTO PARA FRONTEND
```

## SI FALLA
- Leer el error exacto del backend (logs de NestJS)
- Verificar el schema de Prisma
- Verificar el DTO (¿campos correctos? ¿validadores?)
- Verificar el service (¿filtra por tenantId?)
- ARREGLAR y volver a probar ANTES de continuar
