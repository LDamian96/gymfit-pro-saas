# Auditoría de Seguridad OWASP

Verifica las vulnerabilidades OWASP relevantes para el proyecto. SIEMPRE responde en español.

## Checklist OWASP (solo lo necesario)

### A01: Broken Access Control
- [ ] Verificar tenantId en TODAS las queries (no acceder a datos de otro gym)
- [ ] Verificar roles en cada endpoint (@Roles decorator)
- [ ] Guards en rutas del frontend
- [ ] No exponer IDs internos en URLs si no es necesario

### A02: Cryptographic Failures
- [ ] Passwords hasheados con bcrypt (salt 12)
- [ ] JWT secret fuerte (mínimo 32 chars)
- [ ] HTTPOnly + Secure + SameSite en cookies
- [ ] HTTPS en producción

### A03: Injection
- [ ] Prisma ORM previene SQL injection (usar parametrized queries)
- [ ] Validar inputs con class-validator (backend) y zod (frontend)
- [ ] Sanitizar HTML en campos de texto libre
- [ ] No usar eval() ni Function()

### A07: XSS
- [ ] React escapa por defecto (no usar dangerouslySetInnerHTML)
- [ ] CSP headers configurados
- [ ] Sanitizar datos del usuario antes de renderizar

### A09: Security Logging
- [ ] Log intentos de login fallidos
- [ ] Log acceso a datos de otro tenant (ALERTA)
- [ ] Log eliminaciones de datos

## Ejecución
Lee todos los archivos del proyecto y verifica cada punto. Reporta:
- ✅ Implementado correctamente
- ❌ Falta implementar (con instrucción de cómo arreglar)
- ⚠️ Parcialmente implementado
