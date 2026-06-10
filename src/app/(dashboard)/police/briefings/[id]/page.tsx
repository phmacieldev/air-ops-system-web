"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useOfficer } from "@/context/OfficerContext";
import { Briefing } from "@/types";

const RANK_ORDER: Record<string, number> = {
  CADET: 1, OFFICER_1: 3, OFFICER_2: 4, OFFICER_3: 6, SENIOR_OFFICER: 7,
  CORPORAL: 8, SERGEANT: 9, LIEUTENANT: 10, CAPTAIN: 11, DEPUTY_CHIEF: 12, CHIEF: 13,
};

function formatDate(d: string) {
  return new Date(d + "T12:00").toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
}

function Section({ title, items, accent }: { title: string; items: string[]; accent: string }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
      <div className="px-4 py-2.5" style={{ borderBottom: "1px solid #1c2a3a", borderLeft: `3px solid ${accent}` }}>
        <span className="text-[11px] font-mono tracking-[1.5px] uppercase" style={{ color: accent }}>{title}</span>
      </div>
      <ul className="px-4 py-2 space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 py-1.5" style={{ borderBottom: i < items.length - 1 ? "1px solid #111823" : "none" }}>
            <span className="font-mono text-[11px] mt-0.5 shrink-0" style={{ color: accent }}>—</span>
            <span className="font-mono text-sm" style={{ color: "#c8d6e5" }}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function ListEditor({
  label, accent, value, onChange,
}: {
  label: string; accent: string; value: string[]; onChange: (v: string[]) => void;
}) {
  return (
    <div>
      <div className="text-[9px] font-mono tracking-[1px] uppercase mb-1.5" style={{ color: accent }}>{label}</div>
      <div className="space-y-1.5">
        {value.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={item}
              onChange={(e) => {
                const next = [...value];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="flex-1 px-3 py-1.5 rounded font-mono text-sm outline-none"
              style={{ background: "#0a0d12", border: "1px solid #1c2a3a", color: "#c8d6e5" }}
            />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="px-2 rounded font-mono text-[11px]"
              style={{ background: "#1a1a2e", color: "#e05c5c", border: "1px solid #3a1a1a" }}
            >✕</button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...value, ""])}
          className="text-[10px] font-mono tracking-[1px] uppercase px-3 py-1 rounded"
          style={{ background: "#0a0d12", color: accent, border: `1px solid ${accent}33` }}
        >+ Adicionar</button>
      </div>
    </div>
  );
}

function EditModal({
  briefing,
  onClose,
  onSaved,
}: {
  briefing: Briefing;
  onClose: () => void;
  onSaved: (b: Briefing) => void;
}) {
  const [date, setDate]                 = useState(briefing.date);
  const [startTime, setStartTime]       = useState(briefing.startTime);
  const [endTime, setEndTime]           = useState(briefing.endTime);
  const [announcements, setAnnouncements] = useState<string[]>([...briefing.announcements]);
  const [topics, setTopics]             = useState<string[]>([...briefing.topics]);
  const [notices, setNotices]           = useState<string[]>([...briefing.notices]);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const updated = await api.put<Briefing>(`/police/briefings/${briefing.id}`, {
        date,
        startTime,
        endTime,
        announcements: announcements.filter(Boolean),
        topics: topics.filter(Boolean),
        notices: notices.filter(Boolean),
        createdBy: briefing.createdBy,
      });
      onSaved(updated);
    } catch {
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div
        className="w-full max-w-lg rounded-xl overflow-hidden flex flex-col"
        style={{ background: "#0d1117", border: "1px solid #1c2a3a", maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between shrink-0" style={{ borderBottom: "1px solid #1c2a3a" }}>
          <span className="font-mono text-[11px] tracking-[2px] uppercase" style={{ color: "#e8c97e" }}>Editar Briefing</span>
          <button onClick={onClose} className="font-mono text-[12px]" style={{ color: "#5a7a9a" }}>✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Date / Time row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Data",    value: date,      setter: setDate,      type: "date"  },
              { label: "Início",  value: startTime, setter: setStartTime, type: "time"  },
              { label: "Término", value: endTime,   setter: setEndTime,   type: "time"  },
            ].map(({ label, value, setter, type }) => (
              <div key={label}>
                <div className="text-[9px] font-mono tracking-[1px] uppercase mb-1" style={{ color: "#5a7a9a" }}>{label}</div>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className="w-full px-3 py-1.5 rounded font-mono text-sm outline-none"
                  style={{ background: "#0a0d12", border: "1px solid #1c2a3a", color: "#c8d6e5", colorScheme: "dark" }}
                />
              </div>
            ))}
          </div>

          <ListEditor label="Anúncios"  accent="#e8c97e" value={announcements} onChange={setAnnouncements} />
          <ListEditor label="Tópicos"   accent="#4a90e2" value={topics}        onChange={setTopics}        />
          <ListEditor label="Avisos"    accent="#3dd68c" value={notices}       onChange={setNotices}       />

          {error && <p className="font-mono text-[11px]" style={{ color: "#e05c5c" }}>{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 flex gap-3 justify-end shrink-0" style={{ borderTop: "1px solid #1c2a3a" }}>
          <button
            onClick={onClose}
            className="font-mono text-[11px] tracking-[1px] uppercase px-4 py-2 rounded"
            style={{ background: "#111823", color: "#5a7a9a", border: "1px solid #1c2a3a" }}
          >Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="font-mono text-[11px] tracking-[1px] uppercase px-4 py-2 rounded"
            style={{ background: saving ? "#1c2a3a" : "#e8c97e", color: saving ? "#5a7a9a" : "#0a0d12", fontWeight: 700 }}
          >{saving ? "Salvando..." : "Salvar"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BriefingDetailPage() {
  const router  = useRouter();
  const { id }  = useParams<{ id: string }>();
  const { rank, isCommand } = useOfficer();

  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing]   = useState(false);

  const myLevel   = RANK_ORDER[rank ?? ""] ?? 0;
  const canEdit   = isCommand || myLevel >= 9;

  useEffect(() => {
    api.get<Briefing>(`/police/briefings/${id}`)
      .then(setBriefing)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 min-h-full flex items-center justify-center" style={{ background: "#0a0d12" }}>
        <p className="font-mono text-[11px] tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>Carregando...</p>
      </div>
    );
  }

  if (notFound || !briefing) {
    return (
      <div className="p-6 min-h-full flex flex-col items-center justify-center gap-4" style={{ background: "#0a0d12" }}>
        <p className="font-mono text-[11px] tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>Briefing não encontrado</p>
        <button onClick={() => router.push("/police/briefings")}
          className="font-mono text-[11px] tracking-[1px] uppercase px-4 py-2 rounded"
          style={{ background: "#1c2a3a", color: "#5a7a9a" }}>
          ← Voltar
        </button>
      </div>
    );
  }

  const total = briefing.announcements.length + briefing.topics.length + briefing.notices.length;

  return (
    <div className="p-3 md:p-6 space-y-4 min-h-full" style={{ background: "#0a0d12" }}>

      {editing && (
        <EditModal
          briefing={briefing}
          onClose={() => setEditing(false)}
          onSaved={(updated) => { setBriefing(updated); setEditing(false); }}
        />
      )}

      {/* Back */}
      <button
        onClick={() => router.push("/police/briefings")}
        className="font-mono text-[11px] tracking-[1px] uppercase"
        style={{ color: "#5a7a9a" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#e8c97e")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#5a7a9a")}
      >
        ← Todos os briefings
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono tracking-[3px] uppercase mb-1 capitalize" style={{ color: "#5a7a9a" }}>
            {formatDate(briefing.date)}
          </p>
          <h1 className="text-lg md:text-2xl font-mono font-bold tracking-wide md:tracking-widest uppercase" style={{ color: "#e8c97e" }}>
            Briefing
          </h1>
        </div>

        {canEdit && (
          <button
            onClick={() => setEditing(true)}
            className="font-mono text-[11px] tracking-[1px] uppercase px-4 py-2 rounded shrink-0"
            style={{ background: "#1c2a3a", color: "#e8c97e", border: "1px solid #2a3a4a" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#243040")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#1c2a3a")}
          >
            Editar
          </button>
        )}
      </div>

      {/* Meta card */}
      <div className="rounded-lg px-5 py-4" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Data",     value: new Date(briefing.date + "T12:00").toLocaleDateString("pt-BR") },
            { label: "Início",   value: briefing.startTime },
            { label: "Término",  value: briefing.endTime   },
            { label: "Itens",    value: `${total} no total` },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-[9px] font-mono tracking-[1px] uppercase mb-1" style={{ color: "#5a7a9a" }}>{label}</div>
              <div className="font-mono text-sm font-bold" style={{ color: "#c8d6e5" }}>{value}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid #1c2a3a" }}>
          <div className="text-[9px] font-mono tracking-[1px] uppercase mb-1" style={{ color: "#5a7a9a" }}>Registrado por</div>
          <div className="font-mono text-sm" style={{ color: "#c8d6e5" }}>{briefing.createdBy}</div>
        </div>
      </div>

      {/* Sections */}
      <Section title="Anúncios"  items={briefing.announcements} accent="#e8c97e" />
      <Section title="Tópicos"   items={briefing.topics}        accent="#4a90e2" />
      <Section title="Avisos"    items={briefing.notices}       accent="#3dd68c" />

      {total === 0 && (
        <div className="rounded-lg px-4 py-10 text-center" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
          <p className="font-mono text-[11px] tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>
            Briefing sem conteúdo registrado
          </p>
        </div>
      )}
    </div>
  );
}
