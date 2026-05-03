# Setup Redis Cache + BullMQ

Configura Redis para caching y BullMQ para jobs asíncronos. SIEMPRE responde en español.

## Redis Cache
- Cache de stats del dashboard (TTL: 5 min)
- Cache de contenido landing por tenant (TTL: 1 hora)
- Cache de planes activos (TTL: 30 min)
- Invalidación al actualizar datos

## BullMQ Jobs
- `membership-expiry` — Revisa membresías que vencen en 3 días, envía alerta
- `payment-reminder` — Recordatorio de pago pendiente
- `inactive-member` — Detecta miembros sin check-in en 7+ días
- `streak-calculator` — Calcula rachas de asistencia diariamente

## Archivos
```
config/redis.config.ts
config/bull.config.ts
modules/jobs/
├── jobs.module.ts
├── processors/
│   ├── membership.processor.ts
│   ├── payment.processor.ts
│   └── gamification.processor.ts
└── jobs.service.ts    # Encola jobs
```

## Variables de Entorno
```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```
