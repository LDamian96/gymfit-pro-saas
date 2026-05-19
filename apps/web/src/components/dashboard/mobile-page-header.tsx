'use client';

interface MobilePageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

/**
 * Cabecera nativa para páginas admin/trainer/recepción en móvil.
 * Se renderiza solo en mobile (md:hidden). El layout del shell deja ya
 * espacio para el top bar fijo (~48px + safe-area), así que esta cabecera
 * empieza con un pequeño aire (pt-3).
 */
export function MobilePageHeader({ title, subtitle, action }: MobilePageHeaderProps) {
  return (
    <div className="md:hidden px-4 pt-3 pb-3 flex items-end justify-between gap-3 anim-fade">
      <div className="min-w-0 flex-1">
        {subtitle && (
          <p className="text-[10px] font-black uppercase tracking-[0.18em] truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {subtitle}
          </p>
        )}
        <h1 className="text-[26px] font-black tracking-tight leading-none mt-1 truncate"
          style={{ color: 'hsl(var(--foreground))' }}>
          {title.toUpperCase()}
        </h1>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
