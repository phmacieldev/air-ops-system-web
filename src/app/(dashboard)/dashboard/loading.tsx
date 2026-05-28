export default function DashboardLoading() {
  return (
    <div className="p-3 md:p-6 space-y-4 min-h-full" style={{ background: "#0a0d12" }}>

      {/* Header skeleton */}
      <div className="space-y-1">
        <div className="h-2.5 w-40 rounded animate-pulse" style={{ background: "#1c2a3a" }} />
        <div className="h-7 w-64 rounded animate-pulse" style={{ background: "#1c2a3a" }} />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg px-4 py-4 space-y-3"
            style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}
          >
            <div className="h-2 w-20 rounded animate-pulse" style={{ background: "#1c2a3a" }} />
            <div className="h-8 w-12 rounded animate-pulse" style={{ background: "#1c2a3a" }} />
            <div className="h-2 w-16 rounded animate-pulse" style={{ background: "#1c2a3a" }} />
          </div>
        ))}
      </div>

      {/* Two panels skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg overflow-hidden"
            style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}
          >
            <div className="px-4 py-2.5" style={{ borderBottom: "1px solid #1c2a3a" }}>
              <div className="h-2.5 w-32 rounded animate-pulse" style={{ background: "#1c2a3a" }} />
            </div>
            <div className="px-4 py-2 space-y-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3 py-2">
                  <div className="rounded-full shrink-0 animate-pulse" style={{ width: 34, height: 34, background: "#1c2a3a" }} />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 w-24 rounded animate-pulse" style={{ background: "#1c2a3a" }} />
                    <div className="h-2 w-32 rounded animate-pulse" style={{ background: "#1c2a3a" }} />
                  </div>
                  <div className="h-5 w-16 rounded animate-pulse" style={{ background: "#1c2a3a" }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
