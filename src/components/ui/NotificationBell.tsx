"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

type Counts = { flights: number; reports: number };

export function NotificationBell() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Counts>({ flights: 0, reports: 0 });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const canSeeFlights  = user?.role === "LEAD" || user?.role === "ADM";
  const canSeeReports  = user?.role === "LEAD" || user?.role === "ADM" || user?.role === "SUPERVISOR";

  useEffect(() => {
    if (!canSeeFlights && !canSeeReports) return;

    async function fetchCounts() {
      const [f, r] = await Promise.all([
        canSeeFlights
          ? api.get<{ count: number }>("/flights/pending/count")
          : Promise.resolve({ count: 0 }),
        canSeeReports
          ? api.get<{ count: number }>("/reports/pending/count")
          : Promise.resolve({ count: 0 }),
      ]);
      setCounts({ flights: f.count, reports: r.count });
    }

    fetchCounts();
    const id = setInterval(fetchCounts, 60_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!canSeeFlights && !canSeeReports) return null;

  const total = (canSeeFlights ? counts.flights : 0) + (canSeeReports ? counts.reports : 0);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-1.5 rounded"
        style={{ color: total > 0 ? "#e8c97e" : "#5a7a9a" }}
      >
        <Bell className="w-4 h-4" />
        {total > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full font-mono font-bold"
            style={{
              background: "#e24b4a",
              color: "#fff",
              fontSize: 9,
              minWidth: 16,
              height: 16,
              padding: "0 3px",
            }}
          >
            {total}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-lg z-50 overflow-hidden"
          style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}
        >
          <div className="px-3 py-2" style={{ borderBottom: "1px solid #1c2a3a" }}>
            <span className="font-mono text-[10px] tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>
              Pendentes
            </span>
          </div>

          {canSeeFlights && (
            <Link
              href="/flights"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-3 py-2.5"
              style={{ borderBottom: "1px solid #111823" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#111823")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span className="font-mono text-[11px]" style={{ color: "#c8d6e5" }}>
                Protocolos de Voo
              </span>
              <span
                className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded"
                style={{
                  background: counts.flights > 0 ? "#2a0a0a" : "#1c2a3a",
                  color:      counts.flights > 0 ? "#e24b4a" : "#5a7a9a",
                }}
              >
                {counts.flights}
              </span>
            </Link>
          )}

          {canSeeReports && (
            <Link
              href="/reports"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-3 py-2.5"
              onMouseEnter={(e) => (e.currentTarget.style.background = "#111823")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span className="font-mono text-[11px]" style={{ color: "#c8d6e5" }}>
                Relatórios
              </span>
              <span
                className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded"
                style={{
                  background: counts.reports > 0 ? "#2a0a0a" : "#1c2a3a",
                  color:      counts.reports > 0 ? "#e24b4a" : "#5a7a9a",
                }}
              >
                {counts.reports}
              </span>
            </Link>
          )}

          {total === 0 && (
            <div className="px-3 py-3 font-mono text-[11px] text-center" style={{ color: "#5a7a9a" }}>
              Nenhum pendente
            </div>
          )}
        </div>
      )}
    </div>
  );
}
