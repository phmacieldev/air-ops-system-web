"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Officer, PoliceRank, PoliceUnit } from "@/types";

const RANK_OPTIONS: { value: PoliceRank; label: string }[] = [
  { value: "CADET",           label: "Cadet"          },
  { value: "SOLO_CADET",      label: "Solo Cadet"     },
  { value: "OFFICER",         label: "Officer"        },
  { value: "OFFICER_1",       label: "Officer I"      },
  { value: "OFFICER_2",       label: "Officer II"     },
  { value: "OFFICER_3",       label: "Officer III"    },
  { value: "SENIOR_OFFICER",  label: "Senior Officer" },
  { value: "CORPORAL",        label: "Corporal"       },
  { value: "SERGEANT",        label: "Sergeant"       },
  { value: "LIEUTENANT",      label: "Lieutenant"     },
  { value: "CAPTAIN",         label: "Captain"        },
  { value: "ASSISTANT_CHIEF", label: "Asst. Chief"    },
  { value: "CHIEF",           label: "Chief"          },
  { value: "COMMISSIONER",    label: "Commissioner"   },
];

const UNIT_OPTIONS: { value: PoliceUnit; label: string }[] = [
  { value: "CID",   label: "CID"   },
  { value: "HEAT",  label: "HEAT"  },
  { value: "ASD",   label: "ASD"   },
  { value: "METRO", label: "METRO" },
  { value: "MU",    label: "MU"    },
  { value: "FTO",   label: "FTO"   },
];

const inputBase: React.CSSProperties = {
  background: "#0a0d12",
  border: "1px solid #1c2a3a",
  borderRadius: "6px",
  padding: "9px 12px",
  color: "#c8d6e5",
  fontFamily: "monospace",
  fontSize: "13px",
  width: "100%",
  outline: "none",
};

function Field({ label, hint, optional, children }: {
  label: string; hint?: string; optional?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block font-mono text-[10px] tracking-[1.5px] uppercase" style={{ color: "#5a7a9a" }}>
        {label}
        {optional && <span className="ml-1 normal-case tracking-normal" style={{ color: "#3a4a5a" }}>(opcional)</span>}
      </label>
      {children}
      {hint && <p className="font-mono text-[9px]" style={{ color: "#5a7a9a" }}>{hint}</p>}
    </div>
  );
}

interface UserLookup {
  accountName: string;
  email: string;
  fullName: string | null;
  callsign: string | null;
  profileImageUrl: string | null;
  discordId: string | null;
}

export default function RegisterPage() {
  const { user } = useAuth();
  const router   = useRouter();

  // Oficial
  const [fullName,        setFullName]        = useState("");
  const [callsign,        setCallsign]        = useState("");
  const [discordId,       setDiscordId]       = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [rank,            setRank]            = useState<PoliceRank>("CADET");
  const [unit,            setUnit]            = useState<PoliceUnit | "">("");

  // Autocomplete de oficiais existentes
  const [existingOfficers,   setExistingOfficers]   = useState<Officer[]>([]);
  const [officerSuggestions, setOfficerSuggestions] = useState<Officer[]>([]);
  const [showSuggestions,    setShowSuggestions]    = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<Officer[]>("/officers").then(setExistingOfficers).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Modo
  const [mode, setMode] = useState<"new" | "link">("new");

  // Nova conta
  const [name,         setName]         = useState("");
  const [nameLinked,   setNameLinked]   = useState(true);
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Vincular existente
  const [existingEmail,  setExistingEmail]  = useState("");
  const [lookupResult,   setLookupResult]   = useState<UserLookup | null>(null);
  const [lookupLoading,  setLookupLoading]  = useState(false);
  const [lookupError,    setLookupError]    = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (user && user.role !== "LEAD" && user.role !== "SUPERVISOR" && user.role !== "ADM") {
    router.replace("/police/dashboard");
    return null;
  }

  function onFullNameChange(val: string) {
    setFullName(val);
    if (nameLinked) setName(val);
    if (val.trim().length > 0) {
      const lower = val.toLowerCase();
      const filtered = existingOfficers.filter((o) =>
        o.fullName.toLowerCase().includes(lower)
      );
      setOfficerSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }

  function selectOfficerSuggestion(officer: Officer) {
    setFullName(officer.fullName);
    if (nameLinked) setName(officer.fullName);
    if (officer.callsign)        setCallsign(officer.callsign);
    if (officer.discordId)       setDiscordId(officer.discordId);
    if (officer.profileImageUrl) setProfileImageUrl(officer.profileImageUrl);
    setRank(officer.rank);
    if (officer.unitNames && officer.unitNames.length > 0) setUnit(officer.unitNames[0] as PoliceUnit);
    setShowSuggestions(false);
  }
  function onNameChange(val: string) {
    setName(val);
    setNameLinked(val === fullName);
  }

  function focus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    e.currentTarget.style.borderColor = "#e8c97e";
  }
  function blur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    e.currentTarget.style.borderColor = "#1c2a3a";
  }

  async function lookup() {
    if (!existingEmail.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);
    try {
      const result = await api.get<UserLookup>(`/users/lookup?email=${encodeURIComponent(existingEmail.trim())}`);
      setLookupResult(result);
      // Preenche automaticamente os campos com os dados encontrados
      if (result.fullName)        setFullName(result.fullName);
      if (result.callsign)        setCallsign(result.callsign);
      if (result.discordId)       setDiscordId(result.discordId);
      if (result.profileImageUrl) setProfileImageUrl(result.profileImageUrl);
    } catch {
      setLookupError("Usuário não encontrado com este email.");
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const userEmail = mode === "new" ? email : existingEmail.trim();

      if (mode === "new") {
        await api.post("/auth/register", { name: name || fullName, email, password });
      }

      await api.post("/officers", {
        fullName,
        callsign:        callsign.trim() || null,
        discordId:       discordId.trim() || null,
        profileImageUrl: profileImageUrl.trim() || null,
        rank,
        unit:            unit || null,
        userEmail:       userEmail || null,
      });
      setSuccess(true);
      setTimeout(() => router.push("/police/roster"), 1800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar oficial");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-8" style={{ background: "#0a0d12" }}>
      <div className="w-full max-w-lg space-y-5">

        {/* Header */}
        <div>
          <button onClick={() => router.back()}
            className="font-mono text-[10px] tracking-[1.5px] uppercase mb-4 flex items-center gap-1.5"
            style={{ color: "#5a7a9a" }}>
            ← Voltar
          </button>
          <p className="font-mono text-[10px] tracking-[3px] uppercase mb-1" style={{ color: "#5a7a9a" }}>
            Los Santos Police Department · Admin
          </p>
          <h1 className="font-mono text-2xl font-bold tracking-widest uppercase" style={{ color: "#e8c97e" }}>
            Cadastrar Oficial
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Modo de conta */}
          <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
            <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: "1px solid #1c2a3a" }}>
              <span className="font-mono text-[11px] tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>
                Acesso ao Sistema
              </span>
              <div className="flex rounded overflow-hidden" style={{ border: "1px solid #1c2a3a" }}>
                {(["new", "link"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => { setMode(m); setLookupResult(null); setLookupError(null); }}
                    className="font-mono text-[10px] tracking-[1px] uppercase px-3 py-1"
                    style={{ background: mode === m ? "#e8c97e" : "#0a0d12", color: mode === m ? "#0a0d12" : "#5a7a9a" }}>
                    {m === "new" ? "Nova conta" : "Já cadastrado"}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 space-y-3">
              {mode === "new" ? (
                <>
                  <Field label="Nome na conta"
                    hint={nameLinked ? "Preenchido automaticamente — altere se necessário" : undefined}>
                    <input type="text" required value={name} onChange={(e) => onNameChange(e.target.value)}
                      placeholder="John Doe"
                      style={{ ...inputBase, borderColor: nameLinked ? "#1c2a3a" : "#4a90e244" }}
                      onFocus={focus} onBlur={blur} />
                  </Field>
                  <Field label="Email *">
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@email.com" style={inputBase} onFocus={focus} onBlur={blur} />
                  </Field>
                  <Field label="Senha *">
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} required minLength={6}
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="mín. 6 caracteres"
                        style={{ ...inputBase, paddingRight: "72px" }}
                        onFocus={focus} onBlur={blur} />
                      <button type="button" onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px]"
                        style={{ color: showPassword ? "#e8c97e" : "#5a7a9a" }}>
                        {showPassword ? "ocultar" : "mostrar"}
                      </button>
                    </div>
                  </Field>
                </>
              ) : (
                <div className="space-y-3">
                  {/* Busca por email */}
                  <Field label="Email do usuário existente *">
                    <div className="flex gap-2">
                      <input type="email" required value={existingEmail}
                        onChange={(e) => { setExistingEmail(e.target.value); setLookupResult(null); setLookupError(null); }}
                        placeholder="email@existente.com"
                        style={{ ...inputBase, flex: 1 }}
                        onFocus={focus} onBlur={blur} />
                      <button type="button" onClick={lookup} disabled={lookupLoading || !existingEmail.trim()}
                        className="font-mono text-[11px] tracking-[1px] uppercase px-3 py-2 rounded shrink-0"
                        style={{ background: "#1c2a3a", color: "#e8c97e", border: "1px solid #e8c97e44",
                          opacity: lookupLoading || !existingEmail.trim() ? 0.5 : 1 }}>
                        {lookupLoading ? "..." : "Buscar"}
                      </button>
                    </div>
                  </Field>

                  {lookupError && (
                    <p className="font-mono text-[11px] px-3 py-2 rounded"
                      style={{ background: "#2a1010", color: "#e24b4a", border: "1px solid #e24b4a33" }}>
                      {lookupError}
                    </p>
                  )}

                  {lookupResult && (
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded"
                      style={{ background: "#0a2a14", border: "1px solid #3dd68c33" }}>
                      {lookupResult.profileImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={lookupResult.profileImageUrl} alt=""
                          className="w-9 h-9 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-sm shrink-0"
                          style={{ background: "#1c2a3a", color: "#3dd68c" }}>
                          {lookupResult.accountName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-mono text-sm font-bold truncate" style={{ color: "#3dd68c" }}>
                          ✓ {lookupResult.accountName}
                        </div>
                        <div className="font-mono text-[10px]" style={{ color: "#5a7a9a" }}>
                          {lookupResult.fullName
                            ? `Piloto ASD: ${lookupResult.fullName}${lookupResult.callsign ? ` · ${lookupResult.callsign}` : ""}`
                            : "Usuário encontrado — dados importados abaixo"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Dados do Oficial — só mostra após lookup no modo link, ou sempre no modo new */}
          {(mode === "new" || lookupResult) && (
            <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
              <div className="px-4 py-2.5" style={{ borderBottom: "1px solid #1c2a3a" }}>
                <span className="font-mono text-[11px] tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>
                  Dados do Oficial
                </span>
              </div>
              <div className="p-4 space-y-3">

                <Field label="Nome completo *">
                  <div className="relative" ref={suggestionsRef}>
                    <input
                      type="text" required value={fullName}
                      onChange={(e) => onFullNameChange(e.target.value)}
                      onFocus={(e) => {
                        focus(e);
                        if (officerSuggestions.length > 0) setShowSuggestions(true);
                      }}
                      placeholder="John Doe" style={inputBase}
                      onBlur={blur}
                      autoComplete="off"
                    />
                    {showSuggestions && (
                      <div
                        style={{
                          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                          background: "#0d1117", border: "1px solid #e8c97e55",
                          borderRadius: "6px", zIndex: 50, maxHeight: "200px", overflowY: "auto",
                        }}
                      >
                        {officerSuggestions.map((o) => (
                          <button
                            key={o.id}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); selectOfficerSuggestion(o); }}
                            style={{
                              display: "flex", alignItems: "center", gap: "10px",
                              width: "100%", padding: "8px 12px", textAlign: "left",
                              background: "transparent", border: "none", cursor: "pointer",
                              borderBottom: "1px solid #1c2a3a",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#1c2a3a")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            {o.profileImageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={o.profileImageUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0"
                                style={{ background: "#1c2a3a", color: "#e8c97e" }}>
                                {o.fullName.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-mono text-[12px]" style={{ color: "#c8d6e5" }}>{o.fullName}</div>
                              {o.callsign && (
                                <div className="font-mono text-[10px]" style={{ color: "#5a7a9a" }}>{o.callsign}</div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Callsign" optional>
                    <input type="text" value={callsign} onChange={(e) => setCallsign(e.target.value)}
                      placeholder="XXX" style={inputBase} onFocus={focus} onBlur={blur} />
                  </Field>
                  <Field label="Patente *">
                    <select value={rank} onChange={(e) => setRank(e.target.value as PoliceRank)}
                      style={{ ...inputBase, cursor: "pointer" }} onFocus={focus} onBlur={blur}>
                      {RANK_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Unidade" optional>
                    <select value={unit} onChange={(e) => setUnit(e.target.value as PoliceUnit | "")}
                      style={{ ...inputBase, cursor: "pointer" }} onFocus={focus} onBlur={blur}>
                      <option value="">Sem unidade</option>
                      {UNIT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Discord ID" optional>
                    <input type="text" value={discordId} onChange={(e) => setDiscordId(e.target.value)}
                      placeholder="123456789" style={inputBase} onFocus={focus} onBlur={blur} />
                  </Field>
                </div>

                <Field label="URL da foto de perfil" optional>
                  <input type="url" value={profileImageUrl} onChange={(e) => setProfileImageUrl(e.target.value)}
                    placeholder="https://..." style={inputBase} onFocus={focus} onBlur={blur} />
                </Field>

                {mode === "link" && lookupResult?.fullName && (
                  <p className="font-mono text-[9px]" style={{ color: "#5a7a9a" }}>
                    ↑ Dados importados do perfil ASD — edite se necessário
                  </p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div role="alert" className="font-mono text-[11px] px-3 py-2 rounded"
              style={{ background: "#2a0a0a", color: "#e24b4a", border: "1px solid #e24b4a33" }}>
              {error}
            </div>
          )}
          {success && (
            <div className="font-mono text-[11px] px-3 py-2 rounded"
              style={{ background: "#0a2a14", color: "#3dd68c", border: "1px solid #3dd68c33" }}>
              ✓ Oficial cadastrado com sucesso. Redirecionando para o Roster...
            </div>
          )}

          {(mode === "new" || lookupResult) && (
            <div className="flex gap-3">
              <button type="button" onClick={() => router.back()}
                className="flex-1 font-mono text-[12px] tracking-[1px] uppercase py-2.5 rounded"
                style={{ background: "#1c2a3a", color: "#5a7a9a" }}>
                Cancelar
              </button>
              <button type="submit" disabled={loading || success}
                className="flex-1 font-mono text-[12px] tracking-[1.5px] uppercase py-2.5 rounded font-semibold"
                style={{ background: "#e8c97e", color: "#0a0d12", opacity: (loading || success) ? 0.6 : 1 }}>
                {loading ? "Cadastrando..." : success ? "✓ Cadastrado" : "Cadastrar Oficial"}
              </button>
            </div>
          )}
        </form>

      </div>
    </div>
  );
}
