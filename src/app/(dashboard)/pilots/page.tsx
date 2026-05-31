"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { Pilot, PerformanceReport, PagedResponse } from "@/types";

const MEMBER_CERTS = ["PURSUIT", "OPERATIONAL", "SCENE_CONTROL"];

const CERT_STYLES: Record<string, { label: string; bg: string; color: string; border: string }> = {
  PURSUIT:       { label: "Pursuit",    bg: "#0a1f2a", color: "#4a90e2", border: "#4a90e244" },
  OPERATIONAL:   { label: "Oper.",      bg: "#0a2a14", color: "#3dd68c", border: "#3dd68c44" },
  SCENE_CONTROL: { label: "Cena",       bg: "#2a1f0a", color: "#e8c97e", border: "#e8c97e44" },
};

function CertBadges({ certs }: { certs: string[] }) {
  const visible = certs.filter((c) => MEMBER_CERTS.includes(c));
  if (visible.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {visible.map((c) => {
        const s = CERT_STYLES[c];
        if (!s) return null;
        return (
          <span key={c} className="text-[8px] font-mono tracking-[0.5px] uppercase px-1.5 py-0.5 rounded"
            style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
            {s.label}
          </span>
        );
      })}
    </div>
  );
}

const RANK_ORDER: Record<string, number> = {
  LEAD: 10, SUPERVISOR: 6, INSTRUCTOR: 5,
  PILOT_SENIOR: 4, PILOT_PLENO: 3, PILOT_STANDARD: 2, TRAINEE: 1,
};

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
  LEAD: "Lead", SUPERVISOR: "Supervisor", INSTRUCTOR: "Instrutor",
  PILOT_SENIOR: "Senior", PILOT_PLENO: "Pleno", PILOT_STANDARD: "Standard", TRAINEE: "Trainee",
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
  return callsign.split(/[.\s_-]/).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 2);
}

function formatHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

function Avatar({ pilot, size = 32 }: { pilot: Pilot; size?: number }) {
  const rs = getRankStyle(pilot.rankName);
  if (pilot.profileImageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={pilot.profileImageUrl}
        alt={pilot.callsign}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center font-mono font-bold shrink-0"
      style={{ width: size, height: size, background: rs.bg, color: rs.color, fontSize: size * 0.34, border: `1px solid ${rs.border}` }}
    >
      {getInitials(pilot.callsign)}
    </div>
  );
}

export default function PilotsPage() {
  const router = useRouter();
  const [pilots, setPilots]   = useState<Pilot[]>([]);
  const [reports, setReports] = useState<PerformanceReport[]>([]);
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Pilot[]>("/pilots", 60),
      api.get<PagedResponse<PerformanceReport>>("/reports?page=0&size=1000").catch(() => ({ data: [] as PerformanceReport[], pagination: { page: 0, size: 1000, total: 0, totalPages: 0 } })),
    ]).then(([p, r]) => { setPilots(p); setReports(r.data); }).finally(() => setLoading(false));
  }, []);

  const accidentsByCallsign = reports
    .filter((r) => r.status === "APPROVED")
    .reduce<Record<string, number>>((acc, r) => {
      acc[r.pilotCallsign] = (acc[r.pilotCallsign] ?? 0) + r.accidents;
      return acc;
    }, {});

  const sorted = [...pilots].sort((a, b) => {
    const ra = RANK_ORDER[a.rankName.toUpperCase()] ?? 0;
    const rb = RANK_ORDER[b.rankName.toUpperCase()] ?? 0;
    if (rb !== ra) return rb - ra;
    return a.callsign.localeCompare(b.callsign);
  });

  const filtered = sorted.filter(
    (p) =>
      p.callsign.toLowerCase().includes(search.toLowerCase()) ||
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.rankName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-3 md:p-6 space-y-4 min-h-full" style={{ background: "#0a0d12" }}>

      {/* Header */}
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

      {/* List */}
      <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>

        {/* Column headers — desktop only */}
        <div
          className="hidden md:grid px-4 py-2 text-[9px] font-mono tracking-[1.5px] uppercase"
          style={{
            color: "#8a9ab8",
            borderBottom: "1px solid #1c2a3a",
            gridTemplateColumns: "40px 1fr 1.5fr 1.2fr 0.8fr 0.8fr 0.8fr 1fr",
            gap: "12px",
          }}
        >
          <div />
          <div>Callsign</div>
          <div>Nome</div>
          <div>Rank</div>
          <div>Score</div>
          <div>Voo</div>
          <div>Acid.</div>
          <div>Status</div>
        </div>

        {loading ? (
          <SkeletonRows rows={8} className="h-16" />
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-[11px] font-mono tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>
            Nenhum piloto encontrado
          </div>
        ) : (
          filtered.map((p, i) => {
            const rs        = getRankStyle(p.rankName);
            const statusCfg = STATUS_STYLES[p.status] ?? { label: p.status, color: "#5a7a9a" };
            const accidents = accidentsByCallsign[p.callsign] ?? 0;
            const isLast    = i === filtered.length - 1;

            return (
              <div
                key={p.id}
                className="cursor-pointer transition-colors duration-150"
                style={{ borderBottom: isLast ? "none" : "1px solid #111823" }}
                onClick={() => router.push(`/pilots/${p.id}`)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#111823")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Desktop row */}
                <div
                  className="hidden md:grid px-4 py-3 items-center"
                  style={{ gridTemplateColumns: "40px 1fr 1.5fr 1.2fr 0.8fr 0.8fr 0.8fr 1fr", gap: "12px" }}
                >
                  {/* Avatar */}
                  <Avatar pilot={p} size={32} />

                  {/* Callsign + certs */}
                  <div>
                    <div className="font-mono text-sm font-bold truncate" style={{ color: rs.color }}>{p.callsign}</div>
                    <CertBadges certs={p.certifications} />
                  </div>

                  {/* Nome */}
                  <div className="font-mono text-sm truncate" style={{ color: "#c8d6e5" }}>
                    {p.fullName}
                  </div>

                  {/* Rank */}
                  <div>
                    <span
                      className="text-[9px] font-mono tracking-[1px] uppercase px-2 py-0.5 rounded"
                      style={{ background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}
                    >
                      {RANK_LABEL[p.rankName.toUpperCase()] ?? p.rankName}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="font-mono text-sm font-bold" style={{ color: rs.color }}>
                    {p.accumulatedScore} pts
                  </div>

                  {/* Horas de voo */}
                  <div className="font-mono text-sm" style={{ color: "#c8d6e5" }}>
                    {formatHours(p.flightMinutes)}
                  </div>

                  {/* Acidentes */}
                  <div className="font-mono text-sm font-bold" style={{ color: "#e24b4a" }}>
                    {accidents}
                  </div>

                  {/* Status */}
                  <div className="font-mono text-[11px] font-bold" style={{ color: statusCfg.color }}>
                    ● {statusCfg.label}
                  </div>
                </div>

                {/* Mobile row */}
                <div className="flex md:hidden items-center gap-3 px-4 py-3">
                  <Avatar pilot={p} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold" style={{ color: rs.color }}>{p.callsign}</span>
                      <span
                        className="text-[9px] font-mono tracking-[1px] uppercase px-1.5 py-0.5 rounded"
                        style={{ background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}
                      >
                        {RANK_LABEL[p.rankName.toUpperCase()] ?? p.rankName}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] truncate mt-0.5" style={{ color: "#5a7a9a" }}>{p.fullName}</div>
                    <CertBadges certs={p.certifications} />
                    <div className="flex items-center gap-3 mt-1 font-mono text-[11px]">
                      <span style={{ color: "#c8d6e5" }}>{p.accumulatedScore} pts</span>
                      <span style={{ color: "#5a7a9a" }}>{formatHours(p.flightMinutes)}</span>
                      {accidents > 0 && <span style={{ color: "#e24b4a" }}>{accidents} acid.</span>}
                    </div>
                  </div>
                  <div className="font-mono text-[11px] font-bold shrink-0" style={{ color: statusCfg.color }}>
                    ● {statusCfg.label}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
