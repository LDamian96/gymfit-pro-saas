# Crear Componente Reutilizable

Genera componentes React reutilizables con TypeScript estricto y animaciones. SIEMPRE responde en español.

## Uso
`/create-component <nombre>`
Ejemplo: `/create-component data-table`

## Tipos de Componentes

### Shared (components/shared/)
- `page-header.tsx` — Título + descripción + acciones
- `data-table.tsx` — Tabla genérica con paginación, sort, search
- `stat-card.tsx` — Card de estadística con icono y animación
- `confirm-dialog.tsx` — Modal de confirmación antes de eliminar
- `empty-state.tsx` — Estado vacío con ilustración
- `loading-skeleton.tsx` — Skeletons reutilizables
- `badge-status.tsx` — Badge de estado (Activo, Inactivo, Pendiente)
- `image-upload.tsx` — Upload de imagen con preview (Cloudinary)
- `search-input.tsx` — Input de búsqueda con debounce

### Dashboard (components/dashboard/)
- `sidebar.tsx` — Sidebar con navegación animada
- `header.tsx` — Header con user menu
- `nav-item.tsx` — Item de navegación con active state
- `stats-grid.tsx` — Grid de stat cards

## Reglas
- Props tipadas con interface, NUNCA any
- Framer Motion para mount/unmount animations
- Composición sobre herencia
- forwardRef cuando el componente necesite ref
- Exportar desde index.ts
- Usar cn() de shadcn para merge de clases

## Template
```tsx
'use client';

import { motion } from 'framer-motion';
import { fadeInUp } from '@/animations/variants';

interface ComponentProps {
  // tipos explícitos
}

export function Component({ ...props }: ComponentProps) {
  return (
    <motion.div {...fadeInUp}>
      {/* contenido */}
    </motion.div>
  );
}
```
