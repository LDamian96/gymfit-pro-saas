export default function DashboardGroupLoading() {
  return (
    <div className="space-y-6 animate-[fade-in_0.25s_ease-out]">
      <div className="space-y-3">
        <div className="h-9 w-64 rounded-xl bg-muted/60 animate-pulse" />
        <div className="h-4 w-80 rounded-lg bg-muted/40 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-40 rounded-2xl bg-card border border-border animate-pulse"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
