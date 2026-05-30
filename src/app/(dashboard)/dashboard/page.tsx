"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Pilot, FlightLog, PerformanceReport } from "@/types";

function formatDuration(startedAt: string, endAt: string | null) {
  if (!endAt) return "—";
  const mins = Math.round((new Date(endAt).getTime() - new Date(startedAt).getTime()) / 60000);
  if (mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m}min`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `hoje ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `ontem ${time}`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + ` ${time}`;
}

const FLIGHT_TYPE_MAP: Record<string, { label: string; bg: string; color: string }> = {
  PATRULHA:          { label: "Patrulha",     bg: "#1a1c2a", color: "#8a9ab8" },
  PATROL:            { label: "Pers. 10-80",  bg: "#0a1f2a", color: "#4a90e2" },
  PURSUIT_10_94:     { label: "Perseguição",  bg: "#2a1010", color: "#e24b4a" },
  BANK_FLEECA_10_90: { label: "Banco Fleeca", bg: "#2a1f0a", color: "#e8c97e" },
  PALETO_BANK:       { label: "Banco Paleto", bg: "#2a1f0a", color: "#e8c97e" },
  BANK_68_10_90:     { label: "Banco 68",     bg: "#2a1f0a", color: "#e8c97e" },
  BOOSTING_S:        { label: "Boost. 10-80", bg: "#0a2a14", color: "#3dd68c" },
};

function FlightTypeBadge({ type }: { type: string }) {
  const key = type.toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const cfg = FLIGHT_TYPE_MAP[type.toUpperCase()] ?? FLIGHT_TYPE_MAP[key] ?? {
    label: type,
    bg: "#1c2a3a",
    color: "#5a7a9a",
  };
  return (
    <span
      className="text-[10px] font-mono tracking-[1px] uppercase px-2 py-0.5 rounded whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

const RANK_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  LEAD:           { bg: "#2a1f0a", color: "#e8c97e", border: "#e8c97e44" },
  SUPERVISOR:     { bg: "#2a1f0a", color: "#e8c97e", border: "#e8c97e44" },
  INSTRUCTOR:     { bg: "#2a1f0a", color: "#e8c97e", border: "#e8c97e44" },
  PILOT_SENIOR:   { bg: "#0a1f2a", color: "#4a90e2", border: "#4a90e244" },
  PILOT_PLENO:    { bg: "#0a2a14", color: "#3dd68c", border: "#3dd68c44" },
  PILOT_STANDARD: { bg: "#0a2a14", color: "#3dd68c", border: "#3dd68c44" },
  TRAINEE:        { bg: "#1a1c2a", color: "#8a9ab8", border: "#4a5a7a44" },
};

function getRankStyle(rankName: string) {
  return RANK_STYLES[rankName.toUpperCase()] ?? RANK_STYLES.TRAINEE;
}

const RANK_COLOR: Record<string, string> = {
  LEAD:           "#e8c97e",
  SUPERVISOR:     "#e8c97e",
  INSTRUCTOR:     "#e8c97e",
  PILOT_SENIOR:   "#4a90e2",
  PILOT_PLENO:    "#3dd68c",
  PILOT_STANDARD: "#3dd68c",
  TRAINEE:        "#8a9ab8",
};

const MEDAL_COLORS = ["#e8c97e", "#8a9ab8", "#9a6030", "#3a4a5a"];

const RANK_ORDER: Record<string, number> = {
  LEAD: 10, SUPERVISOR: 6, INSTRUCTOR: 5,
  PILOT_SENIOR: 4, PILOT_PLENO: 3, PILOT_STANDARD: 2, PILOT: 2, TRAINEE: 1,
};

const RANK_LABEL: Record<string, string> = {
  LEAD:           "Lead",
  SUPERVISOR:     "Sup.",
  INSTRUCTOR:     "Inst.",
  PILOT_SENIOR:   "Senior",
  PILOT_PLENO:    "Pleno",
  PILOT_STANDARD: "Std",
  TRAINEE:        "Trainee",
};

function PilotAvatar({ name, callsign, photoUrl, size = 32 }: {
  name?: string;
  callsign: string;
  photoUrl?: string | null;
  size?: number;
}) {
  const initials = callsign
    .split(/[.\s_-]/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name ?? callsign}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center font-mono font-bold shrink-0"
      style={{ width: size, height: size, background: "#1c2a3a", color: "#e8c97e", fontSize: size * 0.34 }}
    >
      {initials}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [flights, setFlights] = useState<FlightLog[]>([]);
  const [reports, setReports] = useState<PerformanceReport[]>([]);

  useEffect(() => {
    api.get<Pilot[]>("/pilots", 60).then(setPilots).catch(() => {});
    api.get<FlightLog[]>("/flights").then(setFlights).catch(() => {});
    api.get<PerformanceReport[]>("/reports").then(setReports).catch(() => {});
  }, []);

  const activePilots   = pilots.filter((p) => p.status === "ACTIVE").length;
  const totalFlightHrs = Math.floor(pilots.reduce((a, p) => a + p.flightMinutes, 0) / 60);
  const approvedReports = reports.filter((r) => r.status === "APPROVED");
  const totalSeizures  = approvedReports.reduce((a, r) => a + r.seizures,  0);
  const totalAccidents = approvedReports.reduce((a, r) => a + r.accidents, 0);

  const pilotByCallsign = new Map(pilots.map((p) => [p.callsign, p]));

  const topPilots = [...pilots].sort((a, b) => {
    if (b.accumulatedScore !== a.accumulatedScore) return b.accumulatedScore - a.accumulatedScore;
    const ra = RANK_ORDER[a.rankName.toUpperCase()] ?? 0;
    const rb = RANK_ORDER[b.rankName.toUpperCase()] ?? 0;
    if (rb !== ra) return rb - ra;
    return a.callsign.localeCompare(b.callsign);
  });

  const recentFlights = [...flights]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const statCards = [
    { label: "Pilotos Ativos", value: activePilots,   sub: `${pilots.length} total`,              accent: "#e8c97e" },
    { label: "Horas de Voo",   value: totalFlightHrs, sub: "horas acumuladas",                    accent: "#4a90e2" },
    { label: "Apreensões",     value: totalSeizures,  sub: `${approvedReports.length} relatórios`, accent: "#3dd68c" },
    { label: "Acidentes",      value: totalAccidents, sub: `${approvedReports.length} relatórios`, accent: "#e24b4a" },
  ];

  return (
    <div className="p-3 md:p-6 space-y-4 min-h-full" style={{ background: "#0a0d12" }}>

      {/* Page header */}
      <div>
        <p className="text-[10px] font-mono tracking-[3px] uppercase mb-1" style={{ color: "#5a7a9a" }}>
          Air Support Division · Visão Geral
        </p>
        <h1 className="text-lg md:text-2xl font-mono font-bold tracking-wide md:tracking-widest uppercase" style={{ color: "#e8c97e" }}>
          Bem-vindo, {user?.name}
        </h1>
        <p className="text-[11px] font-mono mt-0.5" style={{ color: "#5a7a9a" }}>
          {user?.role}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {statCards.map(({ label, value, sub, accent }) => (
          <div
            key={label}
            className="rounded-lg px-4 py-4"
            style={{
              background: "#0d1117",
              border: "1px solid #1c2a3a",
              borderTop: `2px solid ${accent}`,
            }}
          >
            <div className="text-[10px] font-mono tracking-[1.5px] uppercase mb-2" style={{ color: "#5a7a9a" }}>
              {label}
            </div>
            <div className="font-mono text-3xl font-bold leading-none" style={{ color: accent }}>
              {value}
            </div>
            <div className="text-[10px] font-mono mt-1.5" style={{ color: "#5a7a9a" }}>
              {sub}
            </div>
          </div>
        ))}
      </div>

      {/* Two panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Atividade Recente */}
        <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
          <div className="px-4 py-2.5" style={{ borderBottom: "1px solid #1c2a3a" }}>
            <span className="text-[11px] font-mono tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>
              Atividade Recente
            </span>
          </div>
          <div className="px-4 py-1">
            {recentFlights.length === 0 ? (
              <p className="py-10 text-center text-[11px] font-mono tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>
                Nenhum voo registrado
              </p>
            ) : (
              recentFlights.map((f) => {
                const pilot = pilotByCallsign.get(f.pilotCallsign);
                const callsignColor = pilot ? (RANK_COLOR[pilot.rankName] ?? "#c8d6e5") : "#c8d6e5";
                const rankStyle = pilot ? getRankStyle(pilot.rankName) : getRankStyle("TRAINEE");
                return (
                  <div
                    key={f.id}
                    className="grid items-center gap-3 py-2.5"
                    style={{ gridTemplateColumns: "34px 1fr 1.2fr 1fr auto", borderBottom: "1px solid #111823" }}
                  >
                    <PilotAvatar
                      callsign={f.pilotCallsign}
                      name={f.pilotName}
                      photoUrl={pilot?.profileImageUrl}
                      size={34}
                    />
                    <div className="font-mono text-sm font-bold leading-none truncate" style={{ color: callsignColor }}>
                      {f.pilotCallsign}
                    </div>
                    <div className="font-mono text-[10px] truncate" style={{ color: "#5a7a9a" }}>
                      {f.pilotName}
                    </div>
                    <div>
                      {pilot && (
                        <span
                          className="text-[9px] font-mono uppercase px-1 py-px rounded whitespace-nowrap"
                          style={{ background: rankStyle.bg, color: rankStyle.color, border: `1px solid ${rankStyle.border}` }}
                        >
                          {RANK_LABEL[pilot.rankName] ?? pilot.rankName}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <FlightTypeBadge type={f.flightType} />
                      <span className="font-mono text-[11px] font-bold" style={{ color: "#e8c97e" }}>
                        {formatDuration(f.startedAt, f.endAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Pilotos */}
        <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
          <div className="px-4 py-2.5" style={{ borderBottom: "1px solid #1c2a3a" }}>
            <span className="text-[11px] font-mono tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>
              Ranking — Score
            </span>
          </div>
          <div className="px-4 py-1">
            {topPilots.length === 0 ? (
              <p className="py-10 text-center text-[11px] font-mono tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>
                Nenhum piloto cadastrado
              </p>
            ) : (
              topPilots.map((p, i) => {
                const rankStyle     = getRankStyle(p.rankName);
                const medalColor    = MEDAL_COLORS[i] ?? "#3a4a5a";
                const callsignColor = RANK_COLOR[p.rankName] ?? "#c8d6e5";
                return (
                  <div
                    key={p.id}
                    className="grid items-center gap-3 py-2.5"
                    style={{ gridTemplateColumns: "20px 36px 1fr 1.2fr 1fr 0.8fr", borderBottom: "1px solid #111823" }}
                  >
                    <div className="font-mono text-sm font-bold leading-none text-center shrink-0" style={{ color: medalColor }}>
                      {i + 1}
                    </div>
                    <PilotAvatar callsign={p.callsign} name={p.fullName} photoUrl={p.profileImageUrl} size={36} />
                    <div className="font-mono text-sm font-bold leading-none truncate" style={{ color: callsignColor }}>
                      {p.callsign}
                    </div>
                    <div className="font-mono text-[10px] truncate" style={{ color: "#5a7a9a" }}>
                      {p.fullName}
                    </div>
                    <div>
                      <span
                        className="text-[9px] font-mono uppercase px-1 py-px rounded whitespace-nowrap"
                        style={{ background: rankStyle.bg, color: rankStyle.color, border: `1px solid ${rankStyle.border}` }}
                      >
                        {RANK_LABEL[p.rankName] ?? p.rankName}
                      </span>
                    </div>
                    <div className="font-mono text-sm font-bold text-right" style={{ color: medalColor }}>
                      {p.accumulatedScore} pts
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
