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

const RANK_LABEL: Record<string, string> = {
  LEAD:           "Lead",
  SUPERVISOR:     "Supervisor",
  INSTRUCTOR:     "Instrutor",
  PILOT_SENIOR:   "Pilot Senior",
  PILOT_PLENO:    "Pilot Pleno",
  PILOT_STANDARD: "Pilot Standard",
  TRAINEE:        "Trainee",
};

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  ACTIVE:    { label: "Ativo",       color: "#3dd68c" },
  INACTIVE:  { label: "Inativo",     color: "#5a7a9a" },
  SUSPENDED: { label: "Suspenso",    color: "#e24b4a" },
  TRAINING:  { label: "Treinamento", color: "#e8c97e" },
};

const AVATAR_BG: Record<string, string> = {
  LEAD:           "#2a1f0a",
  SUPERVISOR:     "#2a1f0a",
  INSTRUCTOR:     "#2a1f0a",
  PILOT_SENIOR:   "#0a1f2a",
  PILOT_PLENO:    "#0a2a14",
  PILOT_STANDARD: "#0a2a14",
  TRAINEE:        "#1a1c2a",
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

function scoreColor(score: number) {
  if (score >= 1000) return "#e8c97e";
  if (score >= 600)  return "#4a90e2";
  if (score >= 200)  return "#3dd68c";
  return "#5a7a9a";
}

/* ─── Card de piloto ─── */
function PilotCard({ pilot, onClick }: { pilot: Pilot; onClick: () => void }) {
  const rankStyle = getRankStyle(pilot.rankName);
  const statusCfg = STATUS_STYLES[pilot.status] ?? { label: pilot.status, color: "#5a7a9a" };
  const avatarBg  = AVATAR_BG[pilot.rankName.toUpperCase()] ?? "#1a1c2a";

  return (
    <div
      className="rounded-lg overflow-hidden cursor-pointer transition-all duration-200"
      style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}
      onClick={onClick}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = rankStyle.color + "66";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "#1c2a3a";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      {/* Top stripe — rank color */}
      <div className="h-0.5 w-full" style={{ background: rankStyle.color }} />

      <div className="p-4 flex flex-col items-center text-center gap-3">

        {/* Avatar */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
          style={{ background: avatarBg, border: `2px solid ${rankStyle.color}33` }}
        >
          {pilot.profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pilot.profileImageUrl}
              alt={pilot.callsign}
              className="w-full h-full object-cover"
            />
          ) : (
            <span
              className="text-xl font-mono font-bold"
              style={{ color: rankStyle.color }}
            >
              {getInitials(pilot.callsign)}
            </span>
          )}
        </div>

        {/* Callsign */}
        <div>
          <div
            className="font-mono text-base font-bold leading-tight tracking-wide truncate max-w-full"
            style={{ color: rankStyle.color }}
          >
            {pilot.callsign}
          </div>
          <div className="font-mono text-[11px] mt-0.5 truncate max-w-full" style={{ color: "#5a7a9a" }}>
            {pilot.fullName}
          </div>
        </div>

        {/* Rank badge */}
        <span
          className="text-[9px] font-mono tracking-[1px] uppercase px-2.5 py-0.5 rounded"
          style={{
            background: rankStyle.bg,
            color: rankStyle.color,
            border: `1px solid ${rankStyle.border}`,
          }}
        >
          {RANK_LABEL[pilot.rankName.toUpperCase()] ?? pilot.rankName}
        </span>

        {/* Divider */}
        <div className="w-full h-px" style={{ background: "#1c2a3a" }} />

        {/* Score + Status */}
        <div className="w-full flex items-center justify-between">
          <div>
            <div
              className="font-mono text-2xl font-bold leading-none"
              style={{ color: scoreColor(pilot.accumulatedScore) }}
            >
              {pilot.accumulatedScore}
            </div>
            <div className="text-[9px] font-mono tracking-[1px] uppercase mt-0.5" style={{ color: "#3a5a7a" }}>
              pts
            </div>
          </div>
          <div className="font-mono text-[11px] font-bold" style={{ color: statusCfg.color }}>
            ● {statusCfg.label}
          </div>
        </div>
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
          placeholder="Buscar por callsign, nome ou rank..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm font-mono text-sm px-3 py-2 rounded-md outline-none"
          style={{ background: "#0d1117", border: "1px solid #1c2a3a", color: "#c8d6e5" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#e8c97e")}
          onBlur={(e)  => (e.currentTarget.style.borderColor = "#1c2a3a")}
        />
      </div>

      {/* Card grid */}
      {loading ? (
        <div className="py-20 text-center text-[11px] font-mono tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>
          Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-[11px] font-mono tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>
          Nenhum piloto encontrado
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((p) => (
            <PilotCard
              key={p.id}
              pilot={p}
              onClick={() => router.push(`/pilots/${p.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
