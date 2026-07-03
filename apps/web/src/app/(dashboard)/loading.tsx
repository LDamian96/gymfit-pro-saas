// Loading del grupo (dashboard) — se muestra en cada cambio de ruta dentro
// del panel. Debe ser MINIMO y sutil (barra fina arriba), NO una pantalla
// completa: el cambio de ruta tiene que sentirse rapido y suave.
// El overlay grande "Preparando tu experiencia" es SOLO para el primer login.
export default function DashboardGroupLoading() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-[3px] overflow-hidden md:left-[256px]">
      <div className="h-full w-2/5 bg-[var(--gym-orange)] rounded-full animate-[route-bar_0.9s_ease-in-out_infinite]" />
    </div>
  );
}
