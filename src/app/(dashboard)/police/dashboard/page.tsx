"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useOfficer } from "@/context/OfficerContext";
import { api } from "@/lib/api";
import { Aviso, Mandado, Briefing, Officer } from "@/types";

const RANK_ORDER: Record<string, number> = {
  CADET: 1, OFFICER_1: 3, OFFICER_2: 4, OFFICER_3: 6, SENIOR_OFFICER: 7,
  CORPORAL: 8, SERGEANT: 9, LIEUTENANT: 10, CAPTAIN: 11, DEPUTY_CHIEF: 12, CHIEF: 13,
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.floor(hrs / 24)}d atrás`;
}

const inputBase: React.CSSProperties = {
  background: "#0a0d12", border: "1px solid #1c2a3a",
  color: "#c8d6e5", fontFamily: "monospace", fontSize: 12,
  borderRadius: 6, padding: "7px 10px", outline: "none", width: "100%",
};

const MANDADO_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE:    { label: "Ativo",      color: "#e24b4a", bg: "#2a1010" },
  EXECUTED:  { label: "Executado",  color: "#3dd68c", bg: "#0a2a14" },
  CANCELLED: { label: "Cancelado",  color: "#5a7a9a", bg: "#1a1c2a" },
};

// ── Page ───────────────────────────────────────────────────────────────────

export default function PoliceDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { rank, isCommand } = useOfficer();
  const myLevel = RANK_ORDER[rank ?? ""] ?? 0;
  const canManageAvisos = isCommand || myLevel >= 9;

  const [avisos,    setAvisos]    = useState<Aviso[]>([]);
  const [mandados,  setMandados]  = useState<Mandado[]>([]);
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [officers,  setOfficers]  = useState<Officer[]>([]);
  const [loading,   setLoading]   = useState(true);

  // aviso edit state
  const [editingAviso, setEditingAviso]   = useState<Aviso | null>(null);
  const [editAvisoText, setEditAvisoText] = useState("");
  const [savingEdit, setSavingEdit]       = useState(false);

  // form states
  const [novoAviso,   setNovoAviso]   = useState("");
  const [savingAviso, setSavingAviso] = useState(false);

  const [mandadoNome, setMandadoNome] = useState("");
  const [mandadoDesc, setMandadoDesc] = useState("");
  const [savingMandado, setSavingMandado] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Aviso[]>("/police/avisos", 30).catch(() => [] as Aviso[]),
      api.get<Mandado[]>("/police/mandados", 30).catch(() => [] as Mandado[]),
      api.get<Briefing[]>("/police/briefings?page=0&size=5", 30).catch(() => [] as Briefing[]),
      api.get<Officer[]>("/officers", 60).catch(() => [] as Officer[]),
    ]).then(([a, m, b, o]) => {
      setAvisos(a);
      setMandados(m);
      setBriefings(Array.isArray(b) ? b : (b as { data?: Briefing[] }).data ?? []);
      setOfficers(o);
    }).finally(() => setLoading(false));
  }, []);

  async function submitAviso(e: React.FormEvent) {
    e.preventDefault();
    if (!novoAviso.trim()) return;
    setSavingAviso(true);
    try {
      const created = await api.post<Aviso>("/police/avisos", {
        content: novoAviso.trim(),
        createdBy: user?.name ?? "—",
      });
      setAvisos((prev) => [created, ...prev]);
      setNovoAviso("");
    } catch { /* silent */ }
    finally { setSavingAviso(false); }
  }

  async function deleteAviso(id: string) {
    await api.delete(`/police/avisos/${id}`);
    setAvisos((prev) => prev.filter((a) => a.id !== id));
  }

  async function saveEditAviso() {
    if (!editingAviso || !editAvisoText.trim()) return;
    setSavingEdit(true);
    try {
      const updated = await api.put<Aviso>(`/police/avisos/${editingAviso.id}`, {
        content: editAvisoText.trim(),
        createdBy: editingAviso.createdBy,
      });
      setAvisos((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setEditingAviso(null);
    } finally {
      setSavingEdit(false);
    }
  }

  async function submitMandado(e: React.FormEvent) {
    e.preventDefault();
    if (!mandadoNome.trim()) return;
    setSavingMandado(true);
    try {
      const created = await api.post<Mandado>("/police/mandados", {
        suspectName: mandadoNome.trim(),
        description: mandadoDesc.trim() || null,
        createdBy: user?.name ?? "—",
      });
      setMandados((prev) => [created, ...prev]);
      setMandadoNome("");
      setMandadoDesc("");
    } catch { /* silent */ }
    finally { setSavingMandado(false); }
  }

  async function updateMandadoStatus(id: string, status: "EXECUTED" | "CANCELLED") {
    try {
      const updated = await api.patch<Mandado>(`/police/mandados/${id}`, { status });
      setMandados((prev) => prev.map((m) => m.id === id ? updated : m));
    } catch { /* silent */ }
  }

  const activeMandados   = mandados.filter((m) => m.status === "ACTIVE");
  const activeOfficers   = officers.filter((o) => o.status === "ACTIVE").length;
  const inactiveOfficers = officers.filter((o) => o.status === "INACTIVE" || o.status === "SUSPENDED").length;

  return (
    <div className="p-3 md:p-6 space-y-4 min-h-full" style={{ background: "#0a0d12" }}>

      {/* Edit aviso modal */}
      {editingAviso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-md rounded-xl overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #1c2a3a" }}>
              <span className="font-mono text-[11px] tracking-[2px] uppercase" style={{ color: "#e8c97e" }}>Editar Aviso</span>
              <button onClick={() => setEditingAviso(null)} style={{ color: "#5a7a9a" }}>✕</button>
            </div>
            <div className="p-5 space-y-4">
              <textarea
                value={editAvisoText}
                onChange={(e) => setEditAvisoText(e.target.value)}
                rows={4}
                style={{ background: "#0a0d12", border: "1px solid #1c2a3a", color: "#c8d6e5", fontFamily: "monospace", fontSize: 12, borderRadius: 6, padding: "7px 10px", outline: "none", width: "100%", resize: "none" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#e8c97e")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#1c2a3a")}
              />
              <div className="flex gap-3 justify-end">
                <button onClick={() => setEditingAviso(null)} className="font-mono text-[11px] tracking-[1px] uppercase px-4 py-2 rounded" style={{ background: "#111823", color: "#5a7a9a", border: "1px solid #1c2a3a" }}>Cancelar</button>
                <button onClick={saveEditAviso} disabled={savingEdit || !editAvisoText.trim()} className="font-mono text-[11px] tracking-[1px] uppercase px-4 py-2 rounded" style={{ background: savingEdit ? "#1c2a3a" : "#e8c97e", color: savingEdit ? "#5a7a9a" : "#0a0d12", fontWeight: 700 }}>{savingEdit ? "Salvando..." : "Salvar"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <p className="text-[10px] font-mono tracking-[3px] uppercase mb-1" style={{ color: "#5a7a9a" }}>
          Los Santos Police Department · Visão Geral
        </p>
        <h1 className="text-lg md:text-2xl font-mono font-bold tracking-wide md:tracking-widest uppercase" style={{ color: "#e8c97e" }}>
          Dashboard
        </h1>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Oficiais Ativos",  value: loading ? "—" : activeOfficers,         accent: "#3dd68c" },
          { label: "Mandados Ativos",  value: loading ? "—" : activeMandados.length,  accent: "#e24b4a" },
          { label: "Inativos",         value: loading ? "—" : inactiveOfficers,        accent: "#5a7a9a" },
        ].map(({ label, value, accent }) => (
          <div key={label} className="rounded-lg px-4 py-4"
            style={{ background: "#0d1117", border: "1px solid #1c2a3a", borderTop: `2px solid ${accent}` }}>
            <div className="text-[10px] font-mono tracking-[1.5px] uppercase mb-2" style={{ color: "#5a7a9a" }}>{label}</div>
            <div className="font-mono text-3xl font-bold leading-none" style={{ color: accent }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* AVISOS */}
        <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #e8c97e44", borderLeft: "3px solid #e8c97e" }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #1c2a3a", background: "#0d1008" }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#e8c97e" }} />
              <span className="text-[13px] font-mono font-bold tracking-[2px] uppercase" style={{ color: "#e8c97e" }}>⚠ Avisos</span>
            </div>
            <span className="font-mono text-[9px] tracking-[1px] uppercase px-2 py-0.5 rounded"
              style={{ background: "#e8c97e22", color: "#e8c97e", border: "1px solid #e8c97e44" }}>
              Atenção
            </span>
          </div>

          {/* form */}
          <form onSubmit={submitAviso} className="px-4 pt-3 pb-2 flex gap-2">
            <input
              value={novoAviso}
              onChange={(e) => setNovoAviso(e.target.value)}
              placeholder="Novo aviso..."
              style={inputBase}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#e8c97e")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = "#1c2a3a")}
            />
            <button
              type="submit"
              disabled={savingAviso || !novoAviso.trim()}
              className="font-mono text-[11px] tracking-[1px] uppercase px-3 py-1.5 rounded shrink-0"
              style={{
                background: "#e8c97e", color: "#0a0d12", fontWeight: 700,
                opacity: savingAviso || !novoAviso.trim() ? 0.5 : 1,
              }}
            >
              {savingAviso ? "..." : "Postar"}
            </button>
          </form>

          <div className="px-4 pb-2 space-y-1 max-h-64 overflow-y-auto">
            {loading ? (
              <p className="py-6 text-center text-[11px] font-mono" style={{ color: "#5a7a9a" }}>Carregando...</p>
            ) : avisos.length === 0 ? (
              <p className="py-6 text-center text-[11px] font-mono tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>Nenhum aviso</p>
            ) : (
              avisos.map((a) => (
                <div key={a.id} className="py-2.5 flex items-start gap-3" style={{ borderBottom: "1px solid #111823" }}>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-semibold" style={{ color: "#e2eaf4" }}>{a.content}</p>
                    <p className="font-mono text-[10px] mt-0.5" style={{ color: "#5a7a9a" }}>
                      {a.createdBy} · {timeAgo(a.createdAt)}
                    </p>
                  </div>
                  {canManageAvisos && (
                    <div className="flex gap-1 shrink-0 mt-0.5">
                      <button
                        onClick={() => { setEditingAviso(a); setEditAvisoText(a.content); }}
                        className="font-mono text-[9px] tracking-[1px] uppercase px-2 py-1 rounded"
                        style={{ background: "#0a1f2a", color: "#4a90e2", border: "1px solid #4a90e244" }}
                      >Editar</button>
                      <button
                        onClick={() => deleteAviso(a.id)}
                        className="font-mono text-[9px] tracking-[1px] uppercase px-2 py-1 rounded"
                        style={{ background: "#2a0a0a", color: "#e24b4a", border: "1px solid #e24b4a44" }}
                      >✕</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* MANDADOS */}
        <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
          <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: "1px solid #1c2a3a" }}>
            <span className="text-[11px] font-mono tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>Mandados</span>
            {activeMandados.length > 0 && (
              <span className="text-[10px] font-mono tracking-[1px] px-2 py-0.5 rounded"
                style={{ background: "#2a1010", color: "#e24b4a", border: "1px solid #e24b4a44" }}>
                {activeMandados.length} ativo{activeMandados.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* form */}
          <form onSubmit={submitMandado} className="px-4 pt-3 pb-2 space-y-2">
            <div className="flex gap-2">
              <input
                value={mandadoNome}
                onChange={(e) => setMandadoNome(e.target.value)}
                placeholder="Nome do suspeito..."
                style={inputBase}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#e24b4a")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = "#1c2a3a")}
              />
              <button
                type="submit"
                disabled={savingMandado || !mandadoNome.trim()}
                className="font-mono text-[11px] tracking-[1px] uppercase px-3 py-1.5 rounded shrink-0"
                style={{
                  background: "#e24b4a", color: "#fff", fontWeight: 700,
                  opacity: savingMandado || !mandadoNome.trim() ? 0.5 : 1,
                }}
              >
                {savingMandado ? "..." : "Emitir"}
              </button>
            </div>
            <input
              value={mandadoDesc}
              onChange={(e) => setMandadoDesc(e.target.value)}
              placeholder="Descrição / motivo (opcional)..."
              style={inputBase}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#e24b4a")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = "#1c2a3a")}
            />
          </form>

          <div className="px-4 pb-2 space-y-1 max-h-56 overflow-y-auto">
            {loading ? (
              <p className="py-6 text-center text-[11px] font-mono" style={{ color: "#5a7a9a" }}>Carregando...</p>
            ) : mandados.length === 0 ? (
              <p className="py-6 text-center text-[11px] font-mono tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>Nenhum mandado</p>
            ) : (
              mandados.map((m) => {
                const s = MANDADO_STATUS[m.status] ?? MANDADO_STATUS.ACTIVE;
                return (
                  <div key={m.id} className="flex items-start gap-3 py-2.5" style={{ borderBottom: "1px solid #111823" }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold" style={{ color: "#c8d6e5" }}>{m.suspectName}</span>
                        <span className="text-[9px] font-mono tracking-[1px] uppercase px-1.5 py-0.5 rounded"
                          style={{ background: s.bg, color: s.color }}>
                          {s.label}
                        </span>
                      </div>
                      {m.description && (
                        <p className="font-mono text-[11px] mt-0.5 truncate" style={{ color: "#5a7a9a" }}>{m.description}</p>
                      )}
                      <p className="font-mono text-[10px] mt-0.5" style={{ color: "#5a7a9a" }}>
                        {m.createdBy} · {timeAgo(m.createdAt)}
                      </p>
                    </div>
                    {m.status === "ACTIVE" && (
                      <div className="flex gap-1 shrink-0 mt-0.5">
                        <button
                          onClick={() => updateMandadoStatus(m.id, "EXECUTED")}
                          className="font-mono text-[9px] tracking-[1px] uppercase px-2 py-1 rounded"
                          style={{ background: "#0a2a14", color: "#3dd68c", border: "1px solid #3dd68c44" }}
                        >
                          Executar
                        </button>
                        <button
                          onClick={() => updateMandadoStatus(m.id, "CANCELLED")}
                          className="font-mono text-[9px] tracking-[1px] uppercase px-2 py-1 rounded"
                          style={{ background: "#1a1c2a", color: "#5a7a9a", border: "1px solid #4a5a7a44" }}
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* BRIEFINGS */}
      <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: "1px solid #1c2a3a" }}>
          <span className="text-[11px] font-mono tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>Últimos Briefings</span>
          <button
            onClick={() => router.push("/police/briefings")}
            className="font-mono text-[10px] tracking-[1px] uppercase px-3 py-1 rounded transition-colors"
            style={{ background: "#1c2a3a", color: "#5a7a9a", border: "1px solid #1c2a3a" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#e8c97e"; e.currentTarget.style.borderColor = "#e8c97e44"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#5a7a9a"; e.currentTarget.style.borderColor = "#1c2a3a"; }}
          >
            Ver todos →
          </button>
        </div>

        {loading ? (
          <p className="px-4 py-8 text-center text-[11px] font-mono" style={{ color: "#5a7a9a" }}>Carregando...</p>
        ) : briefings.length === 0 ? (
          <p className="px-4 py-8 text-center text-[11px] font-mono tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>
            Nenhum briefing registrado
          </p>
        ) : (
          <div className="divide-y" style={{ borderColor: "#111823" }}>
            {briefings.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors"
                onClick={() => router.push(`/police/briefings/${b.id}`)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#111823")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Data */}
                <div className="shrink-0 text-center px-3 py-2 rounded"
                  style={{ background: "#0a0d12", border: "1px solid #1c2a3a", minWidth: 56 }}>
                  <div className="font-mono text-[10px]" style={{ color: "#5a7a9a" }}>
                    {new Date(b.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).toUpperCase()}
                  </div>
                  <div className="font-mono text-sm font-bold" style={{ color: "#e8c97e" }}>
                    {b.startTime}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px]" style={{ color: "#5a7a9a" }}>
                      {b.startTime} — {b.endTime}
                    </span>
                    {b.topics.length > 0 && (
                      <span className="text-[9px] font-mono tracking-[1px] uppercase px-1.5 py-0.5 rounded"
                        style={{ background: "#0a1f2a", color: "#4a90e2", border: "1px solid #4a90e244" }}>
                        {b.topics.length} tópico{b.topics.length > 1 ? "s" : ""}
                      </span>
                    )}
                    {b.announcements.length > 0 && (
                      <span className="text-[9px] font-mono tracking-[1px] uppercase px-1.5 py-0.5 rounded"
                        style={{ background: "#2a1f0a", color: "#e8c97e", border: "1px solid #e8c97e44" }}>
                        {b.announcements.length} anúncio{b.announcements.length > 1 ? "s" : ""}
                      </span>
                    )}
                    {b.notices.length > 0 && (
                      <span className="text-[9px] font-mono tracking-[1px] uppercase px-1.5 py-0.5 rounded"
                        style={{ background: "#0a2a14", color: "#3dd68c", border: "1px solid #3dd68c44" }}>
                        {b.notices.length} aviso{b.notices.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-[10px] mt-0.5" style={{ color: "#5a7a9a" }}>
                    por {b.createdBy} · {formatDate(b.date)}
                  </p>
                </div>

                <span className="font-mono text-[11px] shrink-0" style={{ color: "#5a7a9a" }}>→</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
