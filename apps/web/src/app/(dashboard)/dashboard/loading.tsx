import { Dumbbell } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-[fade-in_0.2s_ease-out]">
      {/* Hero centrado para que el usuario VEA que esta cargando — no pantalla
          en blanco. Logo + texto + barra de progreso animada. */}
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="w-16 h-16 rounded-2xl fire-card flex items-center justify-center shadow-lg">
          <Dumbbell className="h-8 w-8 text-white" strokeWidth={2.5} />
        </div>
        <p className="label-athletic text-[var(--gym-orange)]">/ Cargando panel</p>
        <h2 className="font-display text-foreground text-[28px] leading-none">
          Preparando tu gym<span className="text-[var(--gym-orange)]">.</span>
        </h2>
        <div className="w-48 h-1 rounded-full bg-secondary overflow-hidden">
          <div className="h-full bg-[var(--gym-orange)] animate-[loading-bar_1.2s_ease-in-out_infinite]" />
        </div>
      </div>

      {/* Skeleton de las cards mientras llega el JS de la pagina */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-card border border-border p-5 animate-pulse"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="h-3 w-20 rounded bg-muted/60 mb-3" />
            <div className="h-8 w-28 rounded bg-muted/80 mb-2" />
            <div className="h-3 w-16 rounded bg-muted/40" />
          </div>
        ))}
      </div>
    </div>
  );
}
