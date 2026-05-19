'use client';

interface HeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  children?: React.ReactNode;
}

/**
 * Header de página — solo desktop. Eyebrow + título display + descripción + actions.
 * En mobile cada página renderiza su propia cabecera nativa.
 */
export function Header({ title, description, eyebrow = 'Panel', children }: HeaderProps) {
  return (
    <div className="hidden md:flex md:flex-row md:items-end justify-between gap-4 mb-6">
      <div>
        <p className="label-athletic text-[var(--gym-orange)] mb-2">/ {eyebrow}</p>
        <h1 className="font-display tracking-tight leading-[0.92] text-foreground"
          style={{ fontSize: 'clamp(36px, 4.5vw, 56px)' }}>
          {title}
        </h1>
        {description && (
          <p className="text-[14px] text-muted-foreground mt-2 max-w-xl">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2.5 flex-wrap">
        {children}
      </div>
    </div>
  );
}
