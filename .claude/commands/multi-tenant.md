# Flujo Multi-Tenant

Define EXACTAMENTE cómo se resuelve el tenant en cada contexto. SIEMPRE responde en español.

## Problema que resuelve
Sin esto, un admin podría ver datos de otro gimnasio → falla de seguridad crítica.

## Estrategia: Tenant por JWT

### En el Backend
1. Al hacer login, el JWT incluye `tenantId` y `role`
2. El `JwtStrategy` extrae el `tenantId` del token
3. El decorator `@CurrentTenant()` lo inyecta en cada controller
4. CADA query de Prisma filtra por `tenantId`

```typescript
// Token payload
interface JwtPayload {
  sub: string;      // userId
  email: string;
  role: Role;
  tenantId: string;
}

// Decorator
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user.tenantId;
  },
);

// En CADA service method
async findAll(tenantId: string, query: QueryDto) {
  return this.prisma.member.findMany({
    where: { tenantId, deletedAt: null }, // SIEMPRE filtrar
    ...
  });
}
```

### En el Landing Público
- La landing se accede por slug: `/gym-power` → busca tenant con slug `gym-power`
- NO requiere autenticación
- Ruta: `GET /api/v1/landing/:slug`

### Seguridad
- NUNCA permitir que el frontend envíe `tenantId` en el body
- El `tenantId` SIEMPRE viene del JWT (server-side)
- Guard adicional que verifica que el recurso pertenece al tenant:

```typescript
// En el service, al buscar por ID
async findOne(id: string, tenantId: string) {
  const item = await this.prisma.member.findUnique({ where: { id } });
  if (!item || item.tenantId !== tenantId) {
    throw new NotFoundException('Recurso no encontrado');
  }
  return item;
}
```

## REGLA ABSOLUTA
Todo query que toca la base de datos DEBE incluir `where: { tenantId }`.
Si no lo hace → se exponen datos de otros gimnasios.
