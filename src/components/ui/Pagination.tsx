export function Pagination({
  page,
  totalPages,
  total,
  size,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  size: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const from = page * size + 1;
  const to = Math.min((page + 1) * size, total);

  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{ borderTop: "1px solid #1c2a3a" }}
    >
      <span className="font-mono text-[11px]" style={{ color: "#5a7a9a" }}>
        {from}–{to} de {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 0}
          className="font-mono text-[11px] tracking-[1px] uppercase px-3 py-1.5 rounded"
          style={{
            background: "#1c2a3a",
            color: "#c8d6e5",
            opacity: page === 0 ? 0.4 : 1,
            cursor: page === 0 ? "not-allowed" : "pointer",
          }}
        >
          ← Ant.
        </button>
        <span className="font-mono text-[11px]" style={{ color: "#e8c97e" }}>
          {page + 1} / {totalPages}
        </span>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="font-mono text-[11px] tracking-[1px] uppercase px-3 py-1.5 rounded"
          style={{
            background: "#1c2a3a",
            color: "#c8d6e5",
            opacity: page >= totalPages - 1 ? 0.4 : 1,
            cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
          }}
        >
          Próx. →
        </button>
      </div>
    </div>
  );
}
