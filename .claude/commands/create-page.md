# Crear Página del Panel Admin

Genera una página completa del dashboard con animaciones. SIEMPRE responde en español.

## Uso
`/create-page <nombre-seccion>`
Ejemplo: `/create-page members`

## Archivos que genera
```
app/(dashboard)/<seccion>/
├── page.tsx           # Página principal (Server Component)
├── loading.tsx        # Skeleton animado
├── error.tsx          # Error boundary
├── _components/
│   ├── <seccion>-table.tsx      # Tabla con datos (Client Component)
│   ├── <seccion>-form.tsx       # Formulario crear/editar (Client Component)
│   ├── <seccion>-filters.tsx    # Filtros de búsqueda
│   └── <seccion>-stats.tsx      # Stats cards (si aplica)
```

## Reglas Críticas
1. LEER los endpoints del backend ANTES de crear la página
2. MAPEAR exactamente los campos de la API response a la UI
3. Usar shadcn/ui components: Table, Dialog, Form, Input, Select, Button, Badge
4. Framer Motion en: entrada de cards, transición de modales, hover de rows
5. Loading skeleton que replica la estructura real de la página
6. Toasts (sonner) para feedback de acciones
7. Confirmación antes de eliminar
8. Paginación server-side
9. Busqueda con debounce 300ms

## Template Página
```tsx
// page.tsx — Server Component
export default async function MembersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Miembros" description="Gestiona los miembros de tu gimnasio">
        <CreateButton />
      </PageHeader>
      <Suspense fallback={<TableSkeleton />}>
        <MembersTable />
      </Suspense>
    </div>
  );
}
```
