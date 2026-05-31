"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Pilot, Rank, Role } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────

const RANK_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  LEAD:           { bg: "#2a1f0a", color: "#e8c97e", border: "#e8c97e44" },
  SUPERVISOR:     { bg: "#2a1f0a", color: "#e8c97e", border: "#e8c97e44" },
  INSTRUCTOR:     { bg: "#2a1f0a", color: "#e8c97e", border: "#e8c97e44" },
  PILOT_SENIOR:   { bg: "#0a1f2a", color: "#4a90e2", border: "#4a90e244" },
  PILOT_PLENO:    { bg: "#0a2a14", color: "#3dd68c", border: "#3dd68c44" },
  PILOT_STANDARD: { bg: "#0a2a14", color: "#3dd68c", border: "#3dd68c44" },
  TRAINEE:        { bg: "#1a1c2a", color: "#8a9ab8", border: "#4a5a7a44" },
  ADM:            { bg: "#2a0a2a", color: "#c084fc", border: "#c084fc44" },
};
const getRankStyle = (p: Pilot) =>
  p.grupo === "adm" ? RANK_STYLES.ADM : (RANK_STYLES[p.rankName] ?? RANK_STYLES.TRAINEE);

const GROUP_LABEL: Record<string, string> = {
  lead: "Lead", supervisor: "Supervisor", instructor: "Instrutor",
  pilot: "Piloto", trainee: "Trainee", adm: "ADM",
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "#3dd68c", INACTIVE: "#5a7a9a", SUSPENDED: "#e24b4a", TRAINING: "#e8c97e",
};

function getInitials(callsign: string) {
  return callsign.split(/[.\s_-]/).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 2);
}

// ── Rank Modal ────────────────────────────────────────────────────────────

function RankModal({ pilot, ranks, onConfirm, onClose, saving }: {
  pilot: Pilot;
  ranks: Rank[];
  onConfirm: (rankId: string) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [selected, setSelected] = useState(ranks.find((r) => r.name === pilot.rankName)?.id ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #1c2a3a" }}>
          <div>
            <span className="font-mono text-[11px] tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>Alterar Rank</span>
            <div className="font-mono text-[10px] mt-0.5" style={{ color: "#5a7a9a" }}>{pilot.callsign}</div>
          </div>
          <button onClick={onClose} className="font-mono text-lg leading-none" style={{ color: "#5a7a9a" }}>×</button>
        </div>
        <div className="p-4 space-y-2">
          {ranks.map((r) => {
            const style = RANK_STYLES[r.name] ?? RANK_STYLES.TRAINEE;
            const active = selected === r.id;
            return (
              <button key={r.id} onClick={() => setSelected(r.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-left"
                style={{ background: active ? "#1c2a3a" : "transparent", border: `1px solid ${active ? "#e8c97e44" : "#1c2a3a"}` }}>
                <span className="text-[9px] font-mono tracking-[1px] uppercase px-2 py-0.5 rounded"
                  style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}`, minWidth: 90 }}>
                  {r.name}
                </span>
                <span className="font-mono text-[10px]" style={{ color: "#5a7a9a" }}>{r.description}</span>
              </button>
            );
          })}
          <div className="flex gap-2 pt-2">
            <button onClick={onClose}
              className="flex-1 font-mono text-[11px] tracking-[1px] uppercase py-2 rounded"
              style={{ background: "#1c2a3a", color: "#5a7a9a" }}>
              Cancelar
            </button>
            <button
              disabled={saving || !selected || selected === ranks.find((r) => r.name === pilot.rankName)?.id}
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

// ── Delete Modal ──────────────────────────────────────────────────────────

function DeleteModal({ pilot, onConfirm, onClose, saving }: {
  pilot: Pilot;
  onConfirm: () => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [typed, setTyped] = useState("");
  const match = typed === pilot.callsign;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #1c2a3a" }}>
          <span className="font-mono text-[11px] tracking-[1.5px] uppercase" style={{ color: "#e24b4a" }}>Remover Membro</span>
          <button onClick={onClose} className="font-mono text-lg leading-none" style={{ color: "#5a7a9a" }}>×</button>
        </div>
        <div className="p-4 space-y-3">
          <p className="font-mono text-[11px]" style={{ color: "#c8d6e5" }}>
            Esta ação remove <span style={{ color: "#e8c97e" }}>{pilot.callsign}</span> permanentemente — voos, relatórios e certificações associados também serão deletados.
          </p>
          <div className="space-y-1">
            <label className="font-mono text-[10px] tracking-[1.5px] uppercase" style={{ color: "#5a7a9a" }}>
              Digite o callsign para confirmar
            </label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={pilot.callsign}
              className="w-full font-mono text-sm px-3 py-2 rounded outline-none"
              style={{ background: "#0a0d12", border: `1px solid ${match ? "#e24b4a66" : "#1c2a3a"}`, color: "#c8d6e5" }}
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 font-mono text-[11px] tracking-[1px] uppercase py-2 rounded"
              style={{ background: "#1c2a3a", color: "#5a7a9a" }}>
              Cancelar
            </button>
            <button
              disabled={!match || saving}
              onClick={onConfirm}
              className="flex-1 font-mono text-[11px] tracking-[1px] uppercase py-2 rounded"
              style={{ background: "#2a0a0a", color: "#e24b4a", border: "1px solid #e24b4a44", opacity: (!match || saving) ? 0.4 : 1 }}>
              {saving ? "Removendo..." : "Remover"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Role Modal ────────────────────────────────────────────────────────────

const ROLES: { value: Role; label: string; desc: string; color: string }[] = [
  { value: "ADM",        label: "ADM",        desc: "Acesso total · invisível no roster",  color: "#c084fc" },
  { value: "LEAD",       label: "Lead",        desc: "Acesso total · visível no roster",    color: "#e8c97e" },
  { value: "SUPERVISOR", label: "Supervisor",  desc: "Aprova relatórios e gerencia pilotos", color: "#e8c97e" },
  { value: "INSTRUCTOR", label: "Instrutor",   desc: "Avalia trainees e cria relatórios",   color: "#e8c97e" },
  { value: "PILOT",      label: "Piloto",      desc: "Protocolos e relatórios próprios",    color: "#3dd68c" },
  { value: "TRAINEE",    label: "Trainee",     desc: "Somente protocolo de voo",            color: "#8a9ab8" },
];

function RoleModal({ pilot, currentRole, onConfirm, onClose, saving, canSetAdm }: {
  pilot: Pilot;
  currentRole: Role;
  onConfirm: (role: Role) => void;
  onClose: () => void;
  saving: boolean;
  canSetAdm: boolean;
}) {
  const [selected, setSelected] = useState<Role>(currentRole);
  const available = canSetAdm ? ROLES : ROLES.filter((r) => r.value !== "ADM");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #1c2a3a" }}>
          <div>
            <span className="font-mono text-[11px] tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>Alterar Role</span>
            <div className="font-mono text-[10px] mt-0.5" style={{ color: "#5a7a9a" }}>{pilot.callsign}</div>
          </div>
          <button onClick={onClose} className="font-mono text-lg leading-none" style={{ color: "#5a7a9a" }}>×</button>
        </div>
        <div className="p-4 space-y-2">
          {available.map((r) => {
            const active = selected === r.value;
            return (
              <button key={r.value} onClick={() => setSelected(r.value)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-left"
                style={{ background: active ? "#1c2a3a" : "transparent", border: `1px solid ${active ? "#e8c97e44" : "#1c2a3a"}` }}>
                <span className="font-mono text-[10px] tracking-[1px] uppercase font-bold w-[80px] shrink-0" style={{ color: r.color }}>
                  {r.label}
                </span>
                <span className="font-mono text-[10px]" style={{ color: "#5a7a9a" }}>{r.desc}</span>
              </button>
            );
          })}
          <div className="flex gap-2 pt-2">
            <button onClick={onClose}
              className="flex-1 font-mono text-[11px] tracking-[1px] uppercase py-2 rounded"
              style={{ background: "#1c2a3a", color: "#5a7a9a" }}>
              Cancelar
            </button>
            <button
              disabled={saving || selected === currentRole}
              onClick={() => onConfirm(selected)}
              className="flex-1 font-mono text-[11px] tracking-[1px] uppercase py-2 rounded"
              style={{ background: "#e8c97e", color: "#0a0d12", opacity: (saving || selected === currentRole) ? 0.6 : 1 }}>
              {saving ? "Salvando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user } = useAuth();
  const router   = useRouter();

  const [pilots,  setPilots]  = useState<Pilot[]>([]);
  const [ranks,   setRanks]   = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const [rankTarget,   setRankTarget]   = useState<Pilot | null>(null);
  const [roleTarget,   setRoleTarget]   = useState<Pilot | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Pilot | null>(null);
  const [saving,       setSaving]       = useState(false);

  useEffect(() => {
    if (user && user.role !== "LEAD" && user.role !== "ADM") {
      router.replace("/dashboard");
      return;
    }
    Promise.all([
      api.get<Pilot[]>("/admin/pilots"),
      api.get<Rank[]>("/ranks", 300),
    ]).then(([p, r]) => { setPilots(p); setRanks(r); }).finally(() => setLoading(false));
  }, [user, router]);

  // Stats
  const stats = pilots.reduce<Record<string, number>>((acc, p) => {
    acc[p.grupo] = (acc[p.grupo] ?? 0) + 1;
    return acc;
  }, {});

  const canDelete = (target: Pilot) => {
    if (target.userId === user?.id) return false;
    if (user?.role === "ADM") return target.grupo !== "adm";
    if (user?.role === "LEAD") return target.grupo !== "adm";
    return false;
  };

  function currentRoleOf(p: Pilot): Role {
    const grupoToRole: Record<string, Role> = {
      adm: "ADM", lead: "LEAD", supervisor: "SUPERVISOR",
      instructor: "INSTRUCTOR", pilot: "PILOT", trainee: "TRAINEE",
    };
    return grupoToRole[p.grupo] ?? "TRAINEE";
  }

  async function changeRole(newRole: Role) {
    if (!roleTarget) return;
    setSaving(true);
    try {
      await api.patch<void>(`/admin/users/${roleTarget.userId}/role`, { role: newRole });
      const updated = await api.get<Pilot[]>("/admin/pilots");
      setPilots(updated);
      setRoleTarget(null);
    } catch { /* silently ignore */ }
    finally { setSaving(false); }
  }

  async function changeRank(rankId: string) {
    if (!rankTarget) return;
    setSaving(true);
    try {
      const updated = await api.patch<Pilot>(`/pilots/${rankTarget.id}/rank`, { rankId });
      setPilots((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setRankTarget(null);
    } catch { /* silently ignore */ }
    finally { setSaving(false); }
  }

  async function deletePilot() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await api.delete(`/users/${deleteTarget.userId}`);
      setPilots((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao remover membro.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-3 md:p-6 space-y-4 min-h-full" style={{ background: "#0a0d12" }}>

      {rankTarget && (
        <RankModal pilot={rankTarget} ranks={ranks} onConfirm={changeRank}
          onClose={() => setRankTarget(null)} saving={saving} />
      )}
      {roleTarget && (
        <RoleModal
          pilot={roleTarget}
          currentRole={currentRoleOf(roleTarget)}
          onConfirm={changeRole}
          onClose={() => setRoleTarget(null)}
          saving={saving}
          canSetAdm={user?.role === "LEAD"}
        />
      )}
      {deleteTarget && (
        <DeleteModal pilot={deleteTarget} onConfirm={deletePilot}
          onClose={() => setDeleteTarget(null)} saving={saving} />
      )}

      {/* Header */}
      <div>
        <p className="text-[10px] font-mono tracking-[3px] uppercase mb-1" style={{ color: "#5a7a9a" }}>
          Air Support Division · Administração
        </p>
        <h1 className="text-lg md:text-2xl font-mono font-bold tracking-wide md:tracking-widest uppercase" style={{ color: "#e8c97e" }}>
          Painel Admin
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {["lead", "supervisor", "instructor", "pilot", "trainee", "adm"].map((grupo) => (
          <div key={grupo} className="rounded-lg px-3 py-3 text-center"
            style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
            <div className="font-mono text-2xl font-bold" style={{ color: "#e8c97e" }}>
              {stats[grupo] ?? 0}
            </div>
            <div className="font-mono text-[9px] tracking-[1.5px] uppercase mt-1" style={{ color: "#5a7a9a" }}>
              {GROUP_LABEL[grupo]}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div role="alert" className="font-mono text-[11px] px-4 py-2.5 rounded-lg flex items-center justify-between"
          style={{ background: "#2a0a0a", color: "#e24b4a", border: "1px solid #e24b4a33" }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-4 opacity-60 hover:opacity-100">×</button>
        </div>
      )}

      {/* Pilot list */}
      <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: "1px solid #1c2a3a" }}>
          <span className="font-mono text-[11px] tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>
            Todos os Membros
          </span>
          <span className="font-mono text-[10px]" style={{ color: "#5a7a9a" }}>{pilots.length} total</span>
        </div>

        {loading ? (
          <div className="py-16 text-center font-mono text-[11px] tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>
            Carregando...
          </div>
        ) : (
          <>
            {/* Desktop header */}
            <div className="hidden md:grid gap-3 px-4 py-2 text-[9px] font-mono tracking-[1.5px] uppercase"
              style={{ gridTemplateColumns: "40px 1fr 1.5fr 1.2fr 0.7fr 0.7fr 1fr 180px", borderBottom: "1px solid #1c2a3a", color: "#8a9ab8" }}>
              <div />
              <div>Callsign</div><div>Nome</div><div>Rank</div>
              <div>Score</div><div>Status</div><div>Grupo</div><div>Ações</div>
            </div>

            {pilots.map((p) => {
              const rs = getRankStyle(p);
              return (
                <div key={p.id} style={{ borderBottom: "1px solid #111823" }}>
                  {/* Desktop */}
                  <div className="hidden md:grid gap-3 px-4 py-3 items-center"
                    style={{ gridTemplateColumns: "40px 1fr 1.5fr 1.2fr 0.7fr 0.7fr 1fr 180px" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#111823")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>

                    {/* Avatar */}
                    {p.profileImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.profileImageUrl} alt={p.callsign} className="rounded-full object-cover"
                        style={{ width: 32, height: 32, border: `1px solid ${rs.border}` }} />
                    ) : (
                      <div className="rounded-full flex items-center justify-center font-mono font-bold text-xs"
                        style={{ width: 32, height: 32, background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>
                        {getInitials(p.callsign)}
                      </div>
                    )}

                    <div className="font-mono text-sm font-bold truncate" style={{ color: rs.color }}>{p.callsign}</div>
                    <div className="font-mono text-sm truncate" style={{ color: "#c8d6e5" }}>{p.fullName}</div>
                    <span className="text-[9px] font-mono tracking-[1px] uppercase px-2 py-0.5 rounded w-fit"
                      style={{ background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>
                      {p.rankName}
                    </span>
                    <div className="font-mono text-sm font-bold" style={{ color: rs.color }}>{p.accumulatedScore}</div>
                    <div className="font-mono text-[11px] font-bold" style={{ color: STATUS_COLOR[p.status] ?? "#5a7a9a" }}>
                      ● {p.status}
                    </div>
                    <div className="font-mono text-[10px] tracking-[1px] uppercase" style={{ color: "#5a7a9a" }}>
                      {GROUP_LABEL[p.grupo] ?? p.grupo}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => setRankTarget(p)}
                        className="font-mono text-[10px] tracking-[1px] uppercase px-2.5 py-1.5 rounded"
                        style={{ background: "#1c2a3a", color: "#e8c97e", border: "1px solid #e8c97e33", whiteSpace: "nowrap" }}>
                        Rank
                      </button>
                      {p.userId !== user?.id && (
                        <button onClick={() => setRoleTarget(p)}
                          className="font-mono text-[10px] tracking-[1px] uppercase px-2.5 py-1.5 rounded"
                          style={{ background: "#1a1c2a", color: "#c084fc", border: "1px solid #c084fc33", whiteSpace: "nowrap" }}>
                          Role
                        </button>
                      )}
                      {canDelete(p) && (
                        <button onClick={() => setDeleteTarget(p)}
                          className="font-mono text-[10px] tracking-[1px] uppercase px-2.5 py-1.5 rounded"
                          style={{ background: "#1a0a0a", color: "#e24b4a", border: "1px solid #e24b4a33", whiteSpace: "nowrap" }}>
                          Deletar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mobile */}
                  <div className="flex md:hidden items-center gap-3 px-4 py-3">
                    <div className="rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0"
                      style={{ width: 36, height: 36, background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>
                      {getInitials(p.callsign)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm font-bold" style={{ color: rs.color }}>{p.callsign}</div>
                      <div className="font-mono text-[11px] truncate" style={{ color: "#5a7a9a" }}>{p.fullName}</div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => setRankTarget(p)}
                        className="font-mono text-[10px] tracking-[1px] uppercase px-2 py-1.5 rounded"
                        style={{ background: "#1c2a3a", color: "#e8c97e", border: "1px solid #e8c97e33" }}>
                        Rank
                      </button>
                      {p.userId !== user?.id && (
                        <button onClick={() => setRoleTarget(p)}
                          className="font-mono text-[10px] tracking-[1px] uppercase px-2 py-1.5 rounded"
                          style={{ background: "#1a1c2a", color: "#c084fc", border: "1px solid #c084fc33" }}>
                          Role
                        </button>
                      )}
                      {canDelete(p) && (
                        <button onClick={() => setDeleteTarget(p)}
                          className="font-mono text-[10px] tracking-[1px] uppercase px-2 py-1.5 rounded"
                          style={{ background: "#1a0a0a", color: "#e24b4a", border: "1px solid #e24b4a33" }}>
                          Del
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
