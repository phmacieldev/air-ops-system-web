"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { FlightLog } from "@/types";

// ── Enums ─────────────────────────────────────────────────────────────────

const FLIGHT_TYPE_OPTIONS = [
  { value: "PATROL",            label: "Perseguição 10-80",    bg: "#0a1f2a", color: "#4a90e2" },
  { value: "PURSUIT_10_94",     label: "Perseguição [10-94]",  bg: "#2a1010", color: "#e24b4a" },
  { value: "BANK_FLEECA_10_90", label: "Banco Fleeca [10-90]", bg: "#2a1f0a", color: "#e8c97e" },
  { value: "PALETO_BANK",       label: "Banco Paleto",          bg: "#2a1f0a", color: "#e8c97e" },
  { value: "BANK_68_10_90",     label: "Banco 68 [10-90]",     bg: "#2a1f0a", color: "#e8c97e" },
  { value: "BOOSTING_S",        label: "Apreensão Veicular",   bg: "#0a2a14", color: "#3dd68c" },
] as const;

const AIRCRAFT_OPTIONS = [
  { value: "MAVERICK_1",  label: "Maverick N-1" },
  { value: "MAVERICK_2",  label: "Maverick N-2" },
  { value: "LITTLE_BIRD", label: "Little Bird"  },
] as const;

const FLIGHT_TYPE_MAP: Record<string, { label: string; bg: string; color: string }> = {
  PATROL:            { label: "Pers. 10-80",    bg: "#0a1f2a", color: "#4a90e2" },
  PURSUIT_10_94:     { label: "Perseguição",    bg: "#2a1010", color: "#e24b4a" },
  BANK_FLEECA_10_90: { label: "Banco Fleeca",   bg: "#2a1f0a", color: "#e8c97e" },
  PALETO_BANK:       { label: "Banco Paleto",   bg: "#2a1f0a", color: "#e8c97e" },
  BANK_68_10_90:     { label: "Banco 68",       bg: "#2a1f0a", color: "#e8c97e" },
  BOOSTING_S:        { label: "Apreensão",      bg: "#0a2a14", color: "#3dd68c" },
};

const AIRCRAFT_LABEL: Record<string, string> = {
  MAVERICK_1:  "Maverick N-1",
  MAVERICK_2:  "Maverick N-2",
  LITTLE_BIRD: "Little Bird",
};

const STATUS_MAP: Record<string, { label: string; bg: string; color: string; border: string }> = {
  APPROVED: { label: "Aprovado",  bg: "#0a2a14", color: "#3dd68c", border: "#3dd68c44" },
  REJECTED: { label: "Rejeitado", bg: "#2a0a0a", color: "#e24b4a", border: "#e24b4a44" },
  PENDING:  { label: "Pendente",  bg: "#2a1f0a", color: "#e8c97e", border: "#e8c97e44" },
};

// ── Helpers ───────────────────────────────────────────────────────────────

function calcDurationMins(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.round((e.getTime() - s.getTime()) / 60000);
}

function formatMins(mins: number | null): string {
  if (!mins || mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m}min`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return `hoje ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `ontem ${time}`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + ` ${time}`;
}

// ── Sub-components ────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const cfg = FLIGHT_TYPE_MAP[type] ?? { label: type, bg: "#1c2a3a", color: "#5a7a9a" };
  return (
    <span
      className="text-[10px] font-mono tracking-[1px] uppercase px-2 py-0.5 rounded whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] ?? { label: status, bg: "#1c2a3a", color: "#5a7a9a", border: "#5a7a9a44" };
  return (
    <span
      className="text-[9px] font-mono tracking-[1px] uppercase px-2 py-1 rounded whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  );
}

// ── Input helpers ─────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  background: "#0a0d12",
  border: "1px solid #1c2a3a",
  borderRadius: "6px",
  padding: "8px 10px",
  color: "#c8d6e5",
  fontFamily: "monospace",
  fontSize: "13px",
  width: "100%",
  outline: "none",
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block text-[10px] font-mono tracking-[1.5px] uppercase mb-1"
      style={{ color: "#5a7a9a" }}
    >
      {children}
    </label>
  );
}

function borderGold(e: React.FocusEvent<HTMLElement>) {
  e.currentTarget.style.borderColor = "#e8c97e";
}
function borderReset(e: React.FocusEvent<HTMLElement>) {
  e.currentTarget.style.borderColor = "#1c2a3a";
}

// ── Edit Flight Modal ─────────────────────────────────────────────────────

function EditFlightModal({
  flight,
  onClose,
  onSaved,
}: {
  flight: FlightLog;
  onClose: () => void;
  onSaved: (updated: FlightLog) => void;
}) {
  const initialDate      = flight.startedAt.split("T")[0];
  const initialStartTime = flight.startedAt.split("T")[1]?.slice(0, 5) ?? "";
  const initialEndTime   = flight.endAt ? flight.endAt.split("T")[1]?.slice(0, 5) ?? "" : "";

  const [flightType, setFlightType] = useState<string>(flight.flightType);
  const [aircraft,   setAircraft]   = useState<string>(flight.aircraft);
  const [date,       setDate]       = useState(initialDate);
  const [startTime,  setStartTime]  = useState(initialStartTime);
  const [endTime,    setEndTime]    = useState(initialEndTime);
  const [notes,      setNotes]      = useState(flight.notes ?? "");
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  async function handleSave() {
    if (!date || !startTime) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.put<FlightLog>(`/flights/${flight.id}`, {
        aircraft,
        flightType,
        startedAt: `${date}T${startTime}:00`,
        endAt:     endTime ? `${date}T${endTime}:00` : null,
        notes:     notes.trim() || null,
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
              Editar Protocolo
            </div>
            <div className="text-[10px] font-mono mt-0.5" style={{ color: "#5a7a9a" }}>
              {flight.pilotCallsign} · {flight.pilotName}
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

          {/* Tipo + Aeronave */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo de Missão</Label>
              <select
                value={flightType}
                onChange={(e) => setFlightType(e.target.value)}
                style={inputBase}
                onFocus={borderGold}
                onBlur={borderReset}
              >
                {FLIGHT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Aeronave</Label>
              <select
                value={aircraft}
                onChange={(e) => setAircraft(e.target.value)}
                style={inputBase}
                onFocus={borderGold}
                onBlur={borderReset}
              >
                {AIRCRAFT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Data */}
          <div>
            <Label>Data</Label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={inputBase}
              onFocus={borderGold}
              onBlur={borderReset}
            />
          </div>

          {/* Início + Término */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Início</Label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={inputBase}
                onFocus={borderGold}
                onBlur={borderReset}
              />
            </div>
            <div>
              <Label>Término</Label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={inputBase}
                onFocus={borderGold}
                onBlur={borderReset}
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <Label>Observações</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              style={{ ...inputBase, resize: "none" }}
              onFocus={borderGold}
              onBlur={borderReset}
            />
          </div>

          {error && (
            <p className="text-[11px] font-mono" style={{ color: "#e24b4a" }}>{error}</p>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="font-mono text-[12px] tracking-[1px] uppercase px-4 py-2 rounded"
              style={{ background: "#1c2a3a", color: "#5a7a9a" }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !date || !startTime}
              className="font-mono text-[12px] tracking-[1px] uppercase px-5 py-2 rounded font-semibold"
              style={{
                background: "#e8c97e",
                color: "#0a0d12",
                opacity: (saving || !date || !startTime || !endTime) ? 0.6 : 1,
                cursor: (saving || !date || !startTime || !endTime) ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function FlightsPage() {
  const { user } = useAuth();
  const [flights, setFlights]       = useState<FlightLog[]>([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [reviewing, setReviewing]       = useState<string | null>(null);
  const [editingFlight, setEditingFlight] = useState<FlightLog | null>(null);

  const today   = new Date().toISOString().split("T")[0];
  const timeNow = new Date().toTimeString().slice(0, 5);

  const [flightType, setFlightType] = useState<string>(FLIGHT_TYPE_OPTIONS[0].value);
  const [aircraft, setAircraft]     = useState<string>(AIRCRAFT_OPTIONS[0].value);
  const [date, setDate]             = useState(today);
  const [startTime, setStartTime]   = useState(timeNow);
  const [endTime, setEndTime]       = useState("");
  const [notes, setNotes]           = useState("");

  useEffect(() => {
    api.get<FlightLog[]>("/flights")
      .then((data) => setFlights(data.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())))
      .finally(() => setLoading(false));
  }, []);

  async function reviewFlight(id: string, status: "APPROVED" | "REJECTED") {
    if (!user) return;
    setReviewing(id);
    try {
      const updated = await api.post<FlightLog>(`/flights/${id}/review`, {
        approverEmail: user.email,
        status,
      });
      setFlights((prev) => prev.map((f) => (f.id === id ? updated : f)));
    } catch { /* re-enable button silently */ }
    finally { setReviewing(null); }
  }

  const isLead        = user?.role === "LEAD";
  const pendingFlights = flights.filter((f) => f.flightStatus === "PENDING");

  const selectedType = FLIGHT_TYPE_OPTIONS.find((o) => o.value === flightType)!;

  const previewDuration =
    date && startTime && endTime
      ? formatMins(calcDurationMins(`${date}T${startTime}`, `${date}T${endTime}`))
      : "—";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !startTime) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await api.post<FlightLog>("/flights", {
        pilotEmail: user!.email,
        aircraft,
        flightType,
        startedAt: `${date}T${startTime}:00`,
        endAt:     endTime ? `${date}T${endTime}:00` : null,
        notes:     notes.trim() || null,
      });
      setFlights((prev) => [created, ...prev]);
      setSuccess(true);
      setNotes("");
      setEndTime("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao registrar protocolo";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const recentFlights = flights.slice(0, 5);

  // ── Filters ──
  const [filterSearch, setFilterSearch] = useState("");
  const [filterType,   setFilterType]   = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filteredFlights = flights.filter((f) => {
    const q = filterSearch.toLowerCase();
    const matchSearch = !q || f.pilotCallsign.toLowerCase().includes(q) || f.pilotName.toLowerCase().includes(q);
    const matchType   = !filterType   || f.flightType   === filterType;
    const matchStatus = !filterStatus || f.flightStatus === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <div className="p-3 md:p-6 space-y-4 min-h-full" style={{ background: "#0a0d12" }}>

      {/* Edit modal */}
      {editingFlight && (
        <EditFlightModal
          flight={editingFlight}
          onClose={() => setEditingFlight(null)}
          onSaved={(updated) => {
            setFlights((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
            setEditingFlight(null);
          }}
        />
      )}

      {/* Page header */}
      <div className="flex items-start md:items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono tracking-[3px] uppercase mb-1" style={{ color: "#5a7a9a" }}>
            Air Support Division · Operações
          </p>
          <h1 className="text-lg md:text-2xl font-mono font-bold tracking-wide md:tracking-widest uppercase" style={{ color: "#e8c97e" }}>
            Protocolos de Voo
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#3dd68c" }} />
          <span className="text-[10px] font-mono tracking-[2px] uppercase" style={{ color: "#3dd68c" }}>
            {loading ? "—" : `${flights.length} reg.`}
          </span>
        </div>
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* LEFT — Form */}
        <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
          <div className="px-4 py-2.5" style={{ borderBottom: "1px solid #1c2a3a" }}>
            <span className="text-[11px] font-mono tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>
              Novo Protocolo de Voo
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">

            {/* Tipo + Aeronave */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo de Missão</Label>
                <select
                  value={flightType}
                  onChange={(e) => setFlightType(e.target.value)}
                  style={inputBase}
                  onFocus={borderGold}
                  onBlur={borderReset}
                >
                  {FLIGHT_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Aeronave</Label>
                <select
                  value={aircraft}
                  onChange={(e) => setAircraft(e.target.value)}
                  style={inputBase}
                  onFocus={borderGold}
                  onBlur={borderReset}
                >
                  {AIRCRAFT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Data */}
            <div>
              <Label>Data</Label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                style={inputBase}
                onFocus={borderGold}
                onBlur={borderReset}
              />
            </div>

            {/* Início + Término */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Início</Label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  style={inputBase}
                  onFocus={borderGold}
                  onBlur={borderReset}
                />
              </div>
              <div>
                <Label>Término (opcional)</Label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={inputBase}
                  onFocus={borderGold}
                  onBlur={borderReset}
                />
              </div>
            </div>

            {/* Observações */}
            <div>
              <Label>Observações</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Incidente, demais ocorrências, número 95, etc..."
                style={{ ...inputBase, resize: "none" }}
                onFocus={borderGold}
                onBlur={borderReset}
              />
            </div>

            {error && (
              <p className="text-[11px] font-mono" style={{ color: "#e24b4a" }}>{error}</p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="font-mono text-[12px] tracking-[1px] uppercase px-5 py-2 rounded font-semibold transition-all"
                style={{
                  background: success ? "#0a2a14" : "#e8c97e",
                  color:      success ? "#3dd68c" : "#0a0d12",
                  border:     success ? "1px solid #3dd68c44" : "1px solid transparent",
                  opacity:    submitting ? 0.6 : 1,
                  cursor:     submitting ? "not-allowed" : "pointer",
                }}
              >
                {success ? "✓ Registrado" : submitting ? "Enviando..." : "Registrar Protocolo"}
              </button>
            </div>

          </form>
        </div>

        {/* RIGHT — Preview + Logs recentes */}
        <div className="space-y-4">

          {/* Live preview */}
          <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
            <div className="px-4 py-2.5" style={{ borderBottom: "1px solid #1c2a3a" }}>
              <span className="text-[11px] font-mono tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>
                Preview do Protocolo
              </span>
            </div>
            <div className="px-4 py-4 space-y-3">

              {/* Piloto */}
              <div>
                <div className="font-mono text-sm font-bold" style={{ color: "#e8c97e" }}>
                  {user?.name ?? "—"}
                </div>
                <div className="font-mono text-[11px]" style={{ color: "#5a7a9a" }}>
                  {user?.email ?? "—"}
                </div>
              </div>

              {/* Tipo + Aeronave + Duração */}
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className="text-[10px] font-mono tracking-[1px] uppercase px-2 py-0.5 rounded"
                  style={{ background: selectedType.bg, color: selectedType.color }}
                >
                  {selectedType.label}
                </span>
                <span className="font-mono text-[11px]" style={{ color: "#5a7a9a" }}>
                  {AIRCRAFT_LABEL[aircraft]}
                </span>
                <span className="font-mono text-base font-bold" style={{ color: "#e8c97e" }}>
                  {previewDuration}
                </span>
              </div>

              {/* Data / Início / Término */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { lbl: "Data",    val: date ? new Date(date + "T12:00").toLocaleDateString("pt-BR") : "—" },
                  { lbl: "Início",  val: startTime || "—" },
                  { lbl: "Término", val: endTime   || "—" },
                ].map(({ lbl, val }) => (
                  <div key={lbl}>
                    <div className="text-[9px] font-mono tracking-[1px] uppercase" style={{ color: "#3a5a7a" }}>{lbl}</div>
                    <div className="font-mono text-sm" style={{ color: "#c8d6e5" }}>{val}</div>
                  </div>
                ))}
              </div>

              {notes && (
                <div className="font-mono text-[11px]" style={{ color: "#5a7a9a" }}>
                  <span style={{ color: "#3a5a7a" }}>Obs: </span>
                  <span style={{ color: "#c8d6e5" }}>{notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Logs recentes */}
          <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
            <div className="px-4 py-2.5" style={{ borderBottom: "1px solid #1c2a3a" }}>
              <span className="text-[11px] font-mono tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>
                Logs Recentes
              </span>
            </div>
            <div className="px-4 py-1">
              {loading ? (
                <p className="py-8 text-center text-[11px] font-mono tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>
                  Carregando...
                </p>
              ) : recentFlights.length === 0 ? (
                <p className="py-8 text-center text-[11px] font-mono tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>
                  Nenhum voo registrado
                </p>
              ) : (
                recentFlights.map((f) => {
                  const mins = f.endAt ? calcDurationMins(f.startedAt, f.endAt) : null;
                  return (
                    <div
                      key={f.id}
                      className="flex items-center gap-3 py-2.5"
                      style={{ borderBottom: "1px solid #111823" }}
                    >
                      <div className="font-mono text-[11px] min-w-[70px] shrink-0" style={{ color: "#5a7a9a" }}>
                        {formatTime(f.startedAt)}
                      </div>
                      <div className="flex-1 font-mono text-sm truncate" style={{ color: "#c8d6e5" }}>
                        {f.pilotCallsign}
                      </div>
                      <TypeBadge type={f.flightType} />
                      <div className="font-mono text-sm font-bold shrink-0" style={{ color: "#e8c97e" }}>
                        {formatMins(mins)}
                      </div>
                      <StatusBadge status={f.flightStatus} />
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Histórico completo com filtros */}
      <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
        <div className="px-4 py-2.5 flex items-center justify-between flex-wrap gap-2" style={{ borderBottom: "1px solid #1c2a3a" }}>
          <span className="text-[11px] font-mono tracking-[1.5px] uppercase shrink-0" style={{ color: "#e8c97e" }}>
            Histórico de Protocolos
          </span>
          <span className="text-[10px] font-mono" style={{ color: "#5a7a9a" }}>{filteredFlights.length} reg.</span>
        </div>
        {/* Filter bar */}
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
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="font-mono text-[12px] px-3 py-1.5 rounded outline-none"
            style={{ background: "#0a0d12", border: "1px solid #1c2a3a", color: "#c8d6e5" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#e8c97e")}
            onBlur={(e)  => (e.currentTarget.style.borderColor = "#1c2a3a")}
          >
            <option value="">Todos os tipos</option>
            {FLIGHT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
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
            <option value="REJECTED">Rejeitado</option>
          </select>
          {(filterSearch || filterType || filterStatus) && (
            <button
              onClick={() => { setFilterSearch(""); setFilterType(""); setFilterStatus(""); }}
              className="font-mono text-[10px] tracking-[1px] uppercase px-3 py-1.5 rounded"
              style={{ background: "#1c2a3a", color: "#5a7a9a" }}>
              Limpar
            </button>
          )}
        </div>
        {/* List */}
        {filteredFlights.length === 0 ? (
          <p className="py-10 text-center font-mono text-[11px] tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>
            Nenhum protocolo encontrado
          </p>
        ) : (
          <div>
            <div className="hidden md:grid gap-x-3 px-4 py-1.5 text-[9px] font-mono tracking-[1.5px] uppercase"
              style={{ gridTemplateColumns: "1.4fr 1.2fr 0.9fr 0.7fr 0.7fr 0.8fr", borderBottom: "1px solid #1c2a3a", color: "#5a7a9a" }}>
              {["Piloto", "Tipo", "Aeronave", "Início", "Duração", "Status"].map(h => <div key={h}>{h}</div>)}
            </div>
            {filteredFlights.map((f) => {
              const mins = f.endAt ? calcDurationMins(f.startedAt, f.endAt) : null;
              return (
                <div key={f.id}>
                  {/* Desktop row */}
                  <div className="hidden md:grid gap-x-3 px-4 py-2.5 items-center transition-colors"
                    style={{ gridTemplateColumns: "1.4fr 1.2fr 0.9fr 0.7fr 0.7fr 0.8fr auto", borderBottom: "1px solid #111823" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#111823")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <div>
                      <div className="font-mono text-sm font-bold leading-none" style={{ color: "#c8d6e5" }}>{f.pilotCallsign}</div>
                      <div className="font-mono text-[10px] mt-0.5" style={{ color: "#5a7a9a" }}>{f.pilotName}</div>
                    </div>
                    <TypeBadge type={f.flightType} />
                    <div className="font-mono text-[11px]" style={{ color: "#5a7a9a" }}>{AIRCRAFT_LABEL[f.aircraft] ?? f.aircraft}</div>
                    <div className="font-mono text-[11px]" style={{ color: "#5a7a9a" }}>{formatTime(f.startedAt)}</div>
                    <div className="font-mono text-sm font-bold" style={{ color: "#e8c97e" }}>{formatMins(mins)}</div>
                    <StatusBadge status={f.flightStatus} />
                    {f.flightStatus === "PENDING" && (
                      <button
                        onClick={() => setEditingFlight(f)}
                        className="font-mono text-[10px] tracking-[1px] uppercase px-2.5 py-1 rounded"
                        style={{ background: "#0a1f2a", color: "#4a90e2", border: "1px solid #4a90e244", whiteSpace: "nowrap" }}
                      >
                        Editar
                      </button>
                    )}
                  </div>
                  {/* Mobile card */}
                  <div className="md:hidden flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: "1px solid #111823" }}>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm font-bold" style={{ color: "#c8d6e5" }}>{f.pilotCallsign}</div>
                      <div className="font-mono text-[10px]" style={{ color: "#5a7a9a" }}>{f.pilotName} · {formatTime(f.startedAt)}</div>
                    </div>
                    <TypeBadge type={f.flightType} />
                    <StatusBadge status={f.flightStatus} />
                    {f.flightStatus === "PENDING" && (
                      <button
                        onClick={() => setEditingFlight(f)}
                        className="font-mono text-[10px] tracking-[1px] uppercase px-2.5 py-1 rounded"
                        style={{ background: "#0a1f2a", color: "#4a90e2", border: "1px solid #4a90e244" }}
                      >
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Aprovações pendentes — visível apenas para LEAD */}
      {isLead && pendingFlights.length > 0 && (
        <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid #1c2a3a" }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#e8c97e" }} />
            <span className="text-[11px] font-mono tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>
              Aguardando Aprovação — {pendingFlights.length}
            </span>
          </div>
          <div className="px-4 py-1">
            {pendingFlights.map((f) => {
              const mins = f.endAt ? calcDurationMins(f.startedAt, f.endAt) : null;
              const busy = reviewing === f.id;
              return (
                <div
                  key={f.id}
                  className="flex items-center gap-3 py-3 flex-wrap"
                  style={{ borderBottom: "1px solid #111823" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm font-bold" style={{ color: "#e8c97e" }}>{f.pilotCallsign}</div>
                    <div className="font-mono text-[11px]" style={{ color: "#5a7a9a" }}>
                      {f.pilotName} · {formatTime(f.startedAt)}
                    </div>
                  </div>
                  <TypeBadge type={f.flightType} />
                  <div className="font-mono text-sm font-bold" style={{ color: "#c8d6e5" }}>
                    {formatMins(mins)}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      disabled={busy}
                      onClick={() => reviewFlight(f.id, "APPROVED")}
                      className="font-mono text-[10px] tracking-[1px] uppercase px-3 py-1.5 rounded transition-opacity"
                      style={{ background: "#0a2a14", color: "#3dd68c", border: "1px solid #3dd68c44", opacity: busy ? 0.5 : 1 }}
                    >
                      Aprovar
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => reviewFlight(f.id, "REJECTED")}
                      className="font-mono text-[10px] tracking-[1px] uppercase px-3 py-1.5 rounded transition-opacity"
                      style={{ background: "#2a0a0a", color: "#e24b4a", border: "1px solid #e24b4a44", opacity: busy ? 0.5 : 1 }}
                    >
                      Rejeitar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
