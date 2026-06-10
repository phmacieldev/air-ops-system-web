"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { RoleCallRequest, RoleCallStatus, PoliceRank, PoliceUnit, OfficerStatus } from "@/types";

const RANK_LABEL: Record<PoliceRank, string> = {
  CADET:"Cadet",SOLO_CADET:"Solo Cadet",OFFICER:"Officer",OFFICER_1:"Officer I",
  OFFICER_2:"Officer II",OFFICER_3:"Officer III",SENIOR_OFFICER:"Senior Officer",
  CORPORAL:"Corporal",SERGEANT:"Sergeant",LIEUTENANT:"Lieutenant",CAPTAIN:"Captain",
  ASSISTANT_CHIEF:"Asst. Chief",CHIEF:"Chief",COMMISSIONER:"Commissioner",
};
const UNIT_LABEL: Record<PoliceUnit, string> = {
  CID:"CID",HEAT:"HEAT",ASD:"ASD",METRO:"METRO",MU:"MU",FTO:"FTO",
};
const STATUS_LABEL: Record<OfficerStatus, string> = {
  ACTIVE:"Ativo",INACTIVE:"Inativo",SUSPENDED:"Suspenso",TRAINING:"Treinamento",
};

function typeInfo(type: string, value: string) {
  switch (type) {
    case "PROMOTION": return { label:"Promoção", display: RANK_LABEL[value as PoliceRank] ?? value, accent:"#c084fc" };
    case "UNIT":      return { label:"Unidade",  display: value ? (UNIT_LABEL[value as PoliceUnit] ?? value) : "Sem unidade", accent:"#4a90e2" };
    case "BADGE":     return { label:"Badge",    display: `#${value}`, accent:"#e8c97e" };
    case "STATUS":    return { label:"Status",   display: STATUS_LABEL[value as OfficerStatus] ?? value, accent:"#3dd68c" };
    default:          return { label: type,      display: value, accent:"#5a7a9a" };
  }
}

const STATUS_STYLE: Record<RoleCallStatus, { color: string; label: string }> = {
  PENDING:  { color:"#e8c97e", label:"Pendente"  },
  APPROVED: { color:"#3dd68c", label:"Aprovado"  },
  REJECTED: { color:"#e24b4a", label:"Reprovado" },
};

function ReviewModal({ request, onClose, onReviewed }: {
  request: RoleCallRequest;
  onClose: () => void;
  onReviewed: (r: RoleCallRequest) => void;
}) {
  const [note,   setNote]   = useState("");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const { label, display, accent } = typeInfo(request.type, request.requestedValue);

  async function submit(approved: boolean) {
    setSaving(true); setError(null);
    try {
      const updated = await api.patch<RoleCallRequest>(`/rolecall/${request.id}/review`, {
        approved, reviewNote: note.trim() || null,
      });
      onReviewed(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao revisar");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background:"rgba(0,0,0,0.8)" }}
      onClick={(e) => e.target===e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-lg overflow-hidden" style={{ background:"#0d1117", border:"1px solid #1c2a3a" }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom:"1px solid #1c2a3a" }}>
          <span className="font-mono text-[11px] tracking-[1.5px] uppercase" style={{ color:"#e8c97e" }}>
            Revisar Solicitação
          </span>
          <button onClick={onClose} className="font-mono text-lg" style={{ color:"#5a7a9a" }}>×</button>
        </div>
        <div className="p-4 space-y-4">

          <div className="flex items-center gap-3 p-3 rounded" style={{ background:"#0a0d12", border:"1px solid #1c2a3a" }}>
            {request.officerProfileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={request.officerProfileImageUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-sm shrink-0"
                style={{ background:"#1c2a3a", color:"#5a7a9a" }}>
                {(request.officerCallsign ?? request.officerName).slice(0,2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-mono text-sm font-bold" style={{ color:"#c8d6e5" }}>
                {request.officerCallsign ? `${request.officerCallsign} · ` : ""}{request.officerName}
              </div>
              <div className="font-mono text-[10px] tracking-[1px] uppercase" style={{ color:"#5a7a9a" }}>Solicitante</div>
            </div>
          </div>

          <div className="p-3 rounded space-y-2" style={{ background:`${accent}08`, border:`1px solid ${accent}33` }}>
            <div className="font-mono text-[10px] tracking-[1px] uppercase" style={{ color:accent }}>{label}</div>
            <div className="flex items-center gap-2">
              {request.currentValue && (
                <>
                  <span className="font-mono text-sm" style={{ color:"#5a7a9a" }}>
                    {typeInfo(request.type, request.currentValue).display}
                  </span>
                  <span className="font-mono text-xs" style={{ color:"#3a4a5a" }}>→</span>
                </>
              )}
              <span className="font-mono text-sm font-bold" style={{ color:accent }}>{display}</span>
            </div>
            {request.reason && (
              <p className="font-mono text-[11px] pt-1" style={{ color:"#c8d6e5", borderTop:"1px solid #1c2a3a" }}>
                &quot;{request.reason}&quot;
              </p>
            )}
          </div>

          <div>
            <label className="block font-mono text-[10px] tracking-[1px] uppercase mb-1" style={{ color:"#5a7a9a" }}>
              Nota (opcional)
            </label>
            <textarea value={note} onChange={(e)=>setNote(e.target.value)} rows={2}
              placeholder="Observação sobre a decisão..."
              className="w-full font-mono text-sm px-3 py-2 rounded outline-none resize-none"
              style={{ background:"#0a0d12", border:"1px solid #1c2a3a", color:"#c8d6e5" }}
              onFocus={(e)=>(e.currentTarget.style.borderColor="#e8c97e")}
              onBlur={(e)=>(e.currentTarget.style.borderColor="#1c2a3a")} />
          </div>

          {error && <p className="font-mono text-[11px]" style={{ color:"#e24b4a" }}>{error}</p>}

          <div className="flex gap-2">
            <button onClick={() => submit(false)} disabled={saving}
              className="flex-1 font-mono text-[11px] tracking-[1px] uppercase py-2.5 rounded font-semibold"
              style={{ background:"#2a1010", color:"#e24b4a", border:"1px solid #e24b4a44", opacity:saving?0.6:1 }}>
              Reprovar
            </button>
            <button onClick={() => submit(true)} disabled={saving}
              className="flex-1 font-mono text-[11px] tracking-[1px] uppercase py-2.5 rounded font-semibold"
              style={{ background:"#0a2a14", color:"#3dd68c", border:"1px solid #3dd68c44", opacity:saving?0.6:1 }}>
              {saving ? "..." : "Aprovar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoleCallPage() {
  const [requests,  setRequests]  = useState<RoleCallRequest[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<RoleCallStatus | "ALL">("PENDING");
  const [reviewing, setReviewing] = useState<RoleCallRequest | null>(null);

  const [history,        setHistory]        = useState<RoleCallRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<RoleCallRequest[]>("/rolecall/pending")
      .then((data) => setRequests(data))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));

    api.get<RoleCallRequest[]>("/rolecall/history")
      .then((data) => setHistory(data))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, []);

  const filtered = filter === "ALL"
    ? requests
    : requests.filter((r) => r.status === filter);

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  function onReviewed(updated: RoleCallRequest) {
    setRequests((prev) => prev.map((r) => r.id === updated.id ? updated : r));
    setHistory((prev) => [updated, ...prev.filter((r) => r.id !== updated.id)].slice(0, 20));
    setReviewing(null);
  }

  return (
    <div className="p-3 md:p-6 space-y-4 min-h-full" style={{ background:"#0a0d12" }}>

      {reviewing && (
        <ReviewModal request={reviewing} onClose={()=>setReviewing(null)} onReviewed={onReviewed} />
      )}

      {/* Header */}
      <div className="flex items-start md:items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono tracking-[3px] uppercase mb-1" style={{ color:"#5a7a9a" }}>
            Los Santos Police Department · RH
          </p>
          <h1 className="text-lg md:text-2xl font-mono font-bold tracking-wide md:tracking-widest uppercase" style={{ color:"#e8c97e" }}>
            Role Call
          </h1>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded"
            style={{ background:"#e8c97e18", border:"1px solid #e8c97e44" }}>
            <span className="font-mono text-xl font-bold" style={{ color:"#e8c97e" }}>{pendingCount}</span>
            <span className="font-mono text-[10px] tracking-[1px] uppercase" style={{ color:"#5a7a9a" }}>pendentes</span>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(["PENDING","APPROVED","REJECTED","ALL"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="font-mono text-[10px] tracking-[1px] uppercase px-3 py-1.5 rounded"
            style={{
              background: filter===f ? "#e8c97e" : "#0d1117",
              color:      filter===f ? "#0a0d12" : "#5a7a9a",
              border:     filter===f ? "1px solid #e8c97e" : "1px solid #1c2a3a",
            }}>
            {f === "ALL" ? "Todos" : STATUS_STYLE[f as RoleCallStatus]?.label ?? f}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {loading ? (
          <p className="py-8 text-center font-mono text-[11px] tracking-[2px] uppercase" style={{ color:"#5a7a9a" }}>
            Carregando...
          </p>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center rounded-lg" style={{ background:"#0d1117", border:"1px solid #1c2a3a" }}>
            <p className="font-mono text-[11px] tracking-[2px] uppercase" style={{ color:"#5a7a9a" }}>
              Nenhuma solicitação
            </p>
          </div>
        ) : (
          filtered.map((req) => {
            const { label, display, accent } = typeInfo(req.type, req.requestedValue);
            const ss = STATUS_STYLE[req.status];
            return (
              <div key={req.id} className="rounded-lg px-4 py-3 flex items-center gap-4"
                style={{ background:"#0d1117", border:"1px solid #1c2a3a" }}>

                {req.officerProfileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={req.officerProfileImageUrl} alt=""
                    className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0"
                    style={{ background:"#1c2a3a", color:"#5a7a9a" }}>
                    {(req.officerCallsign ?? req.officerName).slice(0,2).toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm font-bold truncate" style={{ color:"#c8d6e5" }}>
                    {req.officerCallsign ? `${req.officerCallsign} · ` : ""}{req.officerName}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="font-mono text-[10px] tracking-[1px] uppercase" style={{ color:accent }}>{label}</span>
                    {req.currentValue && (
                      <>
                        <span className="font-mono text-[10px]" style={{ color:"#3a4a5a" }}>
                          {typeInfo(req.type, req.currentValue).display}
                        </span>
                        <span className="font-mono text-[9px]" style={{ color:"#3a4a5a" }}>→</span>
                      </>
                    )}
                    <span className="font-mono text-[10px] font-bold" style={{ color:accent }}>{display}</span>
                  </div>
                  {req.reason && (
                    <p className="font-mono text-[10px] truncate mt-0.5" style={{ color:"#5a7a9a" }}>
                      &quot;{req.reason}&quot;
                    </p>
                  )}
                  {req.reviewedBy && (
                    <p className="font-mono text-[9px] mt-0.5" style={{ color:"#3a4a5a" }}>
                      por {req.reviewedBy}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-[9px] tracking-[1px] uppercase px-2 py-0.5 rounded"
                    style={{ background:ss.color+"18", color:ss.color, border:`1px solid ${ss.color}44` }}>
                    {ss.label}
                  </span>
                  {req.status === "PENDING" && (
                    <button onClick={() => setReviewing(req)}
                      className="font-mono text-[10px] tracking-[1px] uppercase px-3 py-1.5 rounded"
                      style={{ background:"#1c2a3a", color:"#e8c97e", border:"1px solid #e8c97e44" }}>
                      Revisar
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Log de revisões recentes */}
      <div className="rounded-lg overflow-hidden" style={{ background:"#0d1117", border:"1px solid #1c2a3a" }}>
        <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom:"1px solid #1c2a3a" }}>
          <span className="font-mono text-[11px] tracking-[1.5px] uppercase" style={{ color:"#5a7a9a" }}>
            Últimas Revisões
          </span>
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded"
            style={{ background:"#1c2a3a", color:"#5a7a9a" }}>
            20 mais recentes
          </span>
        </div>

        {historyLoading ? (
          <p className="px-4 py-6 font-mono text-[11px] tracking-[2px] uppercase text-center" style={{ color:"#3a4a5a" }}>
            Carregando...
          </p>
        ) : history.length === 0 ? (
          <p className="px-4 py-6 font-mono text-[11px] tracking-[2px] uppercase text-center" style={{ color:"#3a4a5a" }}>
            Nenhuma revisão ainda
          </p>
        ) : (
          <div>
            {history.map((req) => {
              const { display, accent } = typeInfo(req.type, req.requestedValue);
              const ss = STATUS_STYLE[req.status];
              const reviewedAt = req.reviewedAt
                ? new Date(req.reviewedAt).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })
                : null;
              return (
                <div key={req.id} className="px-4 py-2.5 flex items-center gap-3"
                  style={{ borderBottom:"1px solid #1c2a3a" }}>

                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ss.color }} />

                  <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[12px] font-semibold" style={{ color:"#c8d6e5" }}>
                      {req.officerCallsign ? `${req.officerCallsign} · ` : ""}{req.officerName}
                    </span>
                    <span className="font-mono text-[10px]" style={{ color:"#3a4a5a" }}>→</span>
                    <span className="font-mono text-[11px] font-bold" style={{ color:accent }}>{display}</span>
                    {req.reviewNote && (
                      <span className="font-mono text-[10px] italic truncate max-w-[200px]" style={{ color:"#5a7a9a" }}>
                        &quot;{req.reviewNote}&quot;
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {req.reviewedBy && (
                      <span className="font-mono text-[10px] hidden sm:block" style={{ color:"#3a4a5a" }}>
                        por {req.reviewedBy}
                      </span>
                    )}
                    {reviewedAt && (
                      <span className="font-mono text-[9px]" style={{ color:"#3a4a5a" }}>{reviewedAt}</span>
                    )}
                    <span className="font-mono text-[9px] tracking-[1px] uppercase px-2 py-0.5 rounded"
                      style={{ background:`${ss.color}18`, color:ss.color, border:`1px solid ${ss.color}44` }}>
                      {ss.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
