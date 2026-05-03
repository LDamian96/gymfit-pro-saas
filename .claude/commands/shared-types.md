# Tipos Compartidos (ANTI-ERRORES)

Genera tipos TypeScript desde Prisma que usan AMBOS frontend y backend. SIEMPRE responde en español.

## Problema que resuelve
Sin tipos compartidos, el backend define `MemberResponse` con 12 campos y el frontend consume solo 8, o usa nombres distintos → errores silenciosos.

## Cómo funciona
1. Prisma genera tipos automáticamente en `node_modules/.prisma/client`
2. En `packages/shared/` creamos tipos derivados que AMBOS lados importan
3. NUNCA definir tipos manualmente que ya existen en Prisma

## Estructura
```
packages/shared/
├── src/
│   ├── types/
│   │   ├── auth.types.ts       # LoginRequest, LoginResponse, TokenPayload
│   │   ├── member.types.ts     # CreateMemberRequest, MemberResponse, MemberListResponse
│   │   ├── payment.types.ts
│   │   ├── routine.types.ts
│   │   ├── class.types.ts
│   │   ├── progress.types.ts
│   │   ├── landing.types.ts
│   │   ├── gamification.types.ts
│   │   └── common.types.ts     # ApiResponse<T>, PaginatedResponse<T>, QueryParams
│   ├── constants/
│   │   ├── roles.ts            # Role enum
│   │   ├── payment-methods.ts  # PaymentMethod enum
│   │   └── routes.ts           # Rutas del API como constantes
│   ├── validators/
│   │   └── schemas.ts          # Zod schemas que mapean 1:1 con class-validator DTOs
│   └── index.ts                # Re-export todo
├── package.json
└── tsconfig.json
```

## Regla de oro
```
Prisma Schema → packages/shared/types → Backend DTOs (class-validator)
                                       → Frontend Types (zod + react-hook-form)
```

## Template ApiResponse
```typescript
// packages/shared/src/types/common.types.ts
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

## Template Member Types (ejemplo)
```typescript
// packages/shared/src/types/member.types.ts
// CADA campo existe en schema.prisma — verificar antes de agregar

export interface CreateMemberRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  membershipType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  emergencyContact?: string;
  emergencyPhone?: string;
}

export interface MemberResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatar: string | null;
  qrCode: string;
  membershipType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  membershipStart: string; // ISO date
  membershipEnd: string;   // ISO date
  isActive: boolean;
  createdAt: string;
}
```

## ANTES de crear cualquier tipo, LEER:
1. `apps/api/prisma/schema.prisma` — campos reales
2. El DTO correspondiente en el backend — validaciones reales
3. NUNCA asumir que un campo existe — VERIFICAR
