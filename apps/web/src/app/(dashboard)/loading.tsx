import { Dumbbell } from 'lucide-react';

export default function DashboardGroupLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-[fade-in_0.2s_ease-out]">
      <div className="w-16 h-16 rounded-2xl fire-card flex items-center justify-center shadow-lg">
        <Dumbbell className="h-8 w-8 text-white" strokeWidth={2.5} />
      </div>
      <p className="label-athletic text-[var(--gym-orange)]">/ Cargando</p>
      <h2 className="font-display text-foreground text-[24px] leading-none">
        Un momento<span className="text-[var(--gym-orange)]">.</span>
      </h2>
      <div className="w-48 h-1 rounded-full bg-secondary overflow-hidden">
        <div className="h-full w-1/3 bg-[var(--gym-orange)] animate-[loading-bar_1.2s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}
