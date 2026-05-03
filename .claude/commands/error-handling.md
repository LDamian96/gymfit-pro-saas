# Manejo de Errores Estándar

Define cómo se manejan errores en AMBOS lados. SIEMPRE responde en español.

## Backend — NestJS

### HttpExceptionFilter (global)
```typescript
// Captura TODAS las excepciones y las formatea igual
{
  success: false,
  message: "Descripción del error",
  statusCode: 400,
  timestamp: "2026-03-16T...",
  path: "/api/v1/members"
}
```

### Cuándo usar cada excepción
| Situación | Exception | Código |
|-----------|-----------|--------|
| Recurso no existe | NotFoundException | 404 |
| Datos inválidos | BadRequestException | 400 |
| No autenticado | UnauthorizedException | 401 |
| Sin permisos | ForbiddenException | 403 |
| Duplicado (email, QR) | ConflictException | 409 |
| Error interno | InternalServerErrorException | 500 |

### ValidationPipe (global)
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,        // elimina campos no definidos en DTO
  forbidNonWhitelisted: true, // error si envían campos extra
  transform: true,        // transforma tipos automáticamente
  transformOptions: { enableImplicitConversion: true },
}));
```

## Frontend — Next.js

### API Client Error Handling
```typescript
// En cada hook/mutation
try {
  const data = await apiClient.post('/api/v1/members', body);
  toast.success('Miembro creado exitosamente');
  return data;
} catch (error) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message || 'Error inesperado';
    toast.error(message);

    // Errores específicos
    if (error.response?.status === 409) {
      // Duplicado — mostrar en el campo específico
      form.setError('email', { message: 'Este email ya está registrado' });
    }
  }
  throw error;
}
```

### Error Boundary por ruta
```tsx
// app/(dashboard)/members/error.tsx
'use client';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
      <h2 className="text-xl font-semibold">Algo salió mal</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
```

## NUNCA
- Mostrar stack traces al usuario
- Ignorar errores silenciosamente
- Usar try/catch vacío
- Devolver 200 con error en body (siempre usar status codes correctos)
