export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-[fade-in_0.25s_ease-out]">
      <div className="space-y-3">
        <div className="h-9 w-72 rounded-xl bg-muted/60 animate-pulse" />
        <div className="h-4 w-96 rounded-lg bg-muted/40 animate-pulse" />
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-80 rounded-2xl bg-card border border-border p-5 animate-pulse" style={{ animationDelay: '240ms' }}>
          <div className="h-4 w-40 rounded bg-muted/60 mb-4" />
          <div className="h-full bg-muted/30 rounded-xl" />
        </div>
        <div className="h-80 rounded-2xl bg-card border border-border p-5 animate-pulse" style={{ animationDelay: '300ms' }}>
          <div className="h-4 w-32 rounded bg-muted/60 mb-4" />
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-muted/40" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
