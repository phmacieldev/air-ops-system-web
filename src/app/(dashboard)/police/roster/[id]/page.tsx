"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Officer, OfficerWeapon, PoliceRank, PoliceUnit, OfficerStatus, RoleCallType, AsdProfile } from "@/types";
import { tierForRank } from "@/lib/police/badges";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

// ── Constants ─────────────────────────────────────────────────────────────

const RANK_ORDER: Record<PoliceRank, number> = {
  CADET:1,SOLO_CADET:2,OFFICER:3,OFFICER_1:4,OFFICER_2:5,OFFICER_3:6,
  SENIOR_OFFICER:7,CORPORAL:8,SERGEANT:9,LIEUTENANT:10,CAPTAIN:11,
  ASSISTANT_CHIEF:12,CHIEF:13,COMMISSIONER:14,
};

const RANK_LABEL: Record<PoliceRank, string> = {
  CADET:"Cadet",SOLO_CADET:"Solo Cadet",OFFICER:"Officer",OFFICER_1:"Officer I",
  OFFICER_2:"Officer II",OFFICER_3:"Officer III",SENIOR_OFFICER:"Senior Officer",
  CORPORAL:"Corporal",SERGEANT:"Sergeant",LIEUTENANT:"Lieutenant",CAPTAIN:"Captain",
  ASSISTANT_CHIEF:"Asst. Chief",CHIEF:"Chief",COMMISSIONER:"Commissioner",
};

const ALL_RANKS: PoliceRank[] = [
  "CADET","SOLO_CADET","OFFICER","OFFICER_1","OFFICER_2","OFFICER_3",
  "SENIOR_OFFICER","CORPORAL","SERGEANT","LIEUTENANT","CAPTAIN",
  "ASSISTANT_CHIEF","CHIEF","COMMISSIONER",
];

const ALL_UNITS: PoliceUnit[] = ["CID","HEAT","ASD","METRO","MU","FTO"];
const ALL_STATUSES: OfficerStatus[] = ["ACTIVE","INACTIVE","SUSPENDED","TRAINING","ABSENT"];
const STATUS_LABEL: Record<OfficerStatus, string> = {
  ACTIVE:"Ativo",INACTIVE:"Inativo",SUSPENDED:"Suspenso",TRAINING:"Treinamento",ABSENT:"Ausente",
};

function getRankStyle(rank: PoliceRank) {
  const l = RANK_ORDER[rank] ?? 1;
  if (l>=13) return { bg:"#1a1020", color:"#c084fc", border:"#c084fc44" };
  if (l>=11) return { bg:"#2a1f0a", color:"#e8c97e", border:"#e8c97e44" };
  if (l>=9)  return { bg:"#0a1f2a", color:"#4a90e2", border:"#4a90e244" };
  if (l>=7)  return { bg:"#0a2a14", color:"#3dd68c", border:"#3dd68c44" };
  if (l>=3)  return { bg:"#0a1a2a", color:"#5a8ab8", border:"#5a8ab844" };
  return       { bg:"#1a1c2a", color:"#8a9ab8", border:"#4a5a7a44" };
}

const UNIT_STYLES: Record<PoliceUnit, { bg:string; color:string; border:string }> = {
  CID:  { bg:"#2a1010",color:"#e24b4a",border:"#e24b4a44" },
  HEAT: { bg:"#1a1020",color:"#c084fc",border:"#c084fc44" },
  ASD:  { bg:"#0a1f2a",color:"#4a90e2",border:"#4a90e244" },
  METRO:{ bg:"#2a1f0a",color:"#e8c97e",border:"#e8c97e44" },
  MU:   { bg:"#0a2a14",color:"#3dd68c",border:"#3dd68c44" },
  FTO:  { bg:"#1a1a0a",color:"#f97316",border:"#f9731644" },
};

const STATUS_STYLES: Record<OfficerStatus,{label:string;color:string;bg:string}> = {
  ACTIVE:   {label:"Ativo",    color:"#3dd68c",bg:"#0a2a14"},
  INACTIVE: {label:"Inativo",  color:"#5a7a9a",bg:"#1a1c2a"},
  SUSPENDED:{label:"Suspenso", color:"#e24b4a",bg:"#2a1010"},
  TRAINING: {label:"Treinamento",color:"#e8c97e",bg:"#2a1f0a"},
  ABSENT:   {label:"Ausente",  color:"#f97316",bg:"#2a1a0a"},
};

const WEAPON_CLASSES: { value: OfficerWeapon["class"]; label: string; color: string }[] = [
  { value:"CLASSE_1", label:"Classe 1 — Pistola",        color:"#4a90e2" },
  { value:"CLASSE_2", label:"Classe 2 — Submetralhadora", color:"#e8c97e" },
  { value:"CLASSE_3", label:"Classe 3 — Rifle",           color:"#e24b4a" },
  { value:"TASER",    label:"Taser (Não-letal)",           color:"#3dd68c" },
];

const WEAPON_COLOR: Record<OfficerWeapon["class"], string> = {
  CLASSE_1:"#4a90e2", CLASSE_2:"#e8c97e", CLASSE_3:"#e24b4a", TASER:"#3dd68c",
};

const inputStyle: React.CSSProperties = {
  background:"#0a0d12", border:"1px solid #1c2a3a",
  borderRadius:"6px", padding:"8px 12px",
  color:"#c8d6e5", fontFamily:"monospace", fontSize:"13px", width:"100%", outline:"none",
};
const focus = (e: React.FocusEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
  (e.currentTarget.style.borderColor = "#e8c97e");
const blur  = (e: React.FocusEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
  (e.currentTarget.style.borderColor = "#1c2a3a");

// ── Edit Profile Modal ─────────────────────────────────────────────────────

function EditProfileModal({ officer, onClose, onSaved }: {
  officer: Officer; onClose: () => void; onSaved: (o: Officer) => void;
}) {
  const [callsign, setCallsign] = useState(officer.callsign);
  const [photoUrl, setPhotoUrl] = useState(officer.profileImageUrl ?? "");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string|null>(null);

  async function save() {
    setSaving(true); setError(null);
    try {
      const updated = await api.patch<Officer>(`/officers/${officer.id}`, {
        callsign, profileImageUrl: photoUrl || null,
      });
      onSaved(updated);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Erro ao salvar"); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{background:"rgba(0,0,0,0.75)"}}
      onClick={(e) => e.target===e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-lg overflow-hidden" style={{background:"#0d1117",border:"1px solid #1c2a3a"}}>
        <div className="px-4 py-3 flex items-center justify-between" style={{borderBottom:"1px solid #1c2a3a"}}>
          <span className="font-mono text-[11px] tracking-[1.5px] uppercase" style={{color:"#e8c97e"}}>Editar Perfil</span>
          <button onClick={onClose} className="font-mono text-lg" style={{color:"#5a7a9a"}}>×</button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="block font-mono text-[10px] tracking-[1.5px] uppercase mb-1" style={{color:"#5a7a9a"}}>Callsign</label>
            <input value={callsign} onChange={(e)=>setCallsign(e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur} />
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-[1.5px] uppercase mb-1" style={{color:"#5a7a9a"}}>URL da Foto (opcional)</label>
            <input type="url" value={photoUrl} onChange={(e)=>setPhotoUrl(e.target.value)} placeholder="https://..." style={inputStyle} onFocus={focus} onBlur={blur} />
          </div>
          {error && <p className="font-mono text-[11px]" style={{color:"#e24b4a"}}>{error}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 font-mono text-[11px] uppercase py-2 rounded" style={{background:"#1c2a3a",color:"#5a7a9a"}}>Cancelar</button>
            <button onClick={save} disabled={saving||!callsign} className="flex-1 font-mono text-[11px] uppercase py-2 rounded"
              style={{background:"#e8c97e",color:"#0a0d12",opacity:saving||!callsign?0.6:1}}>
              {saving?"Salvando...":"Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Ficha Modal ────────────────────────────────────────────────────────────

function FichaModal({ officer, onClose, onSaved }: {
  officer: Officer; onClose: () => void; onSaved: (o: Officer) => void;
}) {
  const [phone,       setPhone]       = useState(officer.phone ?? "");
  const [dna,         setDna]         = useState(officer.dna ?? "");
  const [fingerprint, setFingerprint] = useState(officer.fingerprint ?? "");
  const [notes,       setNotes]       = useState(officer.notes ?? "");
  const [weapons,     setWeapons]     = useState<OfficerWeapon[]>(officer.weapons ?? []);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string|null>(null);

  function addWeapon() { setWeapons((p) => [...p, { class: "CLASSE_1", serial: "" }]); }
  function removeWeapon(i: number) { setWeapons((p) => p.filter((_, idx) => idx !== i)); }
  function updateWeapon(i: number, field: keyof OfficerWeapon, value: string) {
    setWeapons((p) => p.map((w, idx) => idx===i ? {...w,[field]:value} : w));
  }

  async function save() {
    setSaving(true); setError(null);
    try {
      const updated = await api.patch<Officer>(`/officers/${officer.id}`, {
        phone: phone || null, dna: dna || null, fingerprint: fingerprint || null,
        notes: notes || null,
        weapons: weapons.map((w) => ({ weaponClass: w.class, serial: w.serial })),
      });
      onSaved(updated);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Erro ao salvar"); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{background:"rgba(0,0,0,0.75)"}}
      onClick={(e) => e.target===e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-lg overflow-hidden" style={{background:"#0d1117",border:"1px solid #1c2a3a"}}>
        <div className="px-4 py-3 flex items-center justify-between" style={{borderBottom:"1px solid #1c2a3a"}}>
          <span className="font-mono text-[11px] tracking-[1.5px] uppercase" style={{color:"#e8c97e"}}>Editar Ficha</span>
          <button onClick={onClose} className="font-mono text-lg" style={{color:"#5a7a9a"}}>×</button>
        </div>
        <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([
              {label:"Telefone",  val:phone,       set:setPhone},
              {label:"DNA",       val:dna,         set:setDna},
              {label:"Digital",   val:fingerprint, set:setFingerprint},
            ] as {label:string;val:string;set:(v:string)=>void}[]).map(({label,val,set})=>(
              <div key={label}>
                <label className="block font-mono text-[10px] tracking-[1px] uppercase mb-1" style={{color:"#5a7a9a"}}>{label}</label>
                <input value={val} onChange={(e)=>set(e.target.value)} placeholder="—" style={inputStyle} onFocus={focus} onBlur={blur}/>
              </div>
            ))}
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-mono text-[10px] tracking-[1px] uppercase" style={{color:"#5a7a9a"}}>Armamentos</label>
              <button onClick={addWeapon} className="font-mono text-[10px] tracking-[1px] uppercase px-2 py-1 rounded"
                style={{background:"#1c2a3a",color:"#e8c97e",border:"1px solid #e8c97e44"}}>+ Adicionar</button>
            </div>
            <div className="space-y-2">
              {weapons.length === 0 && (
                <p className="font-mono text-[11px] text-center py-2" style={{color:"#3a4a5a"}}>Nenhum armamento cadastrado</p>
              )}
              {weapons.map((w, i) => (
                <div key={i} className="grid gap-2 items-center" style={{gridTemplateColumns:"1fr 1fr 28px"}}>
                  <select value={w.class} onChange={(e)=>updateWeapon(i,"class",e.target.value)}
                    style={inputStyle} onFocus={focus} onBlur={blur}>
                    {WEAPON_CLASSES.map((c)=>(
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <input value={w.serial} onChange={(e)=>updateWeapon(i,"serial",e.target.value)}
                    placeholder="Número de série" style={inputStyle} onFocus={focus} onBlur={blur}/>
                  <button onClick={()=>removeWeapon(i)}
                    className="font-mono text-sm font-bold rounded flex items-center justify-center"
                    style={{height:36,width:28,background:"#2a1010",color:"#e24b4a",border:"1px solid #e24b4a44"}}>×</button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-[1px] uppercase mb-1" style={{color:"#5a7a9a"}}>Notas</label>
            <textarea value={notes} onChange={(e)=>setNotes(e.target.value)} rows={4}
              placeholder="Anotações livres sobre o oficial..."
              style={{...inputStyle,resize:"vertical"}} onFocus={focus} onBlur={blur}/>
          </div>
          {error && <p className="font-mono text-[11px]" style={{color:"#e24b4a"}}>{error}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 font-mono text-[11px] uppercase py-2 rounded" style={{background:"#1c2a3a",color:"#5a7a9a"}}>Cancelar</button>
            <button onClick={save} disabled={saving} className="flex-1 font-mono text-[11px] uppercase py-2 rounded font-semibold"
              style={{background:"#e8c97e",color:"#0a0d12",opacity:saving?0.6:1}}>
              {saving?"Salvando...":"Salvar Ficha"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Role Call Request Modal ────────────────────────────────────────────────

function RoleCallModal({ officer, onClose }: {
  officer: Officer; onClose: () => void;
}) {
  const [type,       setType]       = useState<RoleCallType>("PROMOTION");
  const [value,      setValue]      = useState("");
  const [badgeValue, setBadgeValue] = useState("");
  const [reason,     setReason]     = useState("");
  const [absenceDate, setAbsenceDate] = useState("");
  const [saving,     setSaving]     = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState<string|null>(null);

  const TYPE_OPTS: { value: RoleCallType; label: string; accent: string }[] = [
    { value:"PROMOTION",   label:"Promoção",   accent:"#c084fc" },
    { value:"UNIT",        label:"Unidade",    accent:"#4a90e2" },
    { value:"BADGE",       label:"Badge",      accent:"#e8c97e" },
    { value:"STATUS",      label:"Status",     accent:"#3dd68c" },
    { value:"ABSENCE",     label:"Ausência",   accent:"#f97316" },
    { value:"RESIGNATION", label:"Demissão",   accent:"#e24b4a" },
  ];

  const accent = TYPE_OPTS.find((t)=>t.value===type)?.accent ?? "#e8c97e";

  const canSubmit = type === "RESIGNATION"
    ? true
    : type === "ABSENCE"
      ? !!absenceDate
      : !!value;

  async function submit() {
    if (!canSubmit) return;
    setSaving(true); setError(null);
    try {
      let requestedValue = value;
      let submitReason = reason.trim() || null;

      if (type === "RESIGNATION") {
        requestedValue = "DEMISSÃO";
      } else if (type === "ABSENCE") {
        requestedValue = absenceDate;
        if (reason.trim()) {
          submitReason = reason.trim();
        }
      }

      const requests: Promise<unknown>[] = [
        api.post(`/rolecall/officers/${officer.id}`, {
          type, requestedValue, reason: submitReason,
        }),
      ];
      if (type === "PROMOTION" && badgeValue.trim()) {
        requests.push(api.post(`/rolecall/officers/${officer.id}`, {
          type: "BADGE", requestedValue: badgeValue.trim(), reason: submitReason,
        }));
      }
      await Promise.all(requests);
      setDone(true);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Erro ao enviar"); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{background:"rgba(0,0,0,0.8)"}}
      onClick={(e)=>e.target===e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-lg overflow-hidden" style={{background:"#0d1117",border:"1px solid #1c2a3a"}}>
        <div className="px-4 py-3 flex items-center justify-between" style={{borderBottom:"1px solid #1c2a3a"}}>
          <span className="font-mono text-[11px] tracking-[1.5px] uppercase" style={{color:"#e8c97e"}}>
            Nova Solicitação · Role Call
          </span>
          <button onClick={onClose} className="font-mono text-lg" style={{color:"#5a7a9a"}}>×</button>
        </div>

        {done ? (
          <div className="p-6 text-center space-y-3">
            <div className="font-mono text-2xl" style={{color:"#3dd68c"}}>✓</div>
            <p className="font-mono text-sm" style={{color:"#c8d6e5"}}>Solicitação enviada!</p>
            <p className="font-mono text-[10px]" style={{color:"#5a7a9a"}}>
              Um Sergeant+ irá revisar em breve.
            </p>
            <button onClick={onClose}
              className="font-mono text-[11px] uppercase px-4 py-2 rounded"
              style={{background:"#1c2a3a",color:"#5a7a9a"}}>Fechar</button>
          </div>
        ) : (
          <div className="p-4 space-y-4">

            {/* Tipo */}
            <div>
              <label className="block font-mono text-[10px] tracking-[1px] uppercase mb-2" style={{color:"#5a7a9a"}}>
                Tipo de solicitação
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TYPE_OPTS.map((t) => (
                  <button key={t.value} type="button" onClick={() => { setType(t.value); setValue(""); setBadgeValue(""); setAbsenceDate(""); }}
                    className="font-mono text-[10px] tracking-[1px] uppercase py-2 rounded text-left px-3"
                    style={{
                      background: type===t.value ? `${t.accent}18` : "#0a0d12",
                      color:      type===t.value ? t.accent : "#5a7a9a",
                      border:     type===t.value ? `1px solid ${t.accent}66` : "1px solid #1c2a3a",
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Valor */}
            {type !== "RESIGNATION" && type !== "ABSENCE" && (
              <div>
                <label className="block font-mono text-[10px] tracking-[1px] uppercase mb-1" style={{color:"#5a7a9a"}}>
                  {type === "PROMOTION" ? "Nova patente" :
                   type === "UNIT"      ? "Unidade"      :
                   type === "BADGE"     ? "Número da badge" : "Novo status"}
                </label>

                {type === "PROMOTION" && (
                  <>
                    <select value={value} onChange={(e) => { setValue(e.target.value); setBadgeValue(""); }} style={inputStyle} onFocus={focus} onBlur={blur}>
                      <option value="">Selecione...</option>
                      {ALL_RANKS.map((r) => (
                        <option key={r} value={r}>{RANK_LABEL[r]}</option>
                      ))}
                    </select>
                    {value && (() => {
                      const tier = tierForRank(value as PoliceRank);
                      if (!tier) return null;
                      const badgeNum = parseInt(badgeValue);
                      const badgeValid = badgeValue.trim() && !isNaN(badgeNum) && badgeNum >= tier.min && badgeNum <= tier.max;
                      const badgeOutOfRange = badgeValue.trim() && !isNaN(badgeNum) && (badgeNum < tier.min || badgeNum > tier.max);
                      return (
                        <>
                          <div className="mt-2 px-3 py-2.5 rounded-lg flex items-center justify-between gap-3"
                            style={{ background: `${tier.accent}10`, border: `1px solid ${tier.accent}44` }}>
                            <div>
                              <div className="font-mono text-[9px] tracking-[1px] uppercase mb-0.5" style={{ color: tier.accent }}>
                                Badge compatível com {RANK_LABEL[value as PoliceRank]}
                              </div>
                              <div className="font-mono text-base font-bold" style={{ color: tier.accent }}>
                                {tier.min} – {tier.max}
                              </div>
                            </div>
                            <div className="flex gap-1.5 flex-wrap justify-end">
                              {[tier.min, Math.floor((tier.min + tier.max) / 2), tier.max].map((n) => (
                                <button key={n} type="button"
                                  onClick={() => setBadgeValue(String(n))}
                                  className="font-mono text-[10px] px-2 py-0.5 rounded transition-all"
                                  style={{
                                    background: badgeValue === String(n) ? tier.accent : `${tier.accent}20`,
                                    color:      badgeValue === String(n) ? "#0a0d12"  : tier.accent,
                                    border: `1px solid ${tier.accent}44`,
                                  }}>
                                  #{n}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="mt-2">
                            <label className="block font-mono text-[10px] tracking-[1px] uppercase mb-1" style={{ color: "#5a7a9a" }}>
                              Número de badge <span style={{ color: "#3a4a5a" }}>(opcional)</span>
                            </label>
                            <input
                              type="number"
                              min={tier.min} max={tier.max}
                              value={badgeValue}
                              onChange={(e) => setBadgeValue(e.target.value)}
                              placeholder={`${tier.min} – ${tier.max}`}
                              style={{
                                ...inputStyle,
                                borderColor: badgeOutOfRange ? "#e24b4a" : badgeValid ? tier.accent : undefined,
                              }}
                              onFocus={focus} onBlur={blur}
                            />
                            {badgeOutOfRange && (
                              <p className="font-mono text-[10px] mt-1" style={{ color: "#e24b4a" }}>
                                Fora do range {tier.min}–{tier.max} para {RANK_LABEL[value as PoliceRank]}
                              </p>
                            )}
                            {badgeValid && (
                              <p className="font-mono text-[10px] mt-1" style={{ color: tier.accent }}>
                                ✓ Badge #{badgeNum} será solicitada junto com a promoção
                              </p>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </>
                )}
                {type === "UNIT" && (
                  <select value={value} onChange={(e)=>setValue(e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur}>
                    <option value="">Selecione...</option>
                    <option value="">Sem unidade</option>
                    {ALL_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                )}
                {type === "BADGE" && (
                  <input type="number" min={100} max={999} value={value}
                    onChange={(e)=>setValue(e.target.value)}
                    placeholder="Ex: 742"
                    style={inputStyle} onFocus={focus} onBlur={blur}/>
                )}
                {type === "STATUS" && (
                  <select value={value} onChange={(e)=>setValue(e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur}>
                    <option value="">Selecione...</option>
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Ausência — data de retorno */}
            {type === "ABSENCE" && (
              <div>
                <label className="block font-mono text-[10px] tracking-[1px] uppercase mb-1" style={{color:"#f97316"}}>
                  Data prevista de retorno
                </label>
                <input
                  type="date"
                  value={absenceDate}
                  onChange={(e) => setAbsenceDate(e.target.value)}
                  style={inputStyle}
                  onFocus={focus} onBlur={blur}
                />
                <p className="font-mono text-[10px] mt-1.5" style={{color:"#5a7a9a"}}>
                  Seu status será alterado para Ausente até a data informada.
                </p>
              </div>
            )}

            {/* Demissão — aviso */}
            {type === "RESIGNATION" && (
              <div className="p-3 rounded-lg" style={{background:"#2a101018",border:"1px solid #e24b4a33"}}>
                <p className="font-mono text-[11px] leading-relaxed" style={{color:"#e24b4a"}}>
                  Ao solicitar demissão, seu status será alterado para Inativo após aprovação.
                  Esta ação é irreversível.
                </p>
              </div>
            )}

            {/* Motivo */}
            <div>
              <label className="block font-mono text-[10px] tracking-[1px] uppercase mb-1" style={{color:"#5a7a9a"}}>
                Motivo {type !== "RESIGNATION" && <span style={{color:"#3a4a5a"}}>(opcional)</span>}
              </label>
              <textarea value={reason} onChange={(e)=>setReason(e.target.value)} rows={2}
                placeholder={type === "RESIGNATION" ? "Motivo da demissão..." : type === "ABSENCE" ? "Motivo da ausência..." : "Justificativa da solicitação..."}
                style={{...inputStyle,resize:"none"}} onFocus={focus} onBlur={blur}/>
            </div>

            {error && <p className="font-mono text-[11px]" style={{color:"#e24b4a"}}>{error}</p>}

            <div className="flex gap-2">
              <button onClick={onClose}
                className="flex-1 font-mono text-[11px] uppercase py-2.5 rounded"
                style={{background:"#1c2a3a",color:"#5a7a9a"}}>Cancelar</button>
              <button onClick={submit} disabled={saving||!canSubmit}
                className="flex-1 font-mono text-[11px] uppercase py-2.5 rounded font-semibold"
                style={{background:accent,color:"#0a0d12",opacity:saving||!canSubmit?0.6:1}}>
                {saving?"Enviando...":"Enviar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ASD Section ───────────────────────────────────────────────────────────

function AsdSection({ asd }: { asd: AsdProfile }) {
  const ASD_STATUS_LABEL: Record<string, { label: string; color: string }> = {
    ACTIVE:   { label: "Ativo",        color: "#3dd68c" },
    INACTIVE: { label: "Inativo",      color: "#5a7a9a" },
    SUSPENDED:{ label: "Suspenso",     color: "#e24b4a" },
    TRAINING: { label: "Treinamento",  color: "#e8c97e" },
  };

  const hours   = Math.floor(asd.flightMinutes / 60);
  const minutes = asd.flightMinutes % 60;
  const status  = asd.asdStatus ? (ASD_STATUS_LABEL[asd.asdStatus] ?? { label: asd.asdStatus, color: "#5a7a9a" }) : null;

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #4a90e244" }}>
      <div className="px-4 py-2.5 flex items-center justify-between"
        style={{ borderBottom: "1px solid #1c2a3a", borderLeft: "3px solid #4a90e2" }}>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] tracking-[1.5px] uppercase" style={{ color: "#4a90e2" }}>
            Air Support Division
          </span>
          {status && (
            <span className="font-mono text-[9px] tracking-[1px] uppercase px-2 py-0.5 rounded"
              style={{ background: status.color + "18", color: status.color, border: `1px solid ${status.color}44` }}>
              {status.label}
            </span>
          )}
        </div>
      </div>
      <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Rank ASD",   value: asd.asdRank ?? "—",               color: "#4a90e2" },
          { label: "Callsign",   value: asd.asdCallsign ?? "—",           color: "#c8d6e5" },
          { label: "Horas voo",  value: `${hours}h ${minutes.toString().padStart(2,"0")}m`, color: "#3dd68c" },
          { label: "Score",      value: String(asd.accumulatedScore),      color: "#e8c97e" },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div className="font-mono text-[9px] tracking-[1.5px] uppercase mb-1" style={{ color: "#5a7a9a" }}>{label}</div>
            <div className="font-mono text-sm font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function OfficerProfilePage() {
  const { id }   = useParams<{ id: string }>();
  const { user } = useAuth();
  const router   = useRouter();

  const [officer,        setOfficer]        = useState<Officer | null>(null);
  const [myOfficer,      setMyOfficer]      = useState<Officer | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [showEdit,       setShowEdit]       = useState(false);
  const [showFicha,      setShowFicha]      = useState(false);
  const [showRoleCall,   setShowRoleCall]   = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Officer>(`/officers/${id}`),
      api.get<Officer>("/officers/me", 60).catch(() => null),
    ]).then(([o, me]) => {
      setOfficer(o);
      setMyOfficer(me);
    }).catch(() => setOfficer(null))
      .finally(() => setLoading(false));
  }, [id]);

  const myLevel      = myOfficer ? (RANK_ORDER[myOfficer.rank] ?? 0) : 0;
  const isOwnProfile = !!officer && !!myOfficer && officer.id === myOfficer.id;
  const canEditFicha   = isOwnProfile || (myLevel >= 9 && !!officer && RANK_ORDER[officer.rank] < myLevel);
  const canEditProfile = isOwnProfile;
  const canRoleCall    = isOwnProfile;
  const canDelete      = (user?.role === "LEAD" || user?.role === "ADM") && !isOwnProfile;

  if (loading) {
    return (
      <div className="p-3 md:p-6 space-y-4 min-h-full" style={{background:"#0a0d12"}}>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full shrink-0" style={{background:"#1c2a3a"}} />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-40 rounded" style={{background:"#1c2a3a"}} />
            <div className="h-4 w-24 rounded" style={{background:"#1c2a3a"}} />
          </div>
        </div>
      </div>
    );
  }

  if (!officer) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-3" style={{background:"#0a0d12"}}>
        <span className="font-mono text-[11px] tracking-[2px] uppercase" style={{color:"#e24b4a"}}>Oficial não encontrado</span>
        <button onClick={() => router.push("/police/roster")}
          className="font-mono text-[10px] uppercase px-4 py-2 rounded" style={{background:"#1c2a3a",color:"#5a7a9a"}}>
          Voltar
        </button>
      </div>
    );
  }

  const rs      = getRankStyle(officer.rank);
  const ss      = STATUS_STYLES[officer.status];
  const initials = (officer.callsign || officer.fullName).slice(0, 2).toUpperCase();

  return (
    <div className="p-3 md:p-6 space-y-4 min-h-full" style={{background:"#0a0d12"}}>

      {showEdit && (
        <EditProfileModal officer={officer} onClose={()=>setShowEdit(false)}
          onSaved={(o)=>{ setOfficer(o); setShowEdit(false); }} />
      )}
      {showFicha && (
        <FichaModal officer={officer} onClose={()=>setShowFicha(false)}
          onSaved={(o)=>{ setOfficer(o); setShowFicha(false); }} />
      )}
      {showRoleCall && (
        <RoleCallModal officer={officer} onClose={()=>setShowRoleCall(false)} />
      )}
      <ConfirmModal
        open={confirmDelete}
        title="Remover Membro"
        description={`O oficial ${officer.callsign || officer.fullName} e todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.`}
        confirmLabel="Remover"
        onConfirm={async () => {
          try {
            await api.delete(`/officers/${officer.id}`);
            router.push("/police/roster");
          } catch { /* handled by UI */ }
          finally { setConfirmDelete(false); }
        }}
        onCancel={() => setConfirmDelete(false)}
      />

      {/* Back */}
      <button onClick={()=>router.push("/police/roster")}
        className="font-mono text-[10px] tracking-[1.5px] uppercase" style={{color:"#5a7a9a"}}
        onMouseEnter={(e)=>(e.currentTarget.style.color="#e8c97e")}
        onMouseLeave={(e)=>(e.currentTarget.style.color="#5a7a9a")}>
        ← Roster
      </button>

      {/* Hero card */}
      <div className="rounded-lg p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center"
        style={{background:"#0d1117",border:"1px solid #1c2a3a"}}>

        {officer.profileImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={officer.profileImageUrl} alt={officer.callsign}
            className="rounded-full object-cover shrink-0"
            style={{width:80,height:80,border:`2px solid ${rs.color}44`}} />
        ) : (
          <div className="rounded-full flex items-center justify-center font-mono font-bold text-2xl shrink-0"
            style={{width:80,height:80,background:rs.bg,color:rs.color,border:`2px solid ${rs.border}`}}>
            {initials}
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <div className="font-mono text-2xl font-bold leading-none" style={{color:rs.color}}>
              {officer.callsign || "—"}
              {officer.badgeNumber != null && (
                <span className="text-base font-normal ml-3" style={{color:"#5a7a9a"}}>#{officer.badgeNumber}</span>
              )}
            </div>
            <div className="font-mono text-sm mt-0.5" style={{color:"#c8d6e5"}}>{officer.fullName}</div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[9px] font-mono tracking-[1px] uppercase px-2 py-1 rounded"
              style={{background:rs.bg,color:rs.color,border:`1px solid ${rs.border}`}}>
              {RANK_LABEL[officer.rank]}
            </span>
            {(officer.unitNames && officer.unitNames.length > 0) ? officer.unitNames.map((u) => {
              const us = UNIT_STYLES[u as PoliceUnit];
              return (
                <span key={u} className="text-[9px] font-mono tracking-[1px] uppercase px-2 py-1 rounded"
                  style={{background:us?.bg,color:us?.color,border:`1px solid ${us?.border}`}}>
                  {u}
                </span>
              );
            }) : (
              <span className="text-[9px] font-mono tracking-[1px] uppercase px-2 py-1 rounded"
                style={{background:"#1a1c2a",color:"#5a7a9a",border:"1px solid #2a3a5a44"}}>
                LSPD
              </span>
            )}
            <span className="text-[9px] font-mono tracking-[1px] uppercase px-2 py-1 rounded"
              style={{background:ss.bg,color:ss.color,border:`1px solid ${ss.color}44`}}>
              {ss.label}
            </span>
          </div>
          <div className="font-mono text-[10px] tracking-[1px] uppercase" style={{color:"#5a7a9a"}}>
            Contratado · {officer.employer || "Los Santos Police Department"}
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-2 shrink-0">
          {canRoleCall && (
            <button onClick={()=>setShowRoleCall(true)}
              className="font-mono text-[10px] tracking-[1px] uppercase px-3 py-2 rounded"
              style={{background:"#1a1020",color:"#c084fc",border:"1px solid #c084fc44"}}>
              + Role Call
            </button>
          )}
          {canEditProfile && (
            <button onClick={()=>setShowEdit(true)}
              className="font-mono text-[10px] tracking-[1px] uppercase px-3 py-2 rounded"
              style={{background:"#1c2a3a",color:"#4a90e2",border:"1px solid #4a90e233"}}>
              Editar Perfil
            </button>
          )}
          {canEditFicha && (
            <button onClick={()=>setShowFicha(true)}
              className="font-mono text-[10px] tracking-[1px] uppercase px-3 py-2 rounded"
              style={{background:"#1c2a3a",color:"#e8c97e",border:"1px solid #e8c97e33"}}>
              Editar Ficha
            </button>
          )}
          {canDelete && (
            <button onClick={()=>setConfirmDelete(true)}
              className="font-mono text-[10px] tracking-[1px] uppercase px-3 py-2 rounded"
              style={{background:"#1a0a0a",color:"#e24b4a",border:"1px solid #e24b4a33"}}>
              Remover Membro
            </button>
          )}
        </div>
      </div>

      {/* Ficha + Armamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="rounded-lg overflow-hidden" style={{background:"#0d1117",border:"1px solid #1c2a3a"}}>
          <div className="px-4 py-2.5" style={{borderBottom:"1px solid #1c2a3a",borderLeft:"3px solid #4a90e2"}}>
            <span className="font-mono text-[11px] tracking-[1.5px] uppercase" style={{color:"#4a90e2"}}>Identificação</span>
          </div>
          <div className="px-4 py-3 space-y-3">
            {([
              { label:"Badge",    value: officer.badgeNumber != null ? `#${officer.badgeNumber}` : null, accent:rs.color },
              { label:"Telefone", value: officer.phone,                                                  accent:"#c8d6e5" },
              { label:"DNA",      value: officer.dna,                                                    accent:"#c8d6e5" },
              { label:"Digital",  value: officer.fingerprint,                                            accent:"#c8d6e5" },
            ] as {label:string;value:string|null;accent:string}[]).map(({label,value,accent})=>(
              <div key={label} className="flex items-center justify-between py-1.5"
                style={{borderBottom:"1px solid #111823"}}>
                <span className="font-mono text-[10px] tracking-[1px] uppercase" style={{color:"#5a7a9a"}}>{label}</span>
                <span className="font-mono text-sm font-bold" style={{color: value ? accent : "#3a4a5a"}}>
                  {value ?? "—"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg overflow-hidden" style={{background:"#0d1117",border:"1px solid #1c2a3a"}}>
          <div className="px-4 py-2.5 flex items-center justify-between"
            style={{borderBottom:"1px solid #1c2a3a",borderLeft:"3px solid #e24b4a"}}>
            <span className="font-mono text-[11px] tracking-[1.5px] uppercase" style={{color:"#e24b4a"}}>Armamentos</span>
            <span className="font-mono text-[10px]" style={{color:"#5a7a9a"}}>
              {officer.weapons?.length ?? 0} reg.
            </span>
          </div>
          <div className="px-4 py-2">
            {!officer.weapons || officer.weapons.length === 0 ? (
              <p className="py-8 text-center font-mono text-[11px] tracking-[2px] uppercase" style={{color:"#5a7a9a"}}>
                Nenhum armamento registrado
              </p>
            ) : (
              officer.weapons.map((w, i) => {
                const wc = WEAPON_CLASSES.find((c)=>c.value===w.class);
                const color = WEAPON_COLOR[w.class];
                return (
                  <div key={i} className="flex items-center justify-between py-2.5"
                    style={{borderBottom: i<officer.weapons.length-1 ? "1px solid #111823":"none"}}>
                    <div>
                      <div className="font-mono text-[11px] font-bold" style={{color}}>{wc?.label ?? w.class}</div>
                      <div className="font-mono text-[10px] mt-0.5" style={{color:"#5a7a9a"}}>S/N: {w.serial || "—"}</div>
                    </div>
                    <span className="text-[9px] font-mono tracking-[1px] uppercase px-2 py-0.5 rounded"
                      style={{background:color+"18",color,border:`1px solid ${color}44`}}>
                      {w.class.replace("_"," ")}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {(officer.notes || canEditFicha) && (
        <div className="rounded-lg overflow-hidden" style={{background:"#0d1117",border:"1px solid #1c2a3a"}}>
          <div className="px-4 py-2.5" style={{borderBottom:"1px solid #1c2a3a",borderLeft:"3px solid #a855f7"}}>
            <span className="font-mono text-[11px] tracking-[1.5px] uppercase" style={{color:"#a855f7"}}>Notas</span>
          </div>
          <div className="px-4 py-3">
            {officer.notes ? (
              <p className="font-mono text-sm whitespace-pre-wrap" style={{color:"#c8d6e5",lineHeight:1.7}}>
                {officer.notes}
              </p>
            ) : (
              <p className="font-mono text-[11px] tracking-[2px] uppercase text-center py-4" style={{color:"#5a7a9a"}}>
                Nenhuma nota registrada
              </p>
            )}
          </div>
        </div>
      )}

      {officer.asd && <AsdSection asd={officer.asd} />}

    </div>
  );
}
