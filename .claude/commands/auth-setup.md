# Setup Autenticación JWT + HTTPOnly

Implementa autenticación segura. SIEMPRE responde en español.

## Endpoints
- POST /api/v1/auth/register — Registro de admin + tenant
- POST /api/v1/auth/login — Login, retorna accessToken en HTTPOnly cookie
- POST /api/v1/auth/refresh — Refresh token rotation
- POST /api/v1/auth/logout — Limpia cookie
- GET /api/v1/auth/me — Perfil del usuario autenticado

## Seguridad (OWASP)
- Passwords: bcrypt con salt rounds 12
- JWT access token: 15min expiry, en HTTPOnly cookie
- JWT refresh token: 7d expiry, en HTTPOnly cookie separada
- CSRF: SameSite=Strict en cookies
- Rate limiting: 5 intentos login por minuto
- NO guardar tokens en localStorage NUNCA

## Archivos a crear
```
modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── dto/
│   ├── register.dto.ts     # email, password, firstName, lastName, gymName
│   ├── login.dto.ts        # email, password
│   └── token-payload.dto.ts
├── strategies/
│   └── jwt.strategy.ts     # Extrae token de cookie, NO de header
├── guards/
│   ├── jwt-auth.guard.ts
│   └── roles.guard.ts
└── decorators/
    ├── current-user.decorator.ts
    ├── current-tenant.decorator.ts
    └── roles.decorator.ts
```

## Cookie Config
```typescript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 15 * 60 * 1000 // 15 min para access
}
```
