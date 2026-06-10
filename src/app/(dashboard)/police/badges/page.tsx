"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Officer } from "@/types";
import { BADGE_TIERS, tierForRank } from "@/lib/police/badges";

// ── Confirm modal ──────────────────────────────────────────────────────────

function ConfirmBadgeModal({
  badge,
  accent,
  onConfirm,
  onCancel,
  saving,
}: {
  badge: number;
  accent: string;
  onConfirm: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-xs rounded-lg overflow-hidden" style={{ background: "#0d1117", border: `1px solid ${accent}44` }}>
        <div className="px-4 py-3" style={{ borderBottom: "1px solid #1c2a3a" }}>
          <span className="font-mono text-[11px] tracking-[1.5px] uppercase" style={{ color: accent }}>
            Confirmar Badge
          </span>
        </div>
        <div className="p-5 text-center space-y-4">
          <div
            className="mx-auto w-20 h-20 rounded-full flex items-center justify-center font-mono text-2xl font-bold"
            style={{ background: `${accent}18`, border: `2px solid ${accent}66`, color: accent }}
          >
            #{badge}
          </div>
          <p className="font-mono text-sm" style={{ color: "#c8d6e5" }}>
            Deseja assumir a badge <span style={{ color: accent }}>#{badge}</span>?
          </p>
          <p className="font-mono text-[10px]" style={{ color: "#5a7a9a" }}>
            Sua badge atual será substituída.
          </p>
          <div className="flex gap-2 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 font-mono text-[11px] tracking-[1px] uppercase py-2 rounded"
              style={{ background: "#1c2a3a", color: "#5a7a9a" }}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={saving}
              className="flex-1 font-mono text-[11px] tracking-[1px] uppercase py-2 rounded font-semibold"
              style={{ background: accent, color: "#0a0d12", opacity: saving ? 0.6 : 1 }}
            >
              {saving ? "..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function BadgesPage() {
  const [officers,   setOfficers]   = useState<Officer[]>([]);
  const [myOfficer,  setMyOfficer]  = useState<Officer | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [pending,    setPending]    = useState<{ badge: number; accent: string } | null>(null);
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Officer[]>("/officers", 60).catch(() => [] as Officer[]),
      api.get<Officer>("/officers/me", 60).catch(() => null),
    ]).then(([list, me]) => {
      setOfficers(list);
      setMyOfficer(me);
    }).finally(() => setLoading(false));
  }, []);

  // mapa número → oficial
  const badgeMap = new Map<number, Officer>();
  for (const o of officers) {
    if (o.badgeNumber != null) badgeMap.set(o.badgeNumber, o);
  }

  const myTier      = myOfficer ? tierForRank(myOfficer.rank) : null;
  const myBadge     = myOfficer?.badgeNumber ?? null;
  const hasBadge    = myBadge != null;

  async function claimBadge(badge: number) {
    if (!myOfficer) return;
    setSaving(true);
    try {
      const updated = await api.patch<Officer>(`/officers/${myOfficer.id}`, { badgeNumber: badge });
      // atualiza lista
      setOfficers((prev) => prev.map((o) => o.id === updated.id ? updated : o));
      setMyOfficer(updated);
      setPending(null);
    } catch { /* silent */ }
    finally { setSaving(false); }
  }

  const totalAssigned  = badgeMap.size;
  const totalAvailable = BADGE_TIERS.reduce((acc, t) => acc + (t.max - t.min + 1), 0) - totalAssigned;
  const q = search.trim().toLowerCase();

  return (
    <div className="p-3 md:p-6 space-y-4 min-h-full" style={{ background: "#0a0d12" }}>

      {pending && (
        <ConfirmBadgeModal
          badge={pending.badge}
          accent={pending.accent}
          onConfirm={() => claimBadge(pending.badge)}
          onCancel={() => setPending(null)}
          saving={saving}
        />
      )}

      {/* Header */}
      <div className="flex items-start md:items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono tracking-[3px] uppercase mb-1" style={{ color: "#5a7a9a" }}>
            Los Santos Police Department · Identificação
          </p>
          <h1 className="text-lg md:text-2xl font-mono font-bold tracking-wide md:tracking-widest uppercase" style={{ color: "#e8c97e" }}>
            Badges
          </h1>
        </div>
        <div className="flex items-center gap-4 shrink-0 text-right">
          {myBadge != null && (
            <div>
              <div className="font-mono text-xl font-bold" style={{ color: myTier?.accent ?? "#e8c97e" }}>#{myBadge}</div>
              <div className="text-[9px] font-mono tracking-[1px] uppercase" style={{ color: "#5a7a9a" }}>sua badge</div>
            </div>
          )}
          <div>
            <div className="font-mono text-xl font-bold" style={{ color: "#e8c97e" }}>{loading ? "—" : totalAssigned}</div>
            <div className="text-[9px] font-mono tracking-[1px] uppercase" style={{ color: "#5a7a9a" }}>em uso</div>
          </div>
          <div>
            <div className="font-mono text-xl font-bold" style={{ color: "#3dd68c" }}>{loading ? "—" : totalAvailable}</div>
            <div className="text-[9px] font-mono tracking-[1px] uppercase" style={{ color: "#5a7a9a" }}>disponíveis</div>
          </div>
        </div>
      </div>

      {/* Hint */}
      {myTier && (
        <div className="flex items-center gap-2 px-3 py-2 rounded text-[10px] font-mono"
          style={{ background: `${myTier.accent}10`, border: `1px solid ${myTier.accent}33`, color: myTier.accent }}>
          <span>●</span>
          {hasBadge ? (
            <span>
              Você já possui a badge <strong>#{myBadge}</strong>. Para trocar, abra um <strong>Role Call</strong> de tipo Badge e aguarde aprovação.
            </span>
          ) : (
            <span>
              Sua patente permite escolher badges no range <strong>{myTier.min}–{myTier.max}</strong>.
              Clique em um número disponível para assumir.
            </span>
          )}
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Buscar badge (número ou callsign)..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm font-mono text-sm px-3 py-2 rounded-md outline-none"
        style={{ background: "#0d1117", border: "1px solid #1c2a3a", color: "#c8d6e5" }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#e8c97e")}
        onBlur={(e)  => (e.currentTarget.style.borderColor = "#1c2a3a")}
      />

      {/* Tier grids */}
      <div className="space-y-4">
        {BADGE_TIERS.map((tier) => {
          const numbers  = Array.from({ length: tier.max - tier.min + 1 }, (_, i) => tier.min + i);
          const isMyTier = myTier?.min === tier.min;

          const filtered = q
            ? numbers.filter((n) => {
                const o = badgeMap.get(n);
                return (
                  String(n).includes(q) ||
                  (o && (o.callsign?.toLowerCase().includes(q) || o.fullName.toLowerCase().includes(q)))
                );
              })
            : numbers;

          if (filtered.length === 0) return null;

          const tierAssigned  = numbers.filter((n) => badgeMap.has(n)).length;
          const tierAvailable = numbers.length - tierAssigned;

          return (
            <div key={tier.min} className="rounded-lg overflow-hidden"
              style={{
                background: "#0d1117",
                border: isMyTier ? `1px solid ${tier.accent}55` : "1px solid #1c2a3a",
              }}>

              {/* Tier header */}
              <div className="px-4 py-2.5 flex items-center justify-between"
                style={{ borderBottom: "1px solid #1c2a3a", borderLeft: `3px solid ${tier.accent}` }}>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono tracking-[1.5px] uppercase" style={{ color: tier.accent }}>
                    {tier.label}
                  </span>
                  <span className="text-[9px] font-mono tracking-[1px] uppercase px-2 py-0.5 rounded"
                    style={{ background: "#0a0d12", color: "#5a7a9a", border: "1px solid #1c2a3a" }}>
                    {tier.min} — {tier.max}
                  </span>
                  {isMyTier && (
                    <span className="text-[9px] font-mono tracking-[1px] uppercase px-2 py-0.5 rounded"
                      style={{ background: `${tier.accent}18`, color: tier.accent, border: `1px solid ${tier.accent}44` }}>
                      sua faixa
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono" style={{ color: "#5a7a9a" }}>
                  <span style={{ color: tier.accent }}>{tierAssigned} usados</span>
                  <span>·</span>
                  <span style={{ color: "#3dd68c" }}>{tierAvailable} livres</span>
                </div>
              </div>

              {/* Grid */}
              <div className="p-3">
                {loading ? (
                  <p className="py-4 text-center font-mono text-[11px]" style={{ color: "#5a7a9a" }}>Carregando...</p>
                ) : (
                  <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))" }}>
                    {filtered.map((n) => {
                      const officer  = badgeMap.get(n);
                      const taken    = !!officer;
                      const isMe     = taken && officer!.id === myOfficer?.id;
                      const canClaim = !taken && isMyTier && !!myOfficer && !hasBadge;

                      let bg      = "#0a0d12";
                      let border  = "1px solid #1c2a3a";
                      let color   = "#3a4a5a";
                      let cursor  = "default";

                      if (isMe) {
                        bg     = `${tier.accent}30`;
                        border = `2px solid ${tier.accent}`;
                        color  = tier.accent;
                      } else if (taken) {
                        bg     = `${tier.accent}18`;
                        border = `1px solid ${tier.accent}44`;
                        color  = tier.accent;
                      } else if (canClaim) {
                        bg     = "#0d1117";
                        border = `1px solid ${tier.accent}33`;
                        color  = `${tier.accent}88`;
                        cursor = "pointer";
                      }

                      return (
                        <div
                          key={n}
                          title={
                            isMe      ? `Sua badge — #${n}` :
                            taken     ? `${officer!.callsign ?? officer!.fullName}` :
                            canClaim  ? `Clique para assumir a badge #${n}` :
                            `#${n}`
                          }
                          className="relative group rounded px-2 py-1.5 text-center transition-all"
                          style={{ background: bg, border, cursor }}
                          onClick={() => canClaim && setPending({ badge: n, accent: tier.accent })}
                          onMouseEnter={(e) => {
                            if (canClaim) {
                              e.currentTarget.style.background = `${tier.accent}22`;
                              e.currentTarget.style.border = `1px solid ${tier.accent}88`;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (canClaim) {
                              e.currentTarget.style.background = "#0d1117";
                              e.currentTarget.style.border = `1px solid ${tier.accent}33`;
                            }
                          }}
                        >
                          <div className="font-mono text-xs font-bold" style={{ color }}>
                            {n}
                          </div>

                          {isMe && (
                            <>
                              <div className="font-mono truncate mt-0.5" style={{ fontSize: 9, color: tier.accent }}>
                                você
                              </div>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-10 hidden group-hover:block whitespace-nowrap rounded px-2 py-1 pointer-events-none"
                                style={{ background: "#1c2a3a", border: `1px solid ${tier.accent}44` }}>
                                <div className="font-mono text-[10px] font-bold" style={{ color: tier.accent }}>Sua badge</div>
                                <div className="font-mono text-[9px]" style={{ color: "#5a7a9a" }}>Troca via Role Call</div>
                              </div>
                            </>
                          )}

                          {taken && !isMe && (
                            <div className="font-mono truncate mt-0.5" style={{ fontSize: 9, color: tier.accent, opacity: 0.8 }}>
                              {officer!.callsign ?? "—"}
                            </div>
                          )}

                          {canClaim && (
                            <div className="font-mono mt-0.5" style={{ fontSize: 8, color: tier.accent, opacity: 0.6 }}>
                              livre
                            </div>
                          )}

                          {/* Tooltip */}
                          {taken && !isMe && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-10 hidden group-hover:block whitespace-nowrap rounded px-2 py-1 pointer-events-none"
                              style={{ background: "#1c2a3a", border: "1px solid #2a3a4a" }}>
                              <div className="font-mono text-[10px] font-bold" style={{ color: tier.accent }}>
                                {officer!.callsign ?? officer!.fullName}
                              </div>
                              <div className="font-mono text-[9px]" style={{ color: "#5a7a9a" }}>{officer!.fullName}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
