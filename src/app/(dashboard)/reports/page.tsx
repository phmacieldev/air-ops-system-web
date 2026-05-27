"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PerformanceReport } from "@/types";

const RANK_THRESHOLDS = [
  { label: "PILOT_SENIOR", min: 1000, color: "#e8c97e" },
  { label: "PILOT_PLENO",  min: 600,  color: "#4a90e2" },
  { label: "PILOT_STD",    min: 200,  color: "#3dd68c" },
  { label: "TRAINEE",      min: 0,    color: "#5a7a9a" },
];

function getRank(score: number) {
  return RANK_THRESHOLDS.find((t) => score >= t.min)!;
}

function ScoreBar({ score }: { score: number }) {
  const idx  = RANK_THRESHOLDS.findIndex((t) => score >= t.min);
  const tier = RANK_THRESHOLDS[idx];
  const next = idx > 0 ? RANK_THRESHOLDS[idx - 1] : null;
  const base = tier.min;
  const cap  = next ? next.min : 1400;
  const pct  = next ? Math.min(((score - base) / (cap - base)) * 100, 100) : 100;

  return (
    <div className="space-y-1 w-full">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-mono tracking-[1.5px] uppercase" style={{ color: tier.color }}>
          {tier.label}
        </span>
        <span className="text-[10px] font-mono" style={{ color: tier.color }}>
          {score} pts
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "#1c2a3a" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg, #e8c97e, #f5a623)" }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const ok = status === "APPROVED";
  return (
    <span
      className="text-[9px] font-mono tracking-[1px] uppercase px-2 py-1 rounded whitespace-nowrap"
      style={
        ok
          ? { background: "#0a2a14", color: "#3dd68c", border: "1px solid #3dd68c44" }
          : { background: "#2a1f0a", color: "#e8c97e", border: "1px solid #e8c97e44" }
      }
    >
      {ok ? "Aprovado" : "Pendente"}
    </span>
  );
}

/* ─── Card (mobile < 768px) ─── */
function ReportCard({ report }: { report: PerformanceReport }) {
  const rank = getRank(report.score);
  return (
    <div
      className="px-4 py-3 space-y-3"
      style={{ borderBottom: "1px solid #1c2a3a" }}
    >
      {/* Callsign + nome + badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="font-mono text-base font-bold leading-none" style={{ color: rank.color }}>
            {report.pilotCallsign}
          </div>
          <div className="font-mono text-[11px] mt-0.5" style={{ color: "#5a7a9a" }}>
            {report.pilotName}
          </div>
        </div>
        <div className="shrink-0">
          <StatusBadge status={report.status} />
        </div>
      </div>

      {/* Métricas 2×2 — mais espaço por célula */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {[
          { label: "Apreensões", value: report.seizures,   color: "#c8d6e5" },
          { label: "Perseguições", value: report.chases,   color: "#4a90e2" },
          { label: "Operações",  value: report.operations, color: "#3dd68c" },
          { label: "Acidentes",  value: report.accidents,  color: "#e24b4a" },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="font-mono text-xl font-bold leading-none" style={{ color }}>
              {value}
            </div>
            <div className="text-[9px] font-mono tracking-[1px] uppercase" style={{ color: "#5a7a9a" }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Score bar */}
      <ScoreBar score={report.score} />
    </div>
  );
}

/* ─── Row (tablet/desktop ≥ 768px) ─── */
function ReportRow({ report }: { report: PerformanceReport }) {
  const rank = getRank(report.score);
  return (
    <div
      className="grid px-4 py-3 items-center transition-colors cursor-default"
      style={{
        gridTemplateColumns: "1.4fr 0.65fr 0.75fr 0.65fr 0.65fr 1.6fr 0.85fr",
        borderBottom: "1px solid #111823",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#111823")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div>
        <div className="font-mono text-sm font-bold leading-none" style={{ color: rank.color }}>
          {report.pilotCallsign}
        </div>
        <div className="font-mono text-[11px] mt-0.5" style={{ color: "#5a7a9a" }}>
          {report.pilotName}
        </div>
      </div>
      <div className="font-mono text-lg font-bold" style={{ color: "#c8d6e5" }}>{report.seizures}</div>
      <div className="font-mono text-lg font-bold" style={{ color: "#4a90e2" }}>{report.chases}</div>
      <div className="font-mono text-lg font-bold" style={{ color: "#3dd68c" }}>{report.operations}</div>
      <div className="font-mono text-lg font-bold" style={{ color: "#e24b4a" }}>{report.accidents}</div>
      <ScoreBar score={report.score} />
      <div className="flex justify-start">
        <StatusBadge status={report.status} />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [reports, setReports] = useState<PerformanceReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<PerformanceReport[]>("/reports")
      .then(setReports)
      .finally(() => setLoading(false));
  }, []);

  const empty = !loading && reports.length === 0;

  return (
    <div className="p-3 md:p-6 space-y-4 min-h-full overflow-x-hidden" style={{ background: "#0a0d12" }}>

      {/* Page header */}
      <div className="flex items-start md:items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono tracking-[3px] uppercase mb-1" style={{ color: "#5a7a9a" }}>
            Air Support Division · Gestão
          </p>
          <h1 className="text-lg md:text-2xl font-mono font-bold tracking-wide md:tracking-widest uppercase" style={{ color: "#e8c97e" }}>
            Relatórios de Desempenho
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#3dd68c" }} />
          <span className="text-[10px] font-mono tracking-[2px] uppercase" style={{ color: "#3dd68c" }}>
            {loading ? "—" : `${reports.length} reg.`}
          </span>
        </div>
      </div>

      {/* Panel */}
      <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>

        {/* Panel header */}
        <div
          className="flex items-center justify-between px-4 py-2.5 gap-4"
          style={{ borderBottom: "1px solid #1c2a3a" }}
        >
          <span className="text-[11px] font-mono tracking-[1.5px] uppercase shrink-0" style={{ color: "#e8c97e" }}>
            Histórico de desempenho
          </span>
          {/* Fórmula visível apenas em desktop */}
          <span className="hidden lg:block text-[10px] font-mono tracking-[1px] uppercase" style={{ color: "#5a7a9a" }}>
            Score = Apreensões ×10 + Perseguições ×8 + Ops ×12 − Acidentes ×5
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-[11px] font-mono tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>
            Carregando...
          </div>
        ) : empty ? (
          <div className="py-16 text-center text-[11px] font-mono tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>
            Nenhum relatório encontrado
          </div>
        ) : (
          <>
            {/* Desktop/Tablet: grid com cabeçalho de colunas */}
            <div className="hidden md:block">
              <div
                className="grid px-4 py-2"
                style={{
                  gridTemplateColumns: "1.4fr 0.65fr 0.75fr 0.65fr 0.65fr 1.6fr 0.85fr",
                  borderBottom: "1px solid #1c2a3a",
                }}
              >
                {["Piloto", "Apreens.", "Perseg.", "Ops", "Acid.", "Score", "Status"].map((h) => (
                  <div key={h} className="text-[9px] font-mono tracking-[1.5px] uppercase" style={{ color: "#5a7a9a" }}>
                    {h}
                  </div>
                ))}
              </div>
              {reports.map((r) => <ReportRow key={r.id} report={r} />)}
            </div>

            {/* Mobile: cards empilhados */}
            <div className="md:hidden">
              {reports.map((r) => <ReportCard key={r.id} report={r} />)}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
