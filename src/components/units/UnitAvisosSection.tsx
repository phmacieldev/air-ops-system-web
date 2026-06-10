"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { UnitAviso } from "@/types";

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

function EditAvisoModal({
  aviso, onClose, onSaved,
}: {
  aviso: UnitAviso;
  onClose: () => void;
  onSaved: (a: UnitAviso) => void;
}) {
  const [content, setContent] = useState(aviso.content);
  const [saving, setSaving]   = useState(false);

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const updated = await api.put<UnitAviso>(`/unit-avisos/${aviso.id}`, { content: content.trim() });
      onSaved(updated);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="w-full max-w-md rounded-xl overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #1c2a3a" }}>
          <span className="font-mono text-[11px] tracking-[2px] uppercase" style={{ color: "#e8c97e" }}>Editar Aviso</span>
          <button onClick={onClose} style={{ color: "#5a7a9a" }}>✕</button>
        </div>
        <div className="p-5 space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            style={{ ...inputBase, resize: "none" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#e8c97e")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#1c2a3a")}
          />
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="font-mono text-[11px] tracking-[1px] uppercase px-4 py-2 rounded"
              style={{ background: "#111823", color: "#5a7a9a", border: "1px solid #1c2a3a" }}
            >Cancelar</button>
            <button
              onClick={handleSave}
              disabled={saving || !content.trim()}
              className="font-mono text-[11px] tracking-[1px] uppercase px-4 py-2 rounded"
              style={{ background: saving ? "#1c2a3a" : "#e8c97e", color: saving ? "#5a7a9a" : "#0a0d12", fontWeight: 700 }}
            >{saving ? "Salvando..." : "Salvar"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UnitAvisosSection({
  unit,
  avisos,
  loading,
  canManage,
  onAdd,
  onEdit,
  onDelete,
}: {
  unit: string;
  avisos: UnitAviso[];
  loading: boolean;
  canManage: boolean;
  onAdd: (a: UnitAviso) => void;
  onEdit: (a: UnitAviso) => void;
  onDelete: (id: string) => void;
}) {
  const { user } = useAuth();
  const [text, setText]         = useState("");
  const [saving, setSaving]     = useState(false);
  const [editing, setEditing]   = useState<UnitAviso | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    try {
      const created = await api.post<UnitAviso>("/unit-avisos", {
        unit,
        content: text.trim(),
        createdBy: user?.name ?? "—",
      });
      onAdd(created);
      setText("");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await api.delete(`/unit-avisos/${id}`);
    onDelete(id);
  }

  return (
    <>
      {editing && (
        <EditAvisoModal
          aviso={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => { onEdit(updated); setEditing(null); }}
        />
      )}

      <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #e8c97e44", borderLeft: "3px solid #e8c97e" }}>
        {/* Header */}
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

        {/* Form — apenas quem pode gerenciar */}
        {canManage && (
          <form onSubmit={submit} className="px-4 pt-3 pb-2 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Novo aviso..."
              style={inputBase}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#e8c97e")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1c2a3a")}
            />
            <button
              type="submit"
              disabled={saving || !text.trim()}
              className="font-mono text-[11px] tracking-[1px] uppercase px-3 py-1.5 rounded shrink-0"
              style={{
                background: "#e8c97e", color: "#0a0d12", fontWeight: 700,
                opacity: saving || !text.trim() ? 0.5 : 1,
              }}
            >{saving ? "..." : "Postar"}</button>
          </form>
        )}

        {/* List */}
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
                {canManage && (
                  <div className="flex gap-1 shrink-0 mt-0.5">
                    <button
                      onClick={() => setEditing(a)}
                      className="font-mono text-[9px] tracking-[1px] uppercase px-2 py-1 rounded"
                      style={{ background: "#0a1f2a", color: "#4a90e2", border: "1px solid #4a90e244" }}
                    >Editar</button>
                    <button
                      onClick={() => handleDelete(a.id)}
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
    </>
  );
}
