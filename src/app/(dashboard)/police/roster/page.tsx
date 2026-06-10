"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { Officer, PoliceRank, PoliceUnit, OfficerStatus } from "@/types";
import { tierForRank, badgeValidForRank } from "@/lib/police/badges";

// ── Ranks ──────────────────────────────────────────────────────────────────

const RANK_ORDER: Record<PoliceRank, number> = {
  CADET:           1,
  SOLO_CADET:      2,
  OFFICER:         3,
  OFFICER_1:       4,
  OFFICER_2:       5,
  OFFICER_3:       6,
  SENIOR_OFFICER:  7,
  CORPORAL:        8,
  SERGEANT:        9,
  LIEUTENANT:      10,
  CAPTAIN:         11,
  ASSISTANT_CHIEF: 12,
  CHIEF:           13,
  COMMISSIONER:    14,
};

const SERGEANT_LEVEL = 9; // mínimo para ter permissão de editar

const RANK_LABEL: Record<PoliceRank, string> = {
  CADET:           "Cadet",
  SOLO_CADET:      "Solo Cadet",
  OFFICER:         "Officer",
  OFFICER_1:       "Officer I",
  OFFICER_2:       "Officer II",
  OFFICER_3:       "Officer III",
  SENIOR_OFFICER:  "Senior Officer",
  CORPORAL:        "Corporal",
  SERGEANT:        "Sergeant",
  LIEUTENANT:      "Lieutenant",
  CAPTAIN:         "Captain",
  ASSISTANT_CHIEF: "Asst. Chief",
  CHIEF:           "Chief",
  COMMISSIONER:    "Commissioner",
};

type RankStyle = { bg: string; color: string; border: string };

function getRankStyle(rank: PoliceRank): RankStyle {
  const level = RANK_ORDER[rank] ?? 1;
  if (level >= 13) return { bg: "#1a1020", color: "#c084fc", border: "#c084fc44" };
  if (level >= 11) return { bg: "#2a1f0a", color: "#e8c97e", border: "#e8c97e44" };
  if (level >= 9)  return { bg: "#0a1f2a", color: "#4a90e2", border: "#4a90e244" };
  if (level >= 7)  return { bg: "#0a2a14", color: "#3dd68c", border: "#3dd68c44" };
  if (level >= 3)  return { bg: "#0a1a2a", color: "#5a8ab8", border: "#5a8ab844" };
  return             { bg: "#1a1c2a", color: "#8a9ab8", border: "#4a5a7a44" };
}

// ── Units ──────────────────────────────────────────────────────────────────

const ALL_UNITS: PoliceUnit[] = ["CID", "HEAT", "ASD", "METRO", "MU", "FTO"];

const UNIT_STYLES: Record<PoliceUnit, { bg: string; color: string; border: string }> = {
  CID:   { bg: "#2a1010", color: "#e24b4a", border: "#e24b4a44" },
  HEAT:  { bg: "#1a1020", color: "#c084fc", border: "#c084fc44" },
  ASD:   { bg: "#0a1f2a", color: "#4a90e2", border: "#4a90e244" },
  METRO: { bg: "#2a1f0a", color: "#e8c97e", border: "#e8c97e44" },
  MU:    { bg: "#0a2a14", color: "#3dd68c", border: "#3dd68c44" },
  FTO:   { bg: "#1a1a0a", color: "#f97316", border: "#f9731644" },
};

// ── Status ─────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<OfficerStatus, { label: string; color: string }> = {
  ACTIVE:    { label: "Ativo",       color: "#3dd68c" },
  INACTIVE:  { label: "Inativo",     color: "#5a7a9a" },
  SUSPENDED: { label: "Suspenso",    color: "#e24b4a" },
  TRAINING:  { label: "Treinamento", color: "#e8c97e" },
};

// ── Helpers ────────────────────────────────────────────────────────────────

function getInitials(callsign: string | null | undefined) {
  if (!callsign) return "??";
  return callsign.split(/[.\s_-]/).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 2);
}

function Avatar({ officer }: { officer: Officer }) {
  const rs = getRankStyle(officer.rank);
  if (officer.profileImageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={officer.profileImageUrl} alt={officer.callsign} className="rounded-full object-cover shrink-0" style={{ width: 32, height: 32 }} />;
  }
  return (
    <div className="rounded-full flex items-center justify-center font-mono font-bold shrink-0"
      style={{ width: 32, height: 32, background: rs.bg, color: rs.color, fontSize: 11, border: `1px solid ${rs.border}` }}>
      {getInitials(officer.callsign)}
    </div>
  );
}

// ── Edit Modal ─────────────────────────────────────────────────────────────

function EditOfficerModal({
  officer,
  editorLevel,
  onClose,
  onSaved,
}: {
  officer: Officer;
  editorLevel: number;
  onClose: () => void;
  onSaved: (updated: Officer) => void;
}) {
  const [rank,        setRank]        = useState<PoliceRank>(officer.rank);
  const [unit,        setUnit]        = useState<PoliceUnit | "">((officer.unitNames && officer.unitNames.length === 1) ? officer.unitNames[0] as PoliceUnit : "");
  const [status,      setStatus]      = useState<OfficerStatus>(officer.status);
  const [badgeInput,  setBadgeInput]  = useState<string>(officer.badgeNumber != null ? String(officer.badgeNumber) : "");
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const tier       = tierForRank(rank);
  const badgeNum   = badgeInput.trim() !== "" ? Number(badgeInput) : null;
  const badgeError = badgeNum != null && (!Number.isInteger(badgeNum) || !badgeValidForRank(badgeNum, rank))
    ? `Badge deve estar entre ${tier?.min ?? "?"} e ${tier?.max ?? "?"} para ${rank}`
    : null;

  // Ranks disponíveis: apenas os estritamente abaixo do editor
  const availableRanks = (Object.entries(RANK_ORDER) as [PoliceRank, number][])
    .filter(([, level]) => level < editorLevel)
    .sort(([, a], [, b]) => b - a);

  async function handleSave() {
    if (badgeError) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.patch<Officer>(`/officers/${officer.id}`, {
        rank, units: unit ? [unit] : [], status,
        badgeNumber: badgeNum,
      });
      onSaved(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  const inputBase: React.CSSProperties = {
    background: "#0a0d12", border: "1px solid #1c2a3a",
    color: "#c8d6e5", fontFamily: "monospace", fontSize: 12,
    borderRadius: 6, padding: "7px 10px", outline: "none", width: "100%",
  };

  const rs = getRankStyle(rank);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>

        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #1c2a3a" }}>
          <div>
            <div className="text-[11px] font-mono tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>Editar Oficial</div>
            <div className="font-mono text-sm font-bold mt-0.5" style={{ color: rs.color }}>{officer.callsign}</div>
            <div className="font-mono text-[11px]" style={{ color: "#5a7a9a" }}>{officer.fullName}</div>
          </div>
          <button onClick={onClose} className="font-mono text-lg px-1" style={{ color: "#5a7a9a" }}>✕</button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">

          {/* Patente */}
          <div>
            <label className="block text-[10px] font-mono tracking-[1px] uppercase mb-1" style={{ color: "#5a7a9a" }}>Patente</label>
            <select
              value={rank}
              onChange={(e) => setRank(e.target.value as PoliceRank)}
              style={inputBase}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#e8c97e")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = "#1c2a3a")}
            >
              {availableRanks.map(([value, ]) => (
                <option key={value} value={value}>{RANK_LABEL[value]}</option>
              ))}
            </select>
          </div>

          {/* Unidade */}
          <div>
            <label className="block text-[10px] font-mono tracking-[1px] uppercase mb-1" style={{ color: "#5a7a9a" }}>Unidade</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as PoliceUnit)}
              style={inputBase}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#e8c97e")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = "#1c2a3a")}
            >
              {ALL_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] font-mono tracking-[1px] uppercase mb-1" style={{ color: "#5a7a9a" }}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OfficerStatus)}
              style={inputBase}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#e8c97e")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = "#1c2a3a")}
            >
              {(Object.entries(STATUS_STYLES) as [OfficerStatus, { label: string }][]).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Badge number */}
          <div>
            <label className="block text-[10px] font-mono tracking-[1px] uppercase mb-1" style={{ color: "#5a7a9a" }}>
              Número do Badge
              {tier && (
                <span className="ml-2 normal-case tracking-normal" style={{ color: "#3a4a5a" }}>
                  (range válido: {tier.min}–{tier.max})
                </span>
              )}
            </label>
            <input
              type="number"
              value={badgeInput}
              onChange={(e) => { setBadgeInput(e.target.value); setError(null); }}
              placeholder={tier ? `${tier.min}–${tier.max}` : "—"}
              min={tier?.min}
              max={tier?.max}
              style={inputBase}
              onFocus={(e) => (e.currentTarget.style.borderColor = badgeError ? "#e24b4a" : "#e8c97e")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = badgeError ? "#e24b4a" : "#1c2a3a")}
            />
            {badgeError && (
              <p className="text-[10px] font-mono mt-1" style={{ color: "#e24b4a" }}>{badgeError}</p>
            )}
          </div>

          {/* Preview do badge */}
          <div className="flex items-center gap-2 flex-wrap px-3 py-2 rounded" style={{ background: "#0a0d12", border: "1px solid #1c2a3a" }}>
            <span className="text-[9px] font-mono tracking-[1px] uppercase" style={{ color: "#5a7a9a" }}>Preview:</span>
            {badgeNum != null && !badgeError && (
              <span className="font-mono text-sm font-bold px-2 py-0.5 rounded"
                style={{ background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>
                #{badgeNum}
              </span>
            )}
            <span className="text-[9px] font-mono tracking-[1px] uppercase px-2 py-0.5 rounded"
              style={{ background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>
              {RANK_LABEL[rank]}
            </span>
            {unit && (
              <span className="text-[9px] font-mono tracking-[1px] uppercase px-2 py-0.5 rounded"
                style={{ background: UNIT_STYLES[unit as PoliceUnit].bg, color: UNIT_STYLES[unit as PoliceUnit].color, border: `1px solid ${UNIT_STYLES[unit as PoliceUnit].border}` }}>
                {unit}
              </span>
            )}
          </div>

          {error && <p className="text-[11px] font-mono" style={{ color: "#e24b4a" }}>{error}</p>}

          <div className="flex gap-2 justify-end">
            <button onClick={onClose}
              className="font-mono text-[12px] tracking-[1px] uppercase px-4 py-2 rounded"
              style={{ background: "#1c2a3a", color: "#5a7a9a" }}>
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving || !!badgeError}
              className="font-mono text-[12px] tracking-[1px] uppercase px-5 py-2 rounded font-semibold"
              style={{ background: "#e8c97e", color: "#0a0d12", opacity: saving || !!badgeError ? 0.6 : 1 }}>
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

const RANK_OPTIONS = (Object.entries(RANK_ORDER) as [PoliceRank, number][])
  .sort(([, a], [, b]) => b - a);

export default function PoliceRosterPage() {
  const router = useRouter();
  const [officers,    setOfficers]    = useState<Officer[]>([]);
  const [myOfficer,   setMyOfficer]   = useState<Officer | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [filterUnit,  setFilterUnit]  = useState<PoliceUnit | "">("");
  const [filterRank,  setFilterRank]  = useState<PoliceRank | "">("");
  const [editing,     setEditing]     = useState<Officer | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<Officer[]>("/officers", 60).catch(() => [] as Officer[]),
      api.get<Officer>("/officers/me", 60).catch(() => null),
    ]).then(([list, me]) => {
      setOfficers(list);
      setMyOfficer(me);
    }).finally(() => setLoading(false));
  }, []);

  const myLevel = myOfficer ? (RANK_ORDER[myOfficer.rank] ?? 0) : 0;
  const canEdit = myLevel >= SERGEANT_LEVEL;

  function canEditOfficer(o: Officer) {
    if (!canEdit) return false;
    if (o.id === myOfficer?.id) return false; // não edita a si mesmo
    return RANK_ORDER[o.rank] < myLevel;
  }

  const sorted = [...officers].sort((a, b) => {
    const aBadge = a.badgeNumber;
    const bBadge = b.badgeNumber;
    // ambos com badge: menor número primeiro (100 = Commissioner)
    if (aBadge != null && bBadge != null) return aBadge - bBadge;
    // só um tem badge: quem tem badge vem primeiro
    if (aBadge != null) return -1;
    if (bBadge != null) return 1;
    // nenhum tem badge: fallback por rank desc, depois callsign
    const rankDiff = RANK_ORDER[b.rank] - RANK_ORDER[a.rank];
    return rankDiff !== 0 ? rankDiff : a.callsign.localeCompare(b.callsign);
  });

  const filtered = sorted.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.callsign.toLowerCase().includes(q) || o.fullName.toLowerCase().includes(q);
    const matchUnit   = !filterUnit || (o.unitNames ?? []).includes(filterUnit);
    const matchRank   = !filterRank || o.rank === filterRank;
    return matchSearch && matchUnit && matchRank;
  });

  const inputBase: React.CSSProperties = {
    background: "#0d1117", border: "1px solid #1c2a3a",
    color: "#c8d6e5", fontFamily: "monospace", fontSize: 12,
    borderRadius: 6, padding: "6px 10px", outline: "none",
  };

  return (
    <div className="p-3 md:p-6 space-y-4 min-h-full" style={{ background: "#0a0d12" }}>

      {editing && myOfficer && (
        <EditOfficerModal
          officer={editing}
          editorLevel={myLevel}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setOfficers((prev) => prev.map((o) => o.id === updated.id ? updated : o));
            setEditing(null);
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-start md:items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono tracking-[3px] uppercase mb-1" style={{ color: "#5a7a9a" }}>
            Los Santos Police Department · Pessoal
          </p>
          <h1 className="text-lg md:text-2xl font-mono font-bold tracking-wide md:tracking-widest uppercase" style={{ color: "#e8c97e" }}>
            Roster
          </h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {myOfficer && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono tracking-[1px] uppercase px-2 py-0.5 rounded"
                style={{ ...getRankStyle(myOfficer.rank), background: getRankStyle(myOfficer.rank).bg, border: `1px solid ${getRankStyle(myOfficer.rank).border}` }}>
                {RANK_LABEL[myOfficer.rank]}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#3dd68c" }} />
            <span className="text-[10px] font-mono tracking-[2px] uppercase" style={{ color: "#3dd68c" }}>
              {loading ? "—" : `${officers.length} oficiais`}
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Buscar por callsign ou nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] max-w-sm"
          style={inputBase}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#e8c97e")}
          onBlur={(e)  => (e.currentTarget.style.borderColor = "#1c2a3a")}
        />
        <select value={filterUnit} onChange={(e) => setFilterUnit(e.target.value as PoliceUnit | "")}
          style={inputBase}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#e8c97e")}
          onBlur={(e)  => (e.currentTarget.style.borderColor = "#1c2a3a")}
        >
          <option value="">Todas as unidades</option>
          {ALL_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <select value={filterRank} onChange={(e) => setFilterRank(e.target.value as PoliceRank | "")}
          style={inputBase}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#e8c97e")}
          onBlur={(e)  => (e.currentTarget.style.borderColor = "#1c2a3a")}
        >
          <option value="">Todas as patentes</option>
          {RANK_OPTIONS.map(([value]) => <option key={value} value={value}>{RANK_LABEL[value]}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>

        <div className="hidden md:grid px-4 py-2 text-[9px] font-mono tracking-[1.5px] uppercase"
          style={{
            color: "#8a9ab8", borderBottom: "1px solid #1c2a3a",
            gridTemplateColumns: canEdit ? "40px 56px 1.4fr 1.2fr 0.8fr 0.9fr 48px" : "40px 56px 1.4fr 1.2fr 0.8fr 0.9fr",
            gap: "12px",
          }}>
          <div /><div>Badge</div><div>Nome</div><div>Patente</div><div>Unidade</div><div>Status</div>
          {canEdit && <div />}
        </div>

        {loading ? (
          <SkeletonRows rows={8} className="h-14" />
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-[11px] font-mono tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>
            Nenhum oficial encontrado
          </div>
        ) : (
          filtered.map((o, i) => {
            const rs     = getRankStyle(o.rank);
            const primaryUnit = (o.unitNames && o.unitNames.length > 0) ? o.unitNames[0] as PoliceUnit : null;
            const us     = primaryUnit ? UNIT_STYLES[primaryUnit] : null;
            const ss     = STATUS_STYLES[o.status] ?? { label: o.status, color: "#5a7a9a" };
            const isLast = i === filtered.length - 1;
            const editable = canEditOfficer(o);

            return (
              <div key={o.id} style={{ borderBottom: isLast ? "none" : "1px solid #111823", cursor: "pointer" }}
                onClick={() => router.push(`/police/roster/${o.id}`)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#111823")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Desktop */}
                <div className="hidden md:grid px-4 py-3 items-center"
                  style={{
                    gridTemplateColumns: canEdit ? "40px 56px 1.4fr 1.2fr 0.8fr 0.9fr 48px" : "40px 56px 1.4fr 1.2fr 0.8fr 0.9fr",
                    gap: "12px",
                  }}>
                  <Avatar officer={o} />
                  <div className="font-mono text-sm font-bold" style={{ color: rs.color }}>
                    {o.badgeNumber != null ? `#${o.badgeNumber}` : <span style={{ color: "#3a4a5a" }}>—</span>}
                  </div>
                  <div className="font-mono text-sm truncate" style={{ color: "#c8d6e5" }}>{o.fullName}</div>
                  <div>
                    <span className="text-[9px] font-mono tracking-[1px] uppercase px-2 py-0.5 rounded"
                      style={{ background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>
                      {RANK_LABEL[o.rank]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(o.unitNames && o.unitNames.length > 0) ? o.unitNames.map((u) => {
                      const ust = UNIT_STYLES[u as PoliceUnit];
                      return (
                        <span key={u} className="text-[9px] font-mono tracking-[1px] uppercase px-2 py-0.5 rounded"
                          style={{ background: ust?.bg, color: ust?.color, border: `1px solid ${ust?.border}` }}>
                          {u}
                        </span>
                      );
                    }) : (
                      <span className="text-[9px] font-mono tracking-[1px] uppercase px-2 py-0.5 rounded"
                        style={{ background: "#1a1c2a", color: "#5a7a9a", border: "1px solid #2a3a5a44" }}>
                        LSPD
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[11px] font-bold" style={{ color: ss.color }}>● {ss.label}</div>
                  {canEdit && (
                    <div>
                      {editable && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditing(o); }}
                          className="font-mono text-[10px] tracking-[1px] uppercase px-2 py-1 rounded transition-colors"
                          style={{ background: "#1c2a3a", color: "#5a7a9a", border: "1px solid #1c2a3a" }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#e8c97e"; e.currentTarget.style.borderColor = "#e8c97e44"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "#5a7a9a"; e.currentTarget.style.borderColor = "#1c2a3a"; }}
                        >
                          Editar
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Mobile */}
                <div className="flex md:hidden items-center gap-3 px-4 py-3">
                  <Avatar officer={o} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold" style={{ color: rs.color }}>
                        {o.badgeNumber != null ? `#${o.badgeNumber}` : o.callsign}
                      </span>
                      <span className="text-[9px] font-mono tracking-[1px] uppercase px-1.5 py-0.5 rounded"
                        style={{ background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>
                        {RANK_LABEL[o.rank]}
                      </span>
                      {us && (
                        <span className="text-[9px] font-mono tracking-[1px] uppercase px-1.5 py-0.5 rounded"
                          style={{ background: us.bg, color: us.color, border: `1px solid ${us.border}` }}>
                          {primaryUnit}
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[11px] truncate mt-0.5" style={{ color: "#5a7a9a" }}>{o.fullName}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="font-mono text-[11px] font-bold" style={{ color: ss.color }}>● {ss.label}</div>
                    {editable && (
                      <button onClick={(e) => { e.stopPropagation(); setEditing(o); }}
                        className="font-mono text-[10px] uppercase px-2 py-1 rounded"
                        style={{ background: "#1c2a3a", color: "#5a7a9a" }}>
                        ✎
                      </button>
                    )}
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
