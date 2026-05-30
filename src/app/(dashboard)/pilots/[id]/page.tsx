"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Pilot, FlightLog, PerformanceReport, Rank } from "@/types";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

// ── Helpers ───────────────────────────────────────────────────────────────

const RANK_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  LEAD:           { bg: "#2a1f0a", color: "#e8c97e", border: "#e8c97e44" },
  SUPERVISOR:     { bg: "#2a1f0a", color: "#e8c97e", border: "#e8c97e44" },
  INSTRUCTOR:     { bg: "#2a1f0a", color: "#e8c97e", border: "#e8c97e44" },
  PILOT_SENIOR:   { bg: "#0a1f2a", color: "#4a90e2", border: "#4a90e244" },
  PILOT_PLENO:    { bg: "#0a2a14", color: "#3dd68c", border: "#3dd68c44" },
  PILOT_STANDARD: { bg: "#0a2a14", color: "#3dd68c", border: "#3dd68c44" },
  TRAINEE:        { bg: "#1a1c2a", color: "#8a9ab8", border: "#4a5a7a44" },
};
const getRankStyle = (r: string) => RANK_STYLES[r] ?? RANK_STYLES.TRAINEE;

const RANK_COLOR: Record<string, string> = {
  LEAD: "#e8c97e", SUPERVISOR: "#e8c97e", INSTRUCTOR: "#e8c97e",
  PILOT_SENIOR: "#4a90e2", PILOT_PLENO: "#3dd68c", PILOT_STANDARD: "#3dd68c", TRAINEE: "#8a9ab8",
};

const HIGH_RANKS = new Set(["LEAD", "SUPERVISOR", "INSTRUCTOR", "PILOT_SENIOR"]);

const SCORE_TIERS = [
  { rank: "PILOT_SENIOR",   min: 1000, max: 1400 },
  { rank: "PILOT_PLENO",    min: 600,  max: 1000 },
  { rank: "PILOT_STANDARD", min: 200,  max: 600  },
  { rank: "TRAINEE",        min: 0,    max: 200  },
];

const FLIGHT_TYPE_LABELS: Record<string, string> = {
  PATRULHA: "Patrulha", PATROL: "Pers. 10-80", PURSUIT_10_94: "Perseguição",
  BANK_FLEECA_10_90: "Banco Fleeca", PALETO_BANK: "Banco Paleto",
  BANK_68_10_90: "Banco 68", BOOSTING_S: "Boost. 10-80",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente", APPROVED: "Aprovado", REJECTED: "Rejeitado",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function formatDuration(start: string, end: string | null) {
  if (!end) return "—";
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (mins <= 0) return "—";
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m}min`;
}

function StatusDot({ status }: { status: string }) {
  const c = status === "APPROVED" ? "#3dd68c" : status === "REJECTED" ? "#e24b4a" : "#e8c97e";
  return (
    <span className="text-[9px] font-mono tracking-[1px] uppercase px-2 py-0.5 rounded whitespace-nowrap"
      style={{ background: c + "18", color: c, border: `1px solid ${c}44` }}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ── Edit profile modal ────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: "#0a0d12", border: "1px solid #1c2a3a",
  borderRadius: "6px", padding: "8px 12px",
  color: "#c8d6e5", fontFamily: "monospace", fontSize: "13px", width: "100%", outline: "none",
};

function EditModal({
  pilot,
  onConfirm,
  onClose,
  saving,
  showStatus = true,
}: {
  pilot: Pilot;
  onConfirm: (data: { callsign: string; profileImageUrl: string; status: string }) => void;
  onClose: () => void;
  saving: boolean;
  showStatus?: boolean;
}) {
  const [callsign,        setCallsign]        = useState<string>(pilot.callsign);
  const [profileImageUrl, setProfileImageUrl] = useState<string>(pilot.profileImageUrl ?? "");
  const [status,          setStatus]          = useState<string>(pilot.status);

  function focusBorder(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    e.currentTarget.style.borderColor = "#e8c97e";
  }
  function blurBorder(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    e.currentTarget.style.borderColor = "#1c2a3a";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-lg overflow-hidden"
        style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #1c2a3a" }}>
          <span className="font-mono text-[11px] tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>
            Editar Perfil
          </span>
          <button onClick={onClose} className="font-mono text-lg leading-none" style={{ color: "#5a7a9a" }}>×</button>
        </div>
        <div className="p-4 space-y-3">
          <div className="space-y-1">
            <label className="block font-mono text-[10px] tracking-[1.5px] uppercase" style={{ color: "#c8d6e5" }}>Callsign</label>
            <input type="text" value={callsign} onChange={(e) => setCallsign(e.target.value)}
              style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
          </div>
          {showStatus && (
            <div className="space-y-1">
              <label className="block font-mono text-[10px] tracking-[1.5px] uppercase" style={{ color: "#c8d6e5" }}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }} onFocus={focusBorder} onBlur={blurBorder}>
                <option value="ACTIVE">Ativo</option>
                <option value="INACTIVE">Inativo</option>
                <option value="SUSPENDED">Suspenso</option>
                <option value="TRAINING">Treinamento</option>
              </select>
            </div>
          )}
          <div className="space-y-1">
            <label className="block font-mono text-[10px] tracking-[1.5px] uppercase" style={{ color: "#c8d6e5" }}>
              URL da foto (opcional)
            </label>
            <input type="url" value={profileImageUrl} onChange={(e) => setProfileImageUrl(e.target.value)}
              placeholder="https://..." style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 font-mono text-[11px] tracking-[1px] uppercase py-2 rounded"
              style={{ background: "#1c2a3a", color: "#5a7a9a" }}>
              Cancelar
            </button>
            <button disabled={saving || !callsign}
              onClick={() => onConfirm({ callsign, profileImageUrl, status })}
              className="flex-1 font-mono text-[11px] tracking-[1px] uppercase py-2 rounded"
              style={{ background: "#e8c97e", color: "#0a0d12", opacity: (saving || !callsign) ? 0.6 : 1 }}>
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Rank change modal ─────────────────────────────────────────────────────

function RankModal({
  currentRankName,
  ranks,
  onConfirm,
  onClose,
  saving,
}: {
  currentRankName: string;
  ranks: Rank[];
  onConfirm: (rankId: string) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [selected, setSelected] = useState(
    ranks.find((r) => r.name === currentRankName)?.id ?? ""
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #1c2a3a" }}>
          <span className="font-mono text-[11px] tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>
            Alterar Rank
          </span>
          <button onClick={onClose} className="font-mono text-lg leading-none" style={{ color: "#5a7a9a" }}>×</button>
        </div>
        <div className="p-4 space-y-3">
          <div className="space-y-2">
            {ranks.map((r) => {
              const style = getRankStyle(r.name);
              const active = selected === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelected(r.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-left transition-colors"
                  style={{
                    background: active ? "#1c2a3a" : "transparent",
                    border: `1px solid ${active ? "#e8c97e44" : "#1c2a3a"}`,
                  }}
                >
                  <span className="text-[9px] font-mono tracking-[1px] uppercase px-2 py-0.5 rounded"
                    style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}`, minWidth: 90 }}>
                    {r.name}
                  </span>
                  <span className="font-mono text-[10px]" style={{ color: "#5a7a9a" }}>{r.description}</span>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 font-mono text-[11px] tracking-[1px] uppercase py-2 rounded"
              style={{ background: "#1c2a3a", color: "#5a7a9a" }}>
              Cancelar
            </button>
            <button
              disabled={saving || !selected || selected === ranks.find(r => r.name === currentRankName)?.id}
              onClick={() => onConfirm(selected)}
              className="flex-1 font-mono text-[11px] tracking-[1px] uppercase py-2 rounded"
              style={{ background: "#e8c97e", color: "#0a0d12", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Salvando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Score bar ─────────────────────────────────────────────────────────────

function ScoreBar({ rankName, score }: { rankName: string; score: number }) {
  const isHigh = HIGH_RANKS.has(rankName);
  const tier   = SCORE_TIERS.find((t) => t.rank === rankName) ?? SCORE_TIERS[SCORE_TIERS.length - 1];
  const pct    = isHigh ? 100 : Math.min(Math.max(((score - tier.min) / (tier.max - tier.min)) * 100, 0), 100);
  const color  = RANK_COLOR[rankName] ?? "#8a9ab8";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-mono" style={{ color }}>
        <span className="uppercase tracking-[1.5px]">{rankName}</span>
        <span>{score} pts</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "#1c2a3a" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #e8c97e, #f5a623)", transition: "width 0.5s" }} />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────

export default function PilotProfilePage() {
  const { id }        = useParams<{ id: string }>();
  const { user }      = useAuth();
  const router        = useRouter();

  const [pilot,    setPilot]    = useState<Pilot | null>(null);
  const [flights,  setFlights]  = useState<FlightLog[]>([]);
  const [reports,  setReports]  = useState<PerformanceReport[]>([]);
  const [ranks,    setRanks]    = useState<Rank[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showModal,      setShowModal]      = useState(false);
  const [showEdit,       setShowEdit]       = useState(false);
  const [showOwnEdit,    setShowOwnEdit]    = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState(false);
  const [saving,         setSaving]         = useState(false);

  const canManage    = user?.role === "LEAD" || user?.role === "SUPERVISOR" || user?.role === "ADM";
  const canDelete    = user?.role === "LEAD" || user?.role === "ADM";
  const isOwnProfile = !!pilot && user?.id === pilot.userId;

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get<Pilot>(`/pilots/${id}`),
      api.get<FlightLog[]>("/flights"),
      api.get<PerformanceReport[]>("/reports"),
      api.get<Rank[]>("/ranks", 300),
    ]).then(([p, fl, rep, rk]) => {
      setPilot(p);
      setFlights(fl.filter((f) => f.pilotCallsign === p.callsign)
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()));
      setReports(rep.filter((r) => r.pilotCallsign === p.callsign)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setRanks(rk);
    }).finally(() => setLoading(false));
  }, [id]);

  async function changeRank(rankId: string) {
    if (!pilot) return;
    setSaving(true);
    try {
      const updated = await api.patch<Pilot>(`/pilots/${pilot.id}/rank`, { rankId });
      setPilot(updated);
      setShowModal(false);
    } catch { /* silently ignore */ }
    finally { setSaving(false); }
  }

  async function saveEdit(data: { callsign: string; profileImageUrl: string; status: string }) {
    if (!pilot) return;
    setSaving(true);
    try {
      const updated = await api.put<Pilot>(`/pilots/${pilot.id}`, {
        callsign:        data.callsign,
        profileImageUrl: data.profileImageUrl || null,
        status:          data.status,
      });
      setPilot(updated);
      setShowEdit(false);
    } catch { /* silently ignore */ }
    finally { setSaving(false); }
  }

  async function saveOwnProfile(data: { callsign: string; profileImageUrl: string; status: string }) {
    if (!pilot) return;
    setSaving(true);
    try {
      const updated = await api.patch<Pilot>(`/pilots/${pilot.id}/profile`, {
        callsign:        data.callsign,
        profileImageUrl: data.profileImageUrl || null,
      });
      setPilot(updated);
      setShowOwnEdit(false);
    } catch { /* silently ignore */ }
    finally { setSaving(false); }
  }

  async function deletePilot() {
    if (!pilot) return;
    try {
      await api.delete(`/pilots/${pilot.id}`);
      router.push("/pilots");
    } catch { /* silently ignore */ }
    finally { setConfirmDelete(false); }
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ background: "#0a0d12" }}>
        <span className="font-mono text-[11px] tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>Carregando...</span>
      </div>
    );
  }

  if (!pilot) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-3" style={{ background: "#0a0d12" }}>
        <span className="font-mono text-[11px] tracking-[2px] uppercase" style={{ color: "#e24b4a" }}>Piloto não encontrado</span>
        <button onClick={() => router.back()} className="font-mono text-[10px] tracking-[1px] uppercase px-4 py-2 rounded" style={{ background: "#1c2a3a", color: "#5a7a9a" }}>
          Voltar
        </button>
      </div>
    );
  }

  const rankStyle    = getRankStyle(pilot.rankName);
  const callsignColor = RANK_COLOR[pilot.rankName] ?? "#c8d6e5";
  const initials     = pilot.callsign.slice(0, 2).toUpperCase();
  const flightHrs    = Math.floor(pilot.flightMinutes / 60);
  const flightMins   = pilot.flightMinutes % 60;

  return (
    <div className="p-3 md:p-6 space-y-4 min-h-full" style={{ background: "#0a0d12" }}>

      {showModal && (
        <RankModal
          currentRankName={pilot.rankName}
          ranks={ranks}
          onConfirm={changeRank}
          onClose={() => setShowModal(false)}
          saving={saving}
        />
      )}

      {showEdit && (
        <EditModal
          pilot={pilot}
          onConfirm={saveEdit}
          onClose={() => setShowEdit(false)}
          saving={saving}
        />
      )}

      {showOwnEdit && (
        <EditModal
          pilot={pilot}
          onConfirm={saveOwnProfile}
          onClose={() => setShowOwnEdit(false)}
          saving={saving}
          showStatus={false}
        />
      )}

      <ConfirmModal
        open={confirmDelete}
        title="Remover Piloto"
        description={`O piloto ${pilot.callsign} e todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.`}
        confirmLabel="Remover"
        onConfirm={deletePilot}
        onCancel={() => setConfirmDelete(false)}
      />

      {/* Back */}
      <button onClick={() => router.back()}
        className="font-mono text-[10px] tracking-[1.5px] uppercase flex items-center gap-1.5"
        style={{ color: "#5a7a9a" }}>
        ← Roster
      </button>

      {/* Hero card */}
      <div className="rounded-lg p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center"
        style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>

        {/* Avatar */}
        {pilot.profileImageUrl ? (
          <img src={pilot.profileImageUrl} alt={pilot.callsign}
            className="rounded-full object-cover shrink-0"
            style={{ width: 80, height: 80, border: `2px solid ${callsignColor}44` }} />
        ) : (
          <div className="rounded-full flex items-center justify-center font-mono font-bold text-2xl shrink-0"
            style={{ width: 80, height: 80, background: "#1c2a3a", color: "#e8c97e", border: `2px solid #e8c97e22` }}>
            {initials}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <div className="font-mono text-2xl font-bold leading-none" style={{ color: callsignColor }}>
              {pilot.callsign}
            </div>
            <div className="font-mono text-sm mt-0.5" style={{ color: "#c8d6e5" }}>{pilot.fullName}</div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[9px] font-mono tracking-[1px] uppercase px-2 py-1 rounded"
              style={{ background: rankStyle.bg, color: rankStyle.color, border: `1px solid ${rankStyle.border}` }}>
              {pilot.rankName}
            </span>
            <span className="text-[9px] font-mono tracking-[1px] uppercase px-2 py-1 rounded"
              style={pilot.status === "ACTIVE"
                ? { background: "#0a2a14", color: "#3dd68c", border: "1px solid #3dd68c44" }
                : { background: "#1a1c2a", color: "#8a9ab8", border: "1px solid #4a5a7a44" }}>
              {pilot.status}
            </span>
          </div>
          <div className="w-full max-w-xs">
            <ScoreBar rankName={pilot.rankName} score={pilot.accumulatedScore} />
          </div>
        </div>

        {/* Stats + actions */}
        <div className="flex flex-col gap-3 shrink-0 min-w-[120px]">
          <div className="space-y-1 text-right">
            <div className="font-mono text-[10px] tracking-[1px] uppercase" style={{ color: "#5a7a9a" }}>Horas de Voo</div>
            <div className="font-mono text-xl font-bold" style={{ color: "#4a90e2" }}>
              {flightHrs}h{String(flightMins).padStart(2, "0")}
            </div>
          </div>
          <div className="space-y-1 text-right">
            <div className="font-mono text-[10px] tracking-[1px] uppercase" style={{ color: "#5a7a9a" }}>Voos</div>
            <div className="font-mono text-xl font-bold" style={{ color: "#3dd68c" }}>{flights.length}</div>
          </div>
          {isOwnProfile && !canManage && (
            <button onClick={() => setShowOwnEdit(true)}
              className="font-mono text-[10px] tracking-[1px] uppercase px-3 py-2 rounded mt-1"
              style={{ background: "#1c2a3a", color: "#4a90e2", border: "1px solid #4a90e233" }}>
              Editar Meu Perfil
            </button>
          )}

          {canManage && (
            <>
              <button onClick={() => setShowModal(true)}
                className="font-mono text-[10px] tracking-[1px] uppercase px-3 py-2 rounded mt-1"
                style={{ background: "#1c2a3a", color: "#e8c97e", border: "1px solid #e8c97e33" }}>
                Alterar Rank
              </button>
              <button onClick={() => setShowEdit(true)}
                className="font-mono text-[10px] tracking-[1px] uppercase px-3 py-2 rounded"
                style={{ background: "#1c2a3a", color: "#4a90e2", border: "1px solid #4a90e233" }}>
                Editar Perfil
              </button>
              {canDelete && (
                <button onClick={() => setConfirmDelete(true)}
                  className="font-mono text-[10px] tracking-[1px] uppercase px-3 py-2 rounded"
                  style={{ background: "#1a0a0a", color: "#e24b4a", border: "1px solid #e24b4a33" }}>
                  Remover Piloto
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Two columns: flights + reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Voos */}
        <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
          <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: "1px solid #1c2a3a" }}>
            <span className="font-mono text-[11px] tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>Histórico de Voos</span>
            <span className="font-mono text-[10px]" style={{ color: "#5a7a9a" }}>{flights.length} reg.</span>
          </div>
          {flights.length === 0 ? (
            <p className="py-10 text-center font-mono text-[11px] tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>Nenhum voo registrado</p>
          ) : (
            <div>
              <div className="grid gap-x-3 px-4 py-1.5 text-[9px] font-mono tracking-[1.5px] uppercase"
                style={{ gridTemplateColumns: "0.9fr 1.2fr 0.7fr 0.6fr", borderBottom: "1px solid #1c2a3a", color: "#8a9ab8" }}>
                {["Data", "Tipo", "Aeronave", "Status"].map(h => <div key={h}>{h}</div>)}
              </div>
              {flights.slice(0, 10).map((f) => (
                <div key={f.id} className="grid gap-x-3 px-4 py-2.5 items-center"
                  style={{ gridTemplateColumns: "0.9fr 1.2fr 0.7fr 0.6fr", borderBottom: "1px solid #111823" }}>
                  <div className="font-mono text-[11px]" style={{ color: "#5a7a9a" }}>
                    {formatDate(f.startedAt)}<br />
                    <span style={{ color: "#5a7a9a" }}>{formatDuration(f.startedAt, f.endAt)}</span>
                  </div>
                  <div className="font-mono text-[11px]" style={{ color: "#c8d6e5" }}>
                    {FLIGHT_TYPE_LABELS[f.flightType] ?? f.flightType}
                  </div>
                  <div className="font-mono text-[11px]" style={{ color: "#5a7a9a" }}>{f.aircraft}</div>
                  <StatusDot status={f.flightStatus} />
                </div>
              ))}
              {flights.length > 10 && (
                <div className="px-4 py-2 text-center font-mono text-[10px]" style={{ color: "#5a7a9a" }}>
                  +{flights.length - 10} voos anteriores
                </div>
              )}
            </div>
          )}
        </div>

        {/* Relatórios */}
        <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
          <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: "1px solid #1c2a3a" }}>
            <span className="font-mono text-[11px] tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>Relatórios</span>
            <span className="font-mono text-[10px]" style={{ color: "#5a7a9a" }}>{reports.length} reg.</span>
          </div>
          {reports.length === 0 ? (
            <p className="py-10 text-center font-mono text-[11px] tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>Nenhum relatório registrado</p>
          ) : (
            <div>
              <div className="grid gap-x-3 px-4 py-1.5 text-[9px] font-mono tracking-[1.5px] uppercase"
                style={{ gridTemplateColumns: "0.8fr 0.5fr 0.5fr 0.5fr 0.5fr 0.7fr 0.7fr", borderBottom: "1px solid #1c2a3a", color: "#8a9ab8" }}>
                {["Data", "Aprs", "Pers", "Ops", "Acid", "Score", "Status"].map(h => <div key={h}>{h}</div>)}
              </div>
              {reports.slice(0, 10).map((r) => (
                <div key={r.id} className="grid gap-x-3 px-4 py-2.5 items-center"
                  style={{ gridTemplateColumns: "0.8fr 0.5fr 0.5fr 0.5fr 0.5fr 0.7fr 0.7fr", borderBottom: "1px solid #111823" }}>
                  <div className="font-mono text-[11px]" style={{ color: "#5a7a9a" }}>{formatDate(r.createdAt)}</div>
                  <div className="font-mono text-sm font-bold" style={{ color: "#c8d6e5" }}>{r.seizures}</div>
                  <div className="font-mono text-sm font-bold" style={{ color: "#4a90e2" }}>{r.chases}</div>
                  <div className="font-mono text-sm font-bold" style={{ color: "#3dd68c" }}>{r.operations}</div>
                  <div className="font-mono text-sm font-bold" style={{ color: "#e24b4a" }}>{r.accidents}</div>
                  <div className="font-mono text-sm font-bold" style={{ color: "#e8c97e" }}>{r.score}</div>
                  <StatusDot status={r.status} />
                </div>
              ))}
              {reports.length > 10 && (
                <div className="px-4 py-2 text-center font-mono text-[10px]" style={{ color: "#5a7a9a" }}>
                  +{reports.length - 10} relatórios anteriores
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
