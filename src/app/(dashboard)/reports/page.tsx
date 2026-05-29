"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { FlightLog, PerformanceReport } from "@/types";

// ── Rank helpers ──────────────────────────────────────────────────────────

const HIGH_RANKS = new Set(["LEAD", "SUPERVISOR", "INSTRUCTOR"]);

const RANK_COLOR: Record<string, string> = {
  LEAD:           "#e8c97e",
  SUPERVISOR:     "#e8c97e",
  INSTRUCTOR:     "#e8c97e",
  PILOT_SENIOR:   "#e8c97e",
  PILOT_PLENO:    "#4a90e2",
  PILOT_STANDARD: "#3dd68c",
  TRAINEE:        "#5a7a9a",
};

const SCORE_TIERS = [
  { rank: "PILOT_SENIOR",   label: "PILOT_SENIOR", min: 1000, max: 1400 },
  { rank: "PILOT_PLENO",    label: "PILOT_PLENO",  min: 600,  max: 1000 },
  { rank: "PILOT_STANDARD", label: "PILOT_STD",    min: 200,  max: 600  },
  { rank: "TRAINEE",        label: "TRAINEE",       min: 0,    max: 200  },
];

// ── Sub-components ────────────────────────────────────────────────────────

function ScoreBar({ pilotRank, pilotAccumulatedScore }: { pilotRank: string; pilotAccumulatedScore: number }) {
  const color  = RANK_COLOR[pilotRank] ?? "#5a7a9a";
  const isHigh = HIGH_RANKS.has(pilotRank);

  if (isHigh) {
    return (
      <div className="flex items-center gap-2">
        <span
          className="text-[9px] font-mono tracking-[1.5px] uppercase px-2 py-0.5 rounded"
          style={{ background: color + "22", color, border: `1px solid ${color}44` }}
        >
          {pilotRank}
        </span>
        <span className="text-[9px] font-mono" style={{ color: "#3a5a7a" }}>Score N/A</span>
      </div>
    );
  }

  const tier  = SCORE_TIERS.find((t) => t.rank === pilotRank) ?? SCORE_TIERS[SCORE_TIERS.length - 1];
  const pct   = Math.min(Math.max(((pilotAccumulatedScore - tier.min) / (tier.max - tier.min)) * 100, 0), 100);

  return (
    <div className="space-y-1 w-full">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-mono tracking-[1.5px] uppercase" style={{ color }}>
          {tier.label}
        </span>
        <span className="text-[10px] font-mono" style={{ color }}>
          {pilotAccumulatedScore} pts
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

// ── Stepper input ─────────────────────────────────────────────────────────

function Stepper({
  label,
  value,
  color,
  onChange,
}: {
  label: string;
  value: number;
  color: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-lg p-3 space-y-2" style={{ background: "#0a0d12", border: "1px solid #1c2a3a" }}>
      <div className="text-[10px] font-mono tracking-[1px] uppercase" style={{ color: "#5a7a9a" }}>
        {label}
      </div>
      <div className="font-mono text-3xl font-bold leading-none" style={{ color }}>
        {value}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-7 h-7 rounded flex items-center justify-center font-bold text-base transition-colors"
          style={{ background: "#1c2a3a", color: "#c8d6e5" }}
        >
          −
        </button>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-7 h-7 rounded flex items-center justify-center font-bold text-base transition-colors"
          style={{ background: "#1c2a3a", color: "#c8d6e5" }}
        >
          +
        </button>
      </div>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────

function EditReportModal({
  report,
  onClose,
  onSaved,
}: {
  report: PerformanceReport;
  onClose: () => void;
  onSaved: (updated: PerformanceReport) => void;
}) {
  const [seizures,   setSeizures]   = useState(report.seizures);
  const [chases,     setChases]     = useState(report.chases);
  const [operations, setOperations] = useState(report.operations);
  const [accidents,  setAccidents]  = useState(report.accidents);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const previewScore = seizures * 5 + chases * 3 + operations * 3 - accidents * 5;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.put<PerformanceReport>(`/reports/${report.id}`, {
        seizures, chases, operations, accidents,
      });
      onSaved(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-lg overflow-hidden"
        style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ borderBottom: "1px solid #1c2a3a" }}
        >
          <div>
            <div className="text-[11px] font-mono tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>
              Editar Relatório
            </div>
            <div className="text-[10px] font-mono mt-0.5" style={{ color: "#5a7a9a" }}>
              {report.pilotCallsign} · {report.pilotName}
            </div>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-lg leading-none px-1"
            style={{ color: "#5a7a9a" }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Stepper label="Apreensões"   value={seizures}   color="#c8d6e5" onChange={setSeizures}   />
            <Stepper label="Perseguições" value={chases}     color="#4a90e2" onChange={setChases}     />
            <Stepper label="Operações"    value={operations} color="#3dd68c" onChange={setOperations} />
            <Stepper label="Acidentes"    value={accidents}  color="#e24b4a" onChange={setAccidents}  />
          </div>

          {/* Score preview */}
          <div
            className="rounded-lg p-3 flex items-center justify-between"
            style={{ background: "#0a0d12", border: "1px solid #1c2a3a" }}
          >
            <span className="text-[10px] font-mono tracking-[1px] uppercase" style={{ color: "#5a7a9a" }}>
              Score desta missão
            </span>
            <span className="font-mono text-2xl font-bold" style={{ color: previewScore >= 0 ? "#e8c97e" : "#e24b4a" }}>
              {Math.max(0, previewScore)}
            </span>
          </div>

          {error && (
            <p className="text-[11px] font-mono" style={{ color: "#e24b4a" }}>{error}</p>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="font-mono text-[12px] tracking-[1px] uppercase px-4 py-2 rounded transition-colors"
              style={{ background: "#1c2a3a", color: "#5a7a9a" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#263a4f")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#1c2a3a")}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="font-mono text-[12px] tracking-[1px] uppercase px-5 py-2 rounded font-semibold transition-colors"
              style={{
                background: "#e8c97e",
                color: "#0a0d12",
                opacity: saving ? 0.6 : 1,
                cursor: saving ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = "#f0d898"; }}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#e8c97e")}
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Card mobile ─── */
function ReportCard({
  report,
  canReview,
  onApprove,
  approving,
  onEdit,
}: {
  report: PerformanceReport;
  canReview: boolean;
  onApprove: (id: string) => void;
  approving: string | null;
  onEdit: (r: PerformanceReport) => void;
}) {
  const rankColor = RANK_COLOR[report.pilotRank] ?? "#5a7a9a";
  const busy = approving === report.id;
  return (
    <div className="px-4 py-3 space-y-3" style={{ borderBottom: "1px solid #1c2a3a" }}>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="font-mono text-base font-bold leading-none" style={{ color: rankColor }}>
            {report.pilotCallsign}
          </div>
          <div className="font-mono text-[11px] mt-0.5" style={{ color: "#5a7a9a" }}>
            {report.pilotName}
          </div>
        </div>
        <StatusBadge status={report.status} />
        {report.status === "PENDING" && (
          <button
            onClick={() => onEdit(report)}
            className="font-mono text-[10px] tracking-[1px] uppercase px-3 py-1.5 rounded"
            style={{ background: "#0a1f2a", color: "#4a90e2", border: "1px solid #4a90e244" }}
          >
            Editar
          </button>
        )}
        {canReview && report.status === "PENDING" && (
          <button
            disabled={busy}
            onClick={() => onApprove(report.id)}
            className="font-mono text-[10px] tracking-[1px] uppercase px-3 py-1.5 rounded transition-opacity"
            style={{ background: "#0a2a14", color: "#3dd68c", border: "1px solid #3dd68c44", opacity: busy ? 0.5 : 1 }}
          >
            {busy ? "..." : "Aprovar"}
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {[
          { label: "Apreensões",   value: report.seizures,   color: "#3dd68c" },
          { label: "Perseguições", value: report.chases,     color: "#4a90e2" },
          { label: "Operações",    value: report.operations, color: "#c8d6e5" },
          { label: "Acidentes",    value: report.accidents,  color: "#e24b4a" },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="font-mono text-xl font-bold leading-none" style={{ color }}>{value}</div>
            <div className="text-[9px] font-mono tracking-[1px] uppercase" style={{ color: "#5a7a9a" }}>{label}</div>
          </div>
        ))}
      </div>
      <ScoreBar pilotRank={report.pilotRank} pilotAccumulatedScore={report.pilotAccumulatedScore} />
    </div>
  );
}

/* ─── Row desktop ─── */
function ReportRow({
  report,
  canReview,
  onApprove,
  approving,
  onEdit,
}: {
  report: PerformanceReport;
  canReview: boolean;
  onApprove: (id: string) => void;
  approving: string | null;
  onEdit: (r: PerformanceReport) => void;
}) {
  const rankColor = RANK_COLOR[report.pilotRank] ?? "#5a7a9a";
  const busy = approving === report.id;
  const isPending = report.status === "PENDING";
  const COLS = "1.2fr 0.55fr 0.65fr 0.55fr 0.55fr 1.8fr 200px";
  return (
    <div
      className="grid gap-x-4 px-4 py-3 items-center transition-colors cursor-default"
      style={{ gridTemplateColumns: COLS, borderBottom: "1px solid #111823" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#111823")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div>
        <div className="font-mono text-sm font-bold leading-none" style={{ color: rankColor }}>
          {report.pilotCallsign}
        </div>
        <div className="font-mono text-[11px] mt-0.5" style={{ color: "#5a7a9a" }}>
          {report.pilotName}
        </div>
      </div>
      <div className="font-mono text-lg font-bold text-center" style={{ color: "#3dd68c" }}>{report.seizures}</div>
      <div className="font-mono text-lg font-bold text-center" style={{ color: "#4a90e2" }}>{report.chases}</div>
      <div className="font-mono text-lg font-bold text-center" style={{ color: "#c8d6e5" }}>{report.operations}</div>
      <div className="font-mono text-lg font-bold text-center" style={{ color: "#e24b4a" }}>{report.accidents}</div>
      <ScoreBar pilotRank={report.pilotRank} pilotAccumulatedScore={report.pilotAccumulatedScore} />
      <div className="flex flex-col gap-1.5">
        <div>
          <StatusBadge status={report.status} />
        </div>
        {isPending && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(report)}
              className="font-mono text-[10px] tracking-[1px] uppercase px-3 py-1.5 rounded transition-colors"
              style={{ background: "#0a1f2a", color: "#4a90e2", border: "1px solid #4a90e244", whiteSpace: "nowrap" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#112d42")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#0a1f2a")}
            >
              Editar
            </button>
            {canReview && (
              <button
                disabled={busy}
                onClick={() => onApprove(report.id)}
                className="font-mono text-[10px] tracking-[1px] uppercase px-3 py-1.5 rounded transition-colors"
                style={{ background: "#0a2a14", color: "#3dd68c", border: "1px solid #3dd68c44", opacity: busy ? 0.5 : 1, whiteSpace: "nowrap" }}
                onMouseEnter={(e) => { if (!busy) e.currentTarget.style.background = "#0f3d1e"; }}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#0a2a14")}
              >
                {busy ? "..." : "Aprovar"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports]       = useState<PerformanceReport[]>([]);
  const [flights, setFlights]       = useState<FlightLog[]>([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const [approving, setApproving]   = useState<string | null>(null);
  const [flightId, setFlightId]     = useState("");
  const [seizures, setSeizures]     = useState(0);
  const [chases, setChases]         = useState(0);
  const [operations, setOperations] = useState(0);
  const [accidents, setAccidents]   = useState(0);

  const [editingReport, setEditingReport] = useState<PerformanceReport | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<PerformanceReport[]>("/reports"),
      api.get<FlightLog[]>("/flights/mine").catch(() => [] as FlightLog[]),
    ]).then(([r, f]) => {
      setReports(r);
      const reportedFlightIds = new Set(r.map((rep) => rep.flightId));
      const eligible = f.filter(
        (fl) => (fl.flightStatus === "APPROVED" || fl.flightStatus === "PENDING") && !reportedFlightIds.has(fl.id)
      );
      setFlights(eligible);
      if (eligible.length > 0) setFlightId(eligible[0].id);
    }).finally(() => setLoading(false));
  }, []);

  const canReview  = user?.role === "LEAD" || user?.role === "SUPERVISOR";
  const previewScore = seizures * 5 + chases * 3 + operations * 3 - accidents * 5;

  const [filterSearch, setFilterSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filteredReports = reports.filter((r) => {
    const q = filterSearch.toLowerCase();
    const matchSearch = !q || r.pilotCallsign.toLowerCase().includes(q) || r.pilotName.toLowerCase().includes(q);
    const matchStatus = !filterStatus || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  async function approveReport(id: string) {
    if (!user) return;
    setApproving(id);
    try {
      const updated = await api.post<PerformanceReport>(`/reports/${id}/review`, {
        reviewerEmail: user.email,
      });
      setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch { /* silently ignore */ }
    finally { setApproving(null); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!flightId) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await api.post<PerformanceReport>("/reports", {
        flightId,
        seizures,
        chases,
        operations,
        accidents,
      });
      setReports((prev) => [created, ...prev]);
      setFlights((prev) => prev.filter((f) => f.id !== flightId));
      setSeizures(0); setChases(0); setOperations(0); setAccidents(0);
      setFlightId("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar relatório");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedFlight = flights.find((f) => f.id === flightId);
  const empty = !loading && reports.length === 0;

  return (
    <div className="p-3 md:p-6 space-y-4 min-h-full overflow-x-hidden" style={{ background: "#0a0d12" }}>

      {/* Edit modal */}
      {editingReport && (
        <EditReportModal
          report={editingReport}
          onClose={() => setEditingReport(null)}
          onSaved={(updated) => {
            setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
            setEditingReport(null);
          }}
        />
      )}

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

      {/* Form — only when there are eligible flights */}
      {!loading && flights.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* LEFT — form */}
          <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
            <div className="px-4 py-2.5" style={{ borderBottom: "1px solid #1c2a3a" }}>
              <span className="text-[11px] font-mono tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>
                Novo Relatório
              </span>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">

              {/* Voo */}
              <div>
                <label className="block text-[10px] font-mono tracking-[1.5px] uppercase mb-1" style={{ color: "#5a7a9a" }}>
                  Voo (aprovado)
                </label>
                <select
                  value={flightId}
                  onChange={(e) => setFlightId(e.target.value)}
                  className="w-full font-mono text-sm px-3 py-2 rounded outline-none"
                  style={{ background: "#0a0d12", border: "1px solid #1c2a3a", color: "#c8d6e5" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#e8c97e")}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = "#1c2a3a")}
                >
                  {flights.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.pilotCallsign} — {f.flightType} — {new Date(f.startedAt).toLocaleDateString("pt-BR")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Steppers 2×2 */}
              <div className="grid grid-cols-2 gap-3">
                <Stepper label="Apreensões"   value={seizures}   color="#c8d6e5" onChange={setSeizures}   />
                <Stepper label="Perseguições" value={chases}     color="#4a90e2" onChange={setChases}     />
                <Stepper label="Operações"    value={operations} color="#3dd68c" onChange={setOperations} />
                <Stepper label="Acidentes"    value={accidents}  color="#e24b4a" onChange={setAccidents}  />
              </div>

              {error && (
                <p className="text-[11px] font-mono" style={{ color: "#e24b4a" }}>{error}</p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !flightId}
                  className="font-mono text-[12px] tracking-[1px] uppercase px-5 py-2 rounded font-semibold"
                  style={{
                    background: success ? "#0a2a14" : "#e8c97e",
                    color:      success ? "#3dd68c" : "#0a0d12",
                    border:     success ? "1px solid #3dd68c44" : "1px solid transparent",
                    opacity:    (submitting || !flightId) ? 0.6 : 1,
                    cursor:     (submitting || !flightId) ? "not-allowed" : "pointer",
                  }}
                >
                  {success ? "✓ Enviado" : submitting ? "Enviando..." : "Enviar Relatório"}
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT — preview de score */}
          <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
            <div className="px-4 py-2.5" style={{ borderBottom: "1px solid #1c2a3a" }}>
              <span className="text-[11px] font-mono tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>
                Pontuação Calculada
              </span>
            </div>
            <div className="p-4 space-y-4">

              {selectedFlight && (
                <div>
                  <div className="font-mono text-sm font-bold" style={{ color: "#e8c97e" }}>
                    {selectedFlight.pilotCallsign}
                  </div>
                  <div className="font-mono text-[11px]" style={{ color: "#5a7a9a" }}>
                    {selectedFlight.flightType} · {new Date(selectedFlight.startedAt).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              )}

              {/* Score preview */}
              <div className="rounded-lg p-4 text-center" style={{ background: "#0a0d12", border: "1px solid #1c2a3a" }}>
                <div className="text-[9px] font-mono tracking-[1.5px] uppercase mb-1" style={{ color: "#5a7a9a" }}>
                  Score desta missão
                </div>
                <div className="font-mono text-4xl font-bold" style={{ color: Math.max(0, previewScore) >= 0 ? "#e8c97e" : "#e24b4a" }}>
                  {Math.max(0, previewScore)}
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-1 text-[11px] font-mono" style={{ color: "#5a7a9a" }}>
                {[
                  { label: "Apreensões",   v: seizures,   mult: 5,  color: "#c8d6e5" },
                  { label: "Perseguições", v: chases,     mult: 3,  color: "#4a90e2" },
                  { label: "Operações",    v: operations, mult: 3,  color: "#3dd68c" },
                  { label: "Acidentes",    v: accidents,  mult: -5, color: "#e24b4a" },
                ].map(({ label, v, mult, color }) => (
                  <div key={label} className="flex justify-between">
                    <span>{label} × {Math.abs(mult)}</span>
                    <span style={{ color }}>{mult > 0 ? "+" : ""}{v * mult}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-1" style={{ borderTop: "1px solid #1c2a3a", color: "#e8c97e" }}>
                  <span>Total</span>
                  <span>{Math.max(0, previewScore)} pts</span>
                </div>
              </div>

              <div className="text-[9px] font-mono tracking-[1px] uppercase text-center" style={{ color: "#3a5a7a" }}>
                Score = Apreensões ×5 + Perseguições ×3 + Ops ×3 − Acidentes ×5
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
        <div className="flex items-center justify-between px-4 py-2.5 gap-4" style={{ borderBottom: "1px solid #1c2a3a" }}>
          <span className="text-[11px] font-mono tracking-[1.5px] uppercase shrink-0" style={{ color: "#e8c97e" }}>
            Histórico de desempenho
          </span>
          <span className="hidden lg:block text-[10px] font-mono tracking-[1px] uppercase" style={{ color: "#5a7a9a" }}>
            Score = Apreensões ×5 + Perseguições ×3 + Ops ×3 − Acidentes ×5
          </span>
        </div>
        {/* Filter bar */}
        {!loading && reports.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 py-3" style={{ borderBottom: "1px solid #1c2a3a" }}>
            <input
              type="text"
              placeholder="Buscar piloto..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="font-mono text-[12px] px-3 py-1.5 rounded outline-none"
              style={{ background: "#0a0d12", border: "1px solid #1c2a3a", color: "#c8d6e5", minWidth: 160 }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#e8c97e")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = "#1c2a3a")}
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="font-mono text-[12px] px-3 py-1.5 rounded outline-none"
              style={{ background: "#0a0d12", border: "1px solid #1c2a3a", color: "#c8d6e5" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#e8c97e")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = "#1c2a3a")}
            >
              <option value="">Todos os status</option>
              <option value="PENDING">Pendente</option>
              <option value="APPROVED">Aprovado</option>
            </select>
            {(filterSearch || filterStatus) && (
              <button
                onClick={() => { setFilterSearch(""); setFilterStatus(""); }}
                className="font-mono text-[10px] tracking-[1px] uppercase px-3 py-1.5 rounded"
                style={{ background: "#1c2a3a", color: "#5a7a9a" }}>
                Limpar
              </button>
            )}
            <span className="font-mono text-[10px] self-center" style={{ color: "#5a7a9a" }}>
              {filteredReports.length} resultado{filteredReports.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

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
            <div className="hidden md:block">
              <div className="grid gap-x-4 px-4 py-2" style={{ gridTemplateColumns: "1.2fr 0.55fr 0.65fr 0.55fr 0.55fr 1.8fr 200px", borderBottom: "1px solid #1c2a3a" }}>
                {["Piloto", "Apreens.", "Perseg.", "Ops", "Acid.", "Score", "Status"].map((h, i) => (
                  <div key={h} className={`text-[9px] font-mono tracking-[1.5px] uppercase ${i >= 1 && i <= 4 ? "text-center" : ""}`} style={{ color: "#5a7a9a" }}>{h}</div>
                ))}
              </div>
              {filteredReports.map((r) => (
                <ReportRow
                  key={r.id}
                  report={r}
                  canReview={canReview}
                  onApprove={approveReport}
                  approving={approving}
                  onEdit={setEditingReport}
                />
              ))}
            </div>
            <div className="md:hidden">
              {filteredReports.map((r) => (
                <ReportCard
                  key={r.id}
                  report={r}
                  canReview={canReview}
                  onApprove={approveReport}
                  approving={approving}
                  onEdit={setEditingReport}
                />
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
