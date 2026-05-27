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
  PATROL:            { label: "Patrulha",     bg: "#0a1f2a", color: "#4a90e2" },
  PURSUIT_10_94:     { label: "Perseguição",  bg: "#2a1010", color: "#e24b4a" },
  BANK_FLEECA_10_90: { label: "Banco Fleeca", bg: "#2a1f0a", color: "#e8c97e" },
  PALETO_BANK:       { label: "Banco Paleto", bg: "#2a1f0a", color: "#e8c97e" },
  BANK_68_10_90:     { label: "Banco 68",     bg: "#2a1f0a", color: "#e8c97e" },
  BOOSTING_S:        { label: "Apreensão",    bg: "#0a2a14", color: "#3dd68c" },
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

function getInitials(callsign: string) {
  return callsign
    .split(/[.\s_-]/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const MEDAL_COLORS = ["#e8c97e", "#8a9ab8", "#9a6030", "#3a4a5a"];

export default function DashboardPage() {
  const { user } = useAuth();
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [flights, setFlights] = useState<FlightLog[]>([]);
  const [reports, setReports] = useState<PerformanceReport[]>([]);

  useEffect(() => {
    api.get<Pilot[]>("/pilots").then(setPilots).catch(() => {});
    api.get<FlightLog[]>("/flights").then(setFlights).catch(() => {});
    api.get<PerformanceReport[]>("/reports").then(setReports).catch(() => {});
  }, []);

  const activePilots   = pilots.filter((p) => p.status === "ACTIVE").length;
  const totalFlightHrs = Math.floor(pilots.reduce((a, p) => a + p.flightMinutes, 0) / 60);
  const pendingFlights = flights.filter((f) => f.flightStatus === "PENDING").length;
  const pendingReports = reports.filter((r) => r.status === "PENDING").length;

  const topPilots = [...pilots]
    .sort((a, b) => b.accumulatedScore - a.accumulatedScore)
    .slice(0, 4);

  const recentFlights = [...flights]
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 5);

  const statCards = [
    { label: "Pilotos Ativos",       value: activePilots,   sub: `${pilots.length} total`,    accent: "#e8c97e" },
    { label: "Horas de Voo",         value: totalFlightHrs, sub: "horas acumuladas",           accent: "#4a90e2" },
    { label: "Voos Pendentes",        value: pendingFlights, sub: `${flights.length} total`,   accent: "#3dd68c" },
    { label: "Relatórios Pendentes", value: pendingReports, sub: `${reports.length} total`,    accent: "#e24b4a" },
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
            <div className="text-[10px] font-mono mt-1.5" style={{ color: "#3a5a7a" }}>
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
              recentFlights.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 py-2.5"
                  style={{ borderBottom: "1px solid #111823" }}
                >
                  <div className="font-mono text-[11px] min-w-[80px] shrink-0" style={{ color: "#5a7a9a" }}>
                    {formatTime(f.startedAt)}
                  </div>
                  <div className="flex-1 font-mono text-sm truncate" style={{ color: "#c8d6e5" }}>
                    {f.pilotCallsign}
                  </div>
                  <FlightTypeBadge type={f.flightType} />
                  <div className="font-mono text-base font-bold min-w-[44px] text-right" style={{ color: "#e8c97e" }}>
                    {formatDuration(f.startedAt, f.endAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Pilotos */}
        <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
          <div className="px-4 py-2.5" style={{ borderBottom: "1px solid #1c2a3a" }}>
            <span className="text-[11px] font-mono tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>
              Top Pilotos — Score
            </span>
          </div>
          <div className="px-4 py-1">
            {topPilots.length === 0 ? (
              <p className="py-10 text-center text-[11px] font-mono tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>
                Nenhum piloto cadastrado
              </p>
            ) : (
              topPilots.map((p, i) => {
                const rankStyle = getRankStyle(p.rankName);
                const medalColor = MEDAL_COLORS[i] ?? "#3a4a5a";
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 py-2.5"
                    style={{ borderBottom: "1px solid #111823" }}
                  >
                    <div className="font-mono text-xl font-bold w-5 leading-none shrink-0" style={{ color: medalColor }}>
                      {i + 1}
                    </div>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-mono font-bold shrink-0"
                      style={{ background: "#1c2a3a", color: "#e8c97e" }}
                    >
                      {getInitials(p.callsign)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm font-bold leading-none truncate" style={{ color: "#c8d6e5" }}>
                        {p.callsign}
                      </div>
                      <span
                        className="text-[9px] font-mono tracking-[1px] uppercase mt-0.5 inline-block px-1.5 py-0.5 rounded"
                        style={{
                          background: rankStyle.bg,
                          color: rankStyle.color,
                          border: `1px solid ${rankStyle.border}`,
                        }}
                      >
                        {p.rankName}
                      </span>
                    </div>
                    <div className="font-mono text-sm font-bold shrink-0" style={{ color: medalColor }}>
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
