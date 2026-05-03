# Crear Módulo NestJS

Genera un módulo completo de NestJS siguiendo Clean Architecture. SIEMPRE responde en español.

## Uso
`/create-module <nombre-modulo>`
Ejemplo: `/create-module members`

## Estructura que genera
```
modules/<nombre>/
├── <nombre>.module.ts        # Módulo NestJS
├── <nombre>.controller.ts    # Controlador con endpoints
├── <nombre>.service.ts       # Lógica de negocio
├── dto/
│   ├── create-<nombre>.dto.ts
│   ├── update-<nombre>.dto.ts
│   └── query-<nombre>.dto.ts  # Filtros y paginación
├── entities/
│   └── <nombre>.entity.ts     # Tipo que mapea al modelo Prisma
└── interfaces/
    └── <nombre>.interface.ts   # Interfaces del módulo
```

## Reglas Críticas
1. LEER `apps/api/prisma/schema.prisma` ANTES de crear DTOs — usar SOLO campos que existen
2. Cada DTO debe tener decorators de class-validator (ver tabla abajo)
3. El service recibe PrismaService por inyección
4. El controller usa Guards según el rol requerido
5. Paginación estándar: `?page=1&limit=10&search=`
6. Filtrar SIEMPRE por tenantId (multi-tenancy) — ver `/multi-tenant`
7. Manejar errores con NotFoundException, BadRequestException, etc. — ver `/error-handling`
8. NUNCA inventar campos — si el modelo Prisma no tiene un campo, NO lo uses en el DTO
9. Los tipos de Response deben existir en `packages/shared/` — ver `/shared-types`
10. Consultar `/api-reference` para verificar que la ruta existe

## Mapa de Validadores class-validator
| Tipo Prisma | Decorator | Ejemplo |
|-------------|-----------|---------|
| String (required) | @IsString() @IsNotEmpty() | firstName |
| String (optional) | @IsOptional() @IsString() | phone |
| String (email) | @IsEmail() | email |
| String (enum) | @IsEnum(MembershipType) | membershipType |
| Int | @IsInt() @Min(0) | sets, reps |
| Float | @IsNumber() | weight, bodyFat |
| Boolean | @IsBoolean() | isActive |
| DateTime | @IsDateString() | membershipStart |
| URL | @IsUrl() | imageUrl, videoUrl |
| Array String | @IsArray() @IsString({ each: true }) | features |
| UUID/CUID | @IsString() @IsNotEmpty() | memberId, classId |

## Proceso obligatorio
```
1. Leer schema.prisma → listar campos del modelo
2. Crear DTO con SOLO esos campos + validadores correctos
3. Crear service con where: { tenantId } en CADA query
4. Crear controller con @Roles() correctos (consultar /api-reference)
5. Exportar tipos en packages/shared/
6. Ejecutar /validate para verificar
```

## Template Controller
```typescript
@Controller('api/v1/<nombre>')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NombreController {
  constructor(private readonly nombreService: NombreService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateNombreDto, @CurrentTenant() tenantId: string) {}

  @Get()
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  findAll(@Query() query: QueryNombreDto, @CurrentTenant() tenantId: string) {}

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {}

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateNombreDto, @CurrentTenant() tenantId: string) {}

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string, @CurrentTenant() tenantId: string) {}
}
```
