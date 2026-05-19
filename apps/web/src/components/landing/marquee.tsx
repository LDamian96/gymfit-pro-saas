// Marquee horizontal infinito — fire-card edition (server component).
export function Marquee() {
  const items = [
    'FORJA TU PR',
    '+2,500 ATLETAS',
    '12 COACHES',
    'SIN EXCUSAS',
    'RESULTADOS REALES',
    '24/7 ACCESO QR',
  ];
  return (
    <div
      className="relative py-4 overflow-hidden border-y"
      style={{
        background: 'linear-gradient(90deg, var(--gym-orange) 0%, var(--gym-orange-dark, #E63E00) 100%)',
        borderColor: 'rgba(0,0,0,0.18)',
      }}
    >
      <div className="flex animate-marquee whitespace-nowrap">
        {[0, 1, 2].map((rep) => (
          <div key={rep} className="flex items-center shrink-0">
            {items.map((it, j) => (
              <span key={j} className="flex items-center mx-6">
                <span className="font-display text-[14px] tracking-[0.18em] uppercase text-white">{it}</span>
                <span className="mx-6 inline-block w-1.5 h-1.5 rounded-full bg-white/50" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
