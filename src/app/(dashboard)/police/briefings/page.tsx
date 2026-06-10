"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Briefing } from "@/types";

const inputBase: React.CSSProperties = {
  background: "#0a0d12", border: "1px solid #1c2a3a",
  color: "#c8d6e5", fontFamily: "monospace", fontSize: 12,
  borderRadius: 6, padding: "7px 10px", outline: "none",
};

function formatDate(d: string) {
  return new Date(d + "T12:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── New Briefing Modal ──────────────────────────────────────────────────────

function NewBriefingModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (b: Briefing) => void;
}) {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  const timeNow = new Date().toTimeString().slice(0, 5);

  const [date,      setDate]      = useState(today);
  const [startTime, setStartTime] = useState(timeNow);
  const [endTime,   setEndTime]   = useState("");
  const [announcements, setAnnouncements] = useState("");
  const [topics,    setTopics]    = useState("");
  const [notices,   setNotices]   = useState("");
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !startTime || !endTime) { setError("Data, início e término são obrigatórios."); return; }
    setSaving(true);
    setError(null);
    try {
      const created = await api.post<Briefing>("/police/briefings", {
        date,
        startTime,
        endTime,
        announcements: announcements.split("\n").map((l) => l.trim()).filter(Boolean),
        topics:        topics.split("\n").map((l) => l.trim()).filter(Boolean),
        notices:       notices.split("\n").map((l) => l.trim()).filter(Boolean),
        createdBy: user?.name ?? "—",
      });
      onCreated(created);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar briefing");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>

        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #1c2a3a" }}>
          <span className="text-[11px] font-mono tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>Novo Briefing</span>
          <button onClick={onClose} className="font-mono text-lg px-1" style={{ color: "#5a7a9a" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 max-h-[80vh] overflow-y-auto">

          {/* Data */}
          <div>
            <label className="block text-[10px] font-mono tracking-[1px] uppercase mb-1" style={{ color: "#5a7a9a" }}>Data</label>
            <input type="date" value={date} max={today}
              onChange={(e) => setDate(e.target.value)}
              style={{ ...inputBase, width: "100%" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#e8c97e")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = "#1c2a3a")}
            />
          </div>

          {/* Início / Término */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Início",   val: startTime, set: setStartTime },
              { label: "Término",  val: endTime,   set: setEndTime   },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="block text-[10px] font-mono tracking-[1px] uppercase mb-1" style={{ color: "#5a7a9a" }}>{label}</label>
                <input type="time" value={val} onChange={(e) => set(e.target.value)}
                  style={{ ...inputBase, width: "100%" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#e8c97e")}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = "#1c2a3a")}
                />
              </div>
            ))}
          </div>

          {/* Anúncios */}
          <div>
            <label className="block text-[10px] font-mono tracking-[1px] uppercase mb-1" style={{ color: "#5a7a9a" }}>
              Anúncios <span style={{ color: "#3a4a5a" }}>(opcional — um por linha)</span>
            </label>
            <textarea value={announcements} onChange={(e) => setAnnouncements(e.target.value)} rows={3}
              placeholder={"Promoção do Officer Silva para Corporal\nNova política de uso de força"}
              style={{ ...inputBase, width: "100%", resize: "vertical" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#e8c97e")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = "#1c2a3a")}
            />
          </div>

          {/* Tópicos */}
          <div>
            <label className="block text-[10px] font-mono tracking-[1px] uppercase mb-1" style={{ color: "#5a7a9a" }}>
              Tópicos <span style={{ color: "#3a4a5a" }}>(opcional — um por linha)</span>
            </label>
            <textarea value={topics} onChange={(e) => setTopics(e.target.value)} rows={3}
              placeholder={"Revisão de procedimento de abordagem\nTreinamento de tiro agendado para sexta"}
              style={{ ...inputBase, width: "100%", resize: "vertical" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#e8c97e")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = "#1c2a3a")}
            />
          </div>

          {/* Avisos */}
          <div>
            <label className="block text-[10px] font-mono tracking-[1px] uppercase mb-1" style={{ color: "#5a7a9a" }}>
              Avisos <span style={{ color: "#3a4a5a" }}>(opcional — um por linha)</span>
            </label>
            <textarea value={notices} onChange={(e) => setNotices(e.target.value)} rows={3}
              placeholder={"Uniforme obrigatório durante patrulha\nRelatar qualquer incidente ao supervisor"}
              style={{ ...inputBase, width: "100%", resize: "vertical" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#e8c97e")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = "#1c2a3a")}
            />
          </div>

          {error && <p className="text-[11px] font-mono" style={{ color: "#e24b4a" }}>{error}</p>}

          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose}
              className="font-mono text-[12px] tracking-[1px] uppercase px-4 py-2 rounded"
              style={{ background: "#1c2a3a", color: "#5a7a9a" }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving || !date || !startTime || !endTime}
              className="font-mono text-[12px] tracking-[1px] uppercase px-5 py-2 rounded font-semibold"
              style={{
                background: "#e8c97e", color: "#0a0d12",
                opacity: saving || !date || !startTime || !endTime ? 0.6 : 1,
              }}>
              {saving ? "Salvando..." : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function BriefingsPage() {
  const router = useRouter();
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.get<Briefing[]>("/police/briefings", 30)
      .then((b) => setBriefings(Array.isArray(b) ? b : (b as { data?: Briefing[] }).data ?? []))
      .catch(() => setBriefings([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-3 md:p-6 space-y-4 min-h-full" style={{ background: "#0a0d12" }}>

      {showModal && (
        <NewBriefingModal
          onClose={() => setShowModal(false)}
          onCreated={(b) => { setBriefings((prev) => [b, ...prev]); setShowModal(false); }}
        />
      )}

      {/* Header */}
      <div className="flex items-start md:items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono tracking-[3px] uppercase mb-1" style={{ color: "#5a7a9a" }}>
            Los Santos Police Department · Operações
          </p>
          <h1 className="text-lg md:text-2xl font-mono font-bold tracking-wide md:tracking-widest uppercase" style={{ color: "#e8c97e" }}>
            Briefings
          </h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="font-mono text-[11px] tracking-[1px] uppercase px-4 py-2 rounded font-semibold shrink-0"
          style={{ background: "#e8c97e", color: "#0a0d12" }}
        >
          + Novo Briefing
        </button>
      </div>

      {/* List */}
      <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>

        {/* Headers */}
        <div className="hidden md:grid px-4 py-2 text-[9px] font-mono tracking-[1.5px] uppercase"
          style={{ color: "#8a9ab8", borderBottom: "1px solid #1c2a3a", gridTemplateColumns: "100px 80px 80px 1fr 1fr 1fr 80px", gap: "12px" }}>
          <div>Data</div>
          <div>Início</div>
          <div>Término</div>
          <div>Anúncios</div>
          <div>Tópicos</div>
          <div>Avisos</div>
          <div>Autor</div>
        </div>

        {loading ? (
          <p className="py-16 text-center text-[11px] font-mono" style={{ color: "#5a7a9a" }}>Carregando...</p>
        ) : briefings.length === 0 ? (
          <p className="py-16 text-center text-[11px] font-mono tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>
            Nenhum briefing registrado
          </p>
        ) : (
          briefings.map((b, i) => {
            const isLast = i === briefings.length - 1;
            return (
              <div
                key={b.id}
                className="cursor-pointer transition-colors"
                style={{ borderBottom: isLast ? "none" : "1px solid #111823" }}
                onClick={() => router.push(`/police/briefings/${b.id}`)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#111823")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Desktop */}
                <div className="hidden md:grid px-4 py-3 items-center"
                  style={{ gridTemplateColumns: "100px 80px 80px 1fr 1fr 1fr 80px", gap: "12px" }}>
                  <div className="font-mono text-sm font-bold" style={{ color: "#e8c97e" }}>{formatDate(b.date)}</div>
                  <div className="font-mono text-sm" style={{ color: "#c8d6e5" }}>{b.startTime}</div>
                  <div className="font-mono text-sm" style={{ color: "#c8d6e5" }}>{b.endTime}</div>
                  <div className="font-mono text-[11px]" style={{ color: "#5a7a9a" }}>
                    {b.announcements.length > 0 ? `${b.announcements.length} item${b.announcements.length > 1 ? "s" : ""}` : "—"}
                  </div>
                  <div className="font-mono text-[11px]" style={{ color: "#5a7a9a" }}>
                    {b.topics.length > 0 ? `${b.topics.length} item${b.topics.length > 1 ? "s" : ""}` : "—"}
                  </div>
                  <div className="font-mono text-[11px]" style={{ color: "#5a7a9a" }}>
                    {b.notices.length > 0 ? `${b.notices.length} item${b.notices.length > 1 ? "s" : ""}` : "—"}
                  </div>
                  <div className="font-mono text-[11px] truncate" style={{ color: "#5a7a9a" }}>{b.createdBy}</div>
                </div>

                {/* Mobile */}
                <div className="flex md:hidden items-center gap-3 px-4 py-3">
                  <div className="shrink-0 text-center px-2 py-1.5 rounded" style={{ background: "#0a0d12", border: "1px solid #1c2a3a" }}>
                    <div className="font-mono text-[9px]" style={{ color: "#5a7a9a" }}>
                      {new Date(b.date + "T12:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).toUpperCase()}
                    </div>
                    <div className="font-mono text-xs font-bold" style={{ color: "#e8c97e" }}>{b.startTime}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex gap-1.5 flex-wrap">
                      {b.announcements.length > 0 && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                          style={{ background: "#2a1f0a", color: "#e8c97e" }}>{b.announcements.length} anúncio{b.announcements.length > 1 ? "s" : ""}</span>
                      )}
                      {b.topics.length > 0 && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                          style={{ background: "#0a1f2a", color: "#4a90e2" }}>{b.topics.length} tópico{b.topics.length > 1 ? "s" : ""}</span>
                      )}
                      {b.notices.length > 0 && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                          style={{ background: "#0a2a14", color: "#3dd68c" }}>{b.notices.length} aviso{b.notices.length > 1 ? "s" : ""}</span>
                      )}
                    </div>
                    <p className="font-mono text-[10px] mt-0.5" style={{ color: "#5a7a9a" }}>
                      {b.startTime} — {b.endTime} · {b.createdBy}
                    </p>
                  </div>
                  <span className="font-mono text-[11px] shrink-0" style={{ color: "#5a7a9a" }}>→</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
