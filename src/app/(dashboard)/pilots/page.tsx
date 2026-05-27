"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Pilot } from "@/types";

const RANK_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  LEAD:           { bg: "#2a1f0a", color: "#e8c97e", border: "#e8c97e44" },
  SUPERVISOR:     { bg: "#2a1f0a", color: "#e8c97e", border: "#e8c97e44" },
  INSTRUCTOR:     { bg: "#2a1f0a", color: "#e8c97e", border: "#e8c97e44" },
  PILOT_SENIOR:   { bg: "#0a1f2a", color: "#4a90e2", border: "#4a90e244" },
  PILOT_PLENO:    { bg: "#0a2a14", color: "#3dd68c", border: "#3dd68c44" },
  PILOT_STANDARD: { bg: "#0a2a14", color: "#3dd68c", border: "#3dd68c44" },
  TRAINEE:        { bg: "#1a1c2a", color: "#8a9ab8", border: "#4a5a7a44" },
};

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  ACTIVE:    { label: "Ativo",       color: "#3dd68c" },
  INACTIVE:  { label: "Inativo",     color: "#5a7a9a" },
  SUSPENDED: { label: "Suspenso",    color: "#e24b4a" },
  TRAINING:  { label: "Treinamento", color: "#e8c97e" },
};

function getRankStyle(rankName: string) {
  return RANK_STYLES[rankName.toUpperCase()] ?? RANK_STYLES.TRAINEE;
}

function getInitials(callsign: string) {
  return callsign
    .split(/[.\s_-]/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatHours(minutes: number) {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

function scoreColor(score: number) {
  if (score >= 1000) return "#e8c97e";
  if (score >= 600)  return "#4a90e2";
  if (score >= 200)  return "#3dd68c";
  return "#5a7a9a";
}

/* ─── Row (tablet/desktop ≥ 768px) ─── */
function PilotRow({ pilot, onClick }: { pilot: Pilot; onClick: () => void }) {
  const rankStyle  = getRankStyle(pilot.rankName);
  const statusCfg  = STATUS_STYLES[pilot.status] ?? { label: pilot.status, color: "#5a7a9a" };
  return (
    <div
      className="grid px-4 py-2.5 items-center transition-colors cursor-pointer"
      style={{
        gridTemplateColumns: "2fr 1fr 0.8fr 0.8fr 0.7fr",
        borderBottom: "1px solid #111823",
      }}
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#111823")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* Piloto */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-mono font-bold shrink-0"
          style={{ background: "#1c2a3a", color: "#e8c97e" }}
        >
          {getInitials(pilot.callsign)}
        </div>
        <div className="min-w-0">
          <div className="font-mono text-sm font-bold leading-none truncate" style={{ color: "#e8c97e" }}>
            {pilot.callsign}
          </div>
          <div className="font-mono text-[11px] mt-0.5 truncate" style={{ color: "#5a7a9a" }}>
            {pilot.fullName}
          </div>
        </div>
      </div>

      {/* Rank */}
      <div>
        <span
          className="text-[9px] font-mono tracking-[1px] uppercase px-2 py-0.5 rounded"
          style={{
            background: rankStyle.bg,
            color: rankStyle.color,
            border: `1px solid ${rankStyle.border}`,
          }}
        >
          {pilot.rankName}
        </span>
      </div>

      {/* Score */}
      <div className="font-mono text-lg font-bold" style={{ color: scoreColor(pilot.accumulatedScore) }}>
        {pilot.accumulatedScore}
      </div>

      {/* Horas */}
      <div className="font-mono text-base" style={{ color: "#4a90e2" }}>
        {formatHours(pilot.flightMinutes)}
      </div>

      {/* Status */}
      <div className="font-mono text-[11px] font-bold" style={{ color: statusCfg.color }}>
        ● {statusCfg.label}
      </div>
    </div>
  );
}

/* ─── Card (mobile < 768px) ─── */
function PilotCard({ pilot, onClick }: { pilot: Pilot; onClick: () => void }) {
  const rankStyle = getRankStyle(pilot.rankName);
  const statusCfg = STATUS_STYLES[pilot.status] ?? { label: pilot.status, color: "#5a7a9a" };
  return (
    <div className="px-4 py-3 space-y-2.5 cursor-pointer" onClick={onClick} style={{ borderBottom: "1px solid #1c2a3a" }}>
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-mono font-bold shrink-0"
          style={{ background: "#1c2a3a", color: "#e8c97e" }}
        >
          {getInitials(pilot.callsign)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-base font-bold leading-none truncate" style={{ color: "#e8c97e" }}>
            {pilot.callsign}
          </div>
          <div className="font-mono text-[11px] mt-0.5 truncate" style={{ color: "#5a7a9a" }}>
            {pilot.fullName}
          </div>
        </div>
        <div className="font-mono text-[11px] font-bold shrink-0" style={{ color: statusCfg.color }}>
          ● {statusCfg.label}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="text-[9px] font-mono tracking-[1px] uppercase px-2 py-0.5 rounded"
          style={{
            background: rankStyle.bg,
            color: rankStyle.color,
            border: `1px solid ${rankStyle.border}`,
          }}
        >
          {pilot.rankName}
        </span>
        <span className="font-mono text-lg font-bold" style={{ color: scoreColor(pilot.accumulatedScore) }}>
          {pilot.accumulatedScore} pts
        </span>
        <span className="font-mono text-sm" style={{ color: "#4a90e2" }}>
          {formatHours(pilot.flightMinutes)}
        </span>
      </div>
    </div>
  );
}

export default function PilotsPage() {
  const router = useRouter();
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Pilot[]>("/pilots").then(setPilots).finally(() => setLoading(false));
  }, []);

  const filtered = pilots.filter(
    (p) =>
      p.callsign.toLowerCase().includes(search.toLowerCase()) ||
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.rankName.toLowerCase().includes(search.toLowerCase())
  );

  const empty = !loading && filtered.length === 0;

  return (
    <div className="p-3 md:p-6 space-y-4 min-h-full overflow-x-hidden" style={{ background: "#0a0d12" }}>

      {/* Page header */}
      <div className="flex items-start md:items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono tracking-[3px] uppercase mb-1" style={{ color: "#5a7a9a" }}>
            Air Support Division · Pessoal
          </p>
          <h1 className="text-lg md:text-2xl font-mono font-bold tracking-wide md:tracking-widest uppercase" style={{ color: "#e8c97e" }}>
            Roster
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#3dd68c" }} />
          <span className="text-[10px] font-mono tracking-[2px] uppercase" style={{ color: "#3dd68c" }}>
            {loading ? "—" : `${pilots.length} membros`}
          </span>
        </div>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Buscar piloto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm font-mono text-sm px-3 py-2 rounded-md outline-none"
          style={{ background: "#0d1117", border: "1px solid #1c2a3a", color: "#c8d6e5" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#e8c97e")}
          onBlur={(e)  => (e.currentTarget.style.borderColor = "#1c2a3a")}
        />
      </div>

      {/* Panel */}
      <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>

        <div className="px-4 py-2.5" style={{ borderBottom: "1px solid #1c2a3a" }}>
          <span className="text-[11px] font-mono tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>
            Membros da Unidade
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-[11px] font-mono tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>
            Carregando...
          </div>
        ) : empty ? (
          <div className="py-16 text-center text-[11px] font-mono tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>
            Nenhum piloto encontrado
          </div>
        ) : (
          <>
            {/* Desktop/Tablet */}
            <div className="hidden md:block">
              <div
                className="grid px-4 py-2"
                style={{
                  gridTemplateColumns: "2fr 1fr 0.8fr 0.8fr 0.7fr",
                  borderBottom: "1px solid #1c2a3a",
                }}
              >
                {["Piloto", "Rank", "Score", "Horas", "Status"].map((h) => (
                  <div key={h} className="text-[9px] font-mono tracking-[1.5px] uppercase" style={{ color: "#5a7a9a" }}>
                    {h}
                  </div>
                ))}
              </div>
              {filtered.map((p) => <PilotRow key={p.id} pilot={p} onClick={() => router.push(`/pilots/${p.id}`)} />)}
            </div>

            {/* Mobile */}
            <div className="md:hidden">
              {filtered.map((p) => <PilotCard key={p.id} pilot={p} onClick={() => router.push(`/pilots/${p.id}`)} />)}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
