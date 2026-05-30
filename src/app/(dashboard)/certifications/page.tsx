"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Certification, CertificateType, HolderType, Pilot } from "@/types";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

// ── Helpers ───────────────────────────────────────────────────────────────

const CERT_META: Record<CertificateType, { label: string; bg: string; color: string; border: string; forExternal?: boolean }> = {
  PURSUIT:       { label: "Pursuit",       bg: "#0a1f2a", color: "#4a90e2", border: "#4a90e244" },
  OPERATIONAL:   { label: "Operational",   bg: "#0a2a14", color: "#3dd68c", border: "#3dd68c44" },
  SCENE_CONTROL: { label: "Scene Control", bg: "#2a1f0a", color: "#e8c97e", border: "#e8c97e44" },
  COPILOT:       { label: "Copiloto",      bg: "#1a1c2a", color: "#8a9ab8", border: "#4a5a7a44", forExternal: true },
  TRANSPORT:     { label: "Transporte",    bg: "#1a1c2a", color: "#8a9ab8", border: "#4a5a7a44", forExternal: true },
};

function CertAvatar({ imageUrl, name, size = 34 }: { imageUrl?: string | null; name: string; size?: number }) {
  const initials = name.split(/[.\s_-]/).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 2) || "?";
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt={name} className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }} />
    );
  }
  return (
    <div className="rounded-full flex items-center justify-center font-mono font-bold shrink-0"
      style={{ width: size, height: size, background: "#1c2a3a", color: "#e8c97e", fontSize: size * 0.32, border: "1px solid #e8c97e22" }}>
      {initials}
    </div>
  );
}

function RevokableBadge({ cert, onRevoke, canDelete }: {
  cert: Certification;
  onRevoke: (id: string) => void;
  canDelete: boolean;
}) {
  const m = CERT_META[cert.certificateType];
  return (
    <span
      title={`Emitido por ${cert.issuedByCallsign} em ${formatDate(cert.issuedAt)}`}
      className="inline-flex items-center gap-1 text-[9px] font-mono tracking-[0.5px] uppercase px-2 py-0.5 rounded whitespace-nowrap"
      style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}` }}>
      {m.label}
      {canDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onRevoke(cert.id); }}
          className="leading-none opacity-50 hover:opacity-100 transition-opacity ml-0.5"
          style={{ color: m.color }}>
          ×
        </button>
      )}
    </span>
  );
}

// ── Grouping ──────────────────────────────────────────────────────────────

type CertGroup = {
  key: string;
  callsign: string | null;
  profileImageUrl: string | null;
  fullName: string;
  discordId: string | null;
  externalCallsign: string | null;
  externalRank: string | null;
  externalUnit: string | null;
  certs: Certification[];
};

function groupCerts(certs: Certification[], tab: HolderType): CertGroup[] {
  const map = new Map<string, CertGroup>();
  for (const cert of certs) {
    const key = tab === "MEMBER"
      ? (cert.memberId ?? cert.memberCallsign ?? cert.discordId ?? cert.fullName)
      : (cert.externalCallsign ?? cert.discordId ?? cert.fullName);
    if (!map.has(key)) {
      map.set(key, {
        key,
        callsign: cert.memberCallsign,
        profileImageUrl: cert.memberProfileImageUrl,
        fullName: cert.fullName,
        discordId: cert.discordId,
        externalCallsign: cert.externalCallsign,
        externalRank: cert.externalRank,
        externalUnit: cert.externalUnit,
        certs: [],
      });
    }
    map.get(key)!.certs.push(cert);
  }
  return Array.from(map.values());
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── Issue Modal ───────────────────────────────────────────────────────────

const MEMBER_TYPES: CertificateType[]   = ["PURSUIT", "OPERATIONAL", "SCENE_CONTROL"];
const EXTERNAL_TYPES: CertificateType[] = ["COPILOT", "TRANSPORT"];

const CERT_ORDER: Record<CertificateType, number> = {
  PURSUIT: 0, OPERATIONAL: 1, SCENE_CONTROL: 2, COPILOT: 3, TRANSPORT: 4,
};

function sortCerts(certs: Certification[]) {
  return [...certs].sort((a, b) => CERT_ORDER[a.certificateType] - CERT_ORDER[b.certificateType]);
}

function IssueModal({
  onClose,
  onIssued,
  issuerEmail,
  pilots,
}: {
  onClose: () => void;
  onIssued: (certs: Certification[]) => void;
  issuerEmail: string;
  pilots: Pilot[];
}) {
  const [holderType,     setHolderType]     = useState<HolderType>("MEMBER");
  const [memberId,       setMemberId]       = useState("");
  const [fullName,       setFullName]       = useState("");
  const [discordId,      setDiscordId]      = useState("");
  const [extCallsign,    setExtCallsign]    = useState("");
  const [extRank,        setExtRank]        = useState("");
  const [extUnit,        setExtUnit]        = useState("");
  const [selectedTypes,  setSelectedTypes]  = useState<Set<CertificateType>>(new Set());
  const [notes,          setNotes]          = useState("");
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  const certOptions = holderType === "MEMBER" ? MEMBER_TYPES : EXTERNAL_TYPES;

  useEffect(() => {
    setSelectedTypes(new Set());
  }, [holderType]);

  useEffect(() => {
    if (holderType === "MEMBER" && memberId) {
      const pilot = pilots.find((p) => p.id === memberId);
      if (pilot) {
        setFullName(pilot.fullName);
        setDiscordId(pilot.discordId);
      }
    }
  }, [memberId, holderType, pilots]);

  function toggleType(t: CertificateType) {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedTypes.size === 0) return;
    setSaving(true);
    setError(null);
    try {
      const results = await Promise.all(
        Array.from(selectedTypes).map((certType) =>
          api.post<Certification>("/certifications", {
            holderType,
            memberId:          holderType === "MEMBER" ? memberId || null : null,
            fullName,
            discordId:         discordId || null,
            externalCallsign:  holderType === "EXTERNAL" ? extCallsign || null : null,
            externalRank:      extRank || null,
            externalUnit:      extUnit || null,
            certificateType:   certType,
            issuedByEmail:     issuerEmail,
            notes:             notes || null,
          })
        )
      );
      onIssued(results);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao emitir certificação");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "#0a0d12", border: "1px solid #1c2a3a", borderRadius: "6px",
    padding: "8px 10px", color: "#c8d6e5", fontFamily: "monospace", fontSize: "13px", width: "100%", outline: "none",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-xl overflow-hidden"
        style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #1c2a3a" }}>
          <span className="font-mono text-[11px] tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>
            Emitir Certificação
          </span>
          <button onClick={onClose} className="font-mono text-lg leading-none" style={{ color: "#5a7a9a" }}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {/* Tipo de detentor */}
          <div className="grid grid-cols-2 gap-2">
            {(["MEMBER", "EXTERNAL"] as HolderType[]).map((t) => (
              <button key={t} type="button" onClick={() => setHolderType(t)}
                className="font-mono text-[10px] tracking-[1px] uppercase py-2 rounded transition-colors"
                style={{
                  background: holderType === t ? "#1c2a3a" : "#0a1117",
                  color:      holderType === t ? "#e8c97e" : "#5a7a9a",
                  border:     `1px solid ${holderType === t ? "#e8c97e44" : "#1c2a3a"}`,
                }}>
                {t === "MEMBER" ? "Membro" : "Externo"}
              </button>
            ))}
          </div>

          {/* Membro (piloto do sistema) */}
          {holderType === "MEMBER" && (
            <div className="space-y-1">
              <label className="block font-mono text-[10px] tracking-[1px] uppercase" style={{ color: "#c8d6e5" }}>Piloto *</label>
              <select required value={memberId} onChange={(e) => setMemberId(e.target.value)} style={inputStyle}>
                <option value="">Selecionar piloto...</option>
                {pilots.map((p) => (
                  <option key={p.id} value={p.id}>{p.callsign} — {p.fullName}</option>
                ))}
              </select>
            </div>
          )}

          {/* Nome + Discord — só para externos */}
          {holderType === "EXTERNAL" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block font-mono text-[10px] tracking-[1px] uppercase" style={{ color: "#c8d6e5" }}>Nome *</label>
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nome completo" style={inputStyle} />
              </div>
              <div className="space-y-1">
                <label className="block font-mono text-[10px] tracking-[1px] uppercase" style={{ color: "#c8d6e5" }}>Discord (opcional)</label>
                <input value={discordId} onChange={(e) => setDiscordId(e.target.value)}
                  placeholder="user#0000" style={inputStyle} />
              </div>
            </div>
          )}

          {/* Campos exclusivos de externo */}
          {holderType === "EXTERNAL" && (
            <>
              <div className="space-y-1">
                <label className="block font-mono text-[10px] tracking-[1px] uppercase" style={{ color: "#c8d6e5" }}>Callsign *</label>
                <input required value={extCallsign} onChange={(e) => setExtCallsign(e.target.value)}
                  placeholder="Ex: SGT. Santos" style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block font-mono text-[10px] tracking-[1px] uppercase" style={{ color: "#c8d6e5" }}>Patente</label>
                  <input value={extRank} onChange={(e) => setExtRank(e.target.value)}
                    placeholder="Ex: Sgt." style={inputStyle} />
                </div>
                <div className="space-y-1">
                  <label className="block font-mono text-[10px] tracking-[1px] uppercase" style={{ color: "#c8d6e5" }}>Unidade</label>
                  <input value={extUnit} onChange={(e) => setExtUnit(e.target.value)}
                    placeholder="Ex: SWAT" style={inputStyle} />
                </div>
              </div>
            </>
          )}

          {/* Tipos de certificado — multi-select */}
          <div className="space-y-1">
            <label className="block font-mono text-[10px] tracking-[1px] uppercase" style={{ color: "#c8d6e5" }}>
              Certificados *
              {selectedTypes.size > 0 && (
                <span className="ml-2 normal-case tracking-normal" style={{ color: "#5a7a9a" }}>
                  ({selectedTypes.size} selecionado{selectedTypes.size > 1 ? "s" : ""})
                </span>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {certOptions.map((t) => {
                const m = CERT_META[t];
                const active = selectedTypes.has(t);
                return (
                  <button key={t} type="button" onClick={() => toggleType(t)}
                    className="text-[9px] font-mono tracking-[0.5px] uppercase px-3 py-1.5 rounded transition-colors"
                    style={{
                      background: active ? m.bg    : "#0a1117",
                      color:      active ? m.color : "#5a7a9a",
                      border:     `1px solid ${active ? m.border : "#1c2a3a"}`,
                    }}>
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <label className="block font-mono text-[10px] tracking-[1px] uppercase" style={{ color: "#5a7a9a" }}>Observações</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional" style={inputStyle} />
          </div>

          {error && (
            <div role="alert" className="font-mono text-[11px] px-3 py-2 rounded"
              style={{ background: "#2a0a0a", color: "#e24b4a", border: "1px solid #e24b4a33" }}>
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 font-mono text-[11px] tracking-[1px] uppercase py-2.5 rounded"
              style={{ background: "#0a1628", color: "#5a7a9a", border: "1px solid #1c2a3a" }}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || selectedTypes.size === 0 || (holderType === "MEMBER" && !memberId)}
              className="flex-1 font-mono text-[11px] tracking-[1px] uppercase py-2.5 rounded font-bold"
              style={{
                background: "#2a1f0a", color: "#e8c97e", border: "1px solid #e8c97e44",
                opacity: (saving || selectedTypes.size === 0 || (holderType === "MEMBER" && !memberId)) ? 0.4 : 1,
              }}>
              {saving
                ? "Emitindo..."
                : selectedTypes.size > 1
                  ? `Emitir ${selectedTypes.size} certificados`
                  : "Emitir"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function CertificationsPage() {
  const { user } = useAuth();
  const [certs,   setCerts]   = useState<Certification[]>([]);
  const [pilots,  setPilots]  = useState<Pilot[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<HolderType>("MEMBER");
  const [search,  setSearch]  = useState("");
  const [showIssue,      setShowIssue]      = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canIssue = ["INSTRUCTOR", "SUPERVISOR", "LEAD", "ADM"].includes(user?.role ?? "");
  const canDelete = user?.role === "LEAD" || user?.role === "ADM";

  useEffect(() => {
    Promise.all([
      api.get<Certification[]>("/certifications"),
      api.get<Pilot[]>("/pilots"),
    ]).then(([c, p]) => { setCerts(c); setPilots(p); }).finally(() => setLoading(false));
  }, []);

  async function deleteCert(id: string) {
    try {
      await api.delete(`/certifications/${id}`);
      setCerts((prev) => prev.filter((c) => c.id !== id));
    } catch { /* silently ignore */ }
    finally { setConfirmDeleteId(null); }
  }

  const groups = groupCerts(
    certs.filter((c) => c.holderType === tab),
    tab,
  ).filter((g) => {
    const q = search.toLowerCase();
    return !q || g.fullName.toLowerCase().includes(q) ||
      (g.discordId?.toLowerCase().includes(q) ?? false) ||
      (g.callsign?.toLowerCase().includes(q) ?? false) ||
      (g.externalCallsign?.toLowerCase().includes(q) ?? false);
  });

  return (
    <div className="p-3 md:p-6 space-y-4 min-h-full" style={{ background: "#0a0d12" }}>

      {showIssue && (
        <IssueModal
          issuerEmail={user!.email}
          pilots={pilots}
          onClose={() => setShowIssue(false)}
          onIssued={(created) => { setCerts((prev) => [...created, ...prev]); setShowIssue(false); }}
        />
      )}

      <ConfirmModal
        open={!!confirmDeleteId}
        title="Revogar Certificação"
        description="Esta certificação será removida permanentemente. Esta ação não pode ser desfeita."
        confirmLabel="Revogar"
        onConfirm={() => confirmDeleteId && deleteCert(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-[3px] uppercase mb-0.5" style={{ color: "#5a7a9a" }}>
            Air Support Division
          </p>
          <h1 className="font-mono text-xl font-bold tracking-widest uppercase" style={{ color: "#e8c97e" }}>
            Certificações
          </h1>
        </div>
        {canIssue && (
          <button onClick={() => setShowIssue(true)}
            className="font-mono text-[11px] tracking-[1px] uppercase px-4 py-2 rounded"
            style={{ background: "#2a1f0a", color: "#e8c97e", border: "1px solid #e8c97e44" }}>
            + Emitir
          </button>
        )}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid #1c2a3a" }}>
          {(["MEMBER", "EXTERNAL"] as HolderType[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 font-mono text-[10px] tracking-[1px] uppercase px-5 py-2 transition-colors"
              style={{
                background: tab === t ? "#1c2a3a" : "#0d1117",
                color:      tab === t ? "#e8c97e" : "#5a7a9a",
              }}>
              {t === "MEMBER" ? "Membros" : "Externos"}
            </button>
          ))}
        </div>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, callsign ou Discord..."
          className="flex-1 font-mono text-[12px] rounded-lg px-3 py-2"
          style={{ background: "#0d1117", border: "1px solid #1c2a3a", color: "#c8d6e5", outline: "none" }}
        />
      </div>

      {/* Table */}
      <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>

        {/* Header */}
        <div className="hidden md:grid px-4 py-2 text-[9px] font-mono tracking-[1.5px] uppercase"
          style={{
            gridTemplateColumns: tab === "MEMBER" ? "40px 0.8fr 1.2fr 1.6fr" : "40px 0.9fr 1fr 0.8fr 1.4fr",
            borderBottom: "1px solid #1c2a3a", color: "#8a9ab8",
          }}>
          {tab === "MEMBER"
            ? ["", "Callsign", "Nome", "Certificações"].map((h, i) => <div key={i}>{h}</div>)
            : ["", "Callsign", "Nome", "Patente / Unidade", "Certificações"].map((h, i) => <div key={i}>{h}</div>)
          }
        </div>

        {loading ? (
          <div className="px-4 py-8 text-center font-mono text-[11px] tracking-[2px] uppercase animate-pulse" style={{ color: "#5a7a9a" }}>
            Carregando...
          </div>
        ) : groups.length === 0 ? (
          <div className="px-4 py-8 text-center font-mono text-[11px] tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>
            Nenhuma certificação encontrada
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.key}>
              {/* Desktop */}
              <div className="hidden md:grid px-4 py-3 items-center transition-colors"
                style={{
                  gridTemplateColumns: tab === "MEMBER" ? "40px 0.8fr 1.2fr 1.6fr" : "40px 0.9fr 1fr 0.8fr 1.4fr",
                  borderBottom: "1px solid #111823",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#111823")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                {tab === "MEMBER" ? (
                  <>
                    <CertAvatar imageUrl={g.profileImageUrl} name={g.callsign ?? g.fullName} />
                    <div className="font-mono text-sm font-bold" style={{ color: "#e8c97e" }}>{g.callsign ?? "—"}</div>
                    <div className="font-mono text-[11px]" style={{ color: "#c8d6e5" }}>{g.fullName}</div>
                  </>
                ) : (
                  <>
                    <CertAvatar imageUrl={null} name={g.externalCallsign ?? g.fullName} />
                    <div className="font-mono text-sm font-bold" style={{ color: "#e8c97e" }}>{g.externalCallsign ?? "—"}</div>
                    <div className="font-mono text-[11px]" style={{ color: "#c8d6e5" }}>{g.fullName}</div>
                    <div className="font-mono text-[11px]" style={{ color: "#5a7a9a" }}>
                      {[g.externalRank, g.externalUnit].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </>
                )}
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {sortCerts(g.certs).map((cert) => (
                      <RevokableBadge
                        key={cert.id}
                        cert={cert}
                        canDelete={canDelete}
                        onRevoke={setConfirmDeleteId}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                    {sortCerts(g.certs).map((cert) => (
                      <span key={cert.id} className="font-mono text-[9px]" style={{ color: "#3a5a7a" }}>
                        {CERT_META[cert.certificateType].label}: {formatDate(cert.issuedAt)}
                      </span>
                    ))}
                  </div>
                  {g.certs.some((c) => c.notes) && (
                    <div className="font-mono text-[9px]" style={{ color: "#5a7a9a" }}>
                      Obs: {g.certs.filter((c) => c.notes).map((c) => c.notes).join(" · ")}
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile */}
              <div className="md:hidden flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: "1px solid #111823" }}>
                <CertAvatar
                  imageUrl={tab === "MEMBER" ? g.profileImageUrl : null}
                  name={tab === "MEMBER" ? (g.callsign ?? g.fullName) : (g.externalCallsign ?? g.fullName)}
                  size={38}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm font-bold mb-1" style={{ color: "#e8c97e" }}>
                    {tab === "MEMBER" ? (g.callsign ?? g.fullName) : (g.externalCallsign ?? g.fullName)}
                  </div>
                  <div className="font-mono text-[10px] mb-1.5" style={{ color: "#5a7a9a" }}>{g.fullName}</div>
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {sortCerts(g.certs).map((cert) => (
                      <RevokableBadge
                        key={cert.id}
                        cert={cert}
                        canDelete={canDelete}
                        onRevoke={setConfirmDeleteId}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-3">
                    {sortCerts(g.certs).map((cert) => (
                      <span key={cert.id} className="font-mono text-[9px]" style={{ color: "#3a5a7a" }}>
                        {CERT_META[cert.certificateType].label}: {formatDate(cert.issuedAt)}
                      </span>
                    ))}
                  </div>
                  {g.certs.some((c) => c.notes) && (
                    <div className="font-mono text-[9px] mt-0.5" style={{ color: "#5a7a9a" }}>
                      Obs: {g.certs.filter((c) => c.notes).map((c) => c.notes).join(" · ")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}