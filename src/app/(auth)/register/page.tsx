"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block font-mono text-[10px] tracking-[1.5px] uppercase" style={{ color: "#5a7a9a" }}>
        {label}
      </label>
      {children}
      {hint && (
        <p className="font-mono text-[9px]" style={{ color: "#3a5a7a" }}>{hint}</p>
      )}
    </div>
  );
}

export default function RegisterPage() {
  const { user } = useAuth();
  const router   = useRouter();

  if (user && user.role !== "LEAD" && user.role !== "SUPERVISOR") {
    router.replace("/dashboard");
    return null;
  }

  // Pilot fields (collected first)
  const [fullName,        setFullName]        = useState("");
  const [callsign,        setCallsign]        = useState("");
  const [discordId,       setDiscordId]       = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");

  // Account fields (name auto-synced from fullName)
  const [name,         setName]         = useState("");
  const [nameLinked,   setNameLinked]   = useState(true);
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function onFullNameChange(val: string) {
    setFullName(val);
    if (nameLinked) setName(val);
  }

  function onNameChange(val: string) {
    setName(val);
    // Re-link only if user types back the exact fullName value
    setNameLinked(val === fullName);
  }

  function focus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    e.currentTarget.style.borderColor = "#e8c97e";
  }
  function blur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    e.currentTarget.style.borderColor = "#1c2a3a";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/register", { name: name || fullName, email, password });
      await api.post("/pilots", {
        fullName,
        callsign,
        discordId,
        profileImageUrl: profileImageUrl || null,
        userEmail:       email,
      });
      setSuccess(true);
      setTimeout(() => router.push("/pilots"), 1800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar membro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-8" style={{ background: "#0a0d12" }}>
      <div className="w-full max-w-lg space-y-5">

        {/* Header */}
        <div>
          <button
            onClick={() => router.back()}
            className="font-mono text-[10px] tracking-[1.5px] uppercase mb-4 flex items-center gap-1.5"
            style={{ color: "#5a7a9a" }}
          >
            ← Voltar
          </button>
          <p className="font-mono text-[10px] tracking-[3px] uppercase mb-1" style={{ color: "#5a7a9a" }}>
            Air Support Division · Admin
          </p>
          <h1 className="font-mono text-2xl font-bold tracking-widest uppercase" style={{ color: "#e8c97e" }}>
            Cadastrar Membro
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Seção: Piloto (primeiro) */}
          <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
            <div className="px-4 py-2.5" style={{ borderBottom: "1px solid #1c2a3a" }}>
              <span className="font-mono text-[11px] tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>
                Dados do Piloto
              </span>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nome de piloto *">
                  <input type="text" required value={fullName} onChange={(e) => onFullNameChange(e.target.value)}
                    placeholder="John Doe" style={inputBase} onFocus={focus} onBlur={blur} />
                </Field>
                <Field label="Callsign / Matrícula *">
                  <input type="text" required value={callsign} onChange={(e) => setCallsign(e.target.value)}
                    placeholder="XXX" style={inputBase} onFocus={focus} onBlur={blur} />
                </Field>
              </div>
              <Field label="Discord ID *">
                <input type="text" required value={discordId} onChange={(e) => setDiscordId(e.target.value)}
                  placeholder="" style={inputBase} onFocus={focus} onBlur={blur} />
              </Field>
              <Field label="URL da foto de perfil (opcional)">
                <input type="url" value={profileImageUrl} onChange={(e) => setProfileImageUrl(e.target.value)}
                  placeholder="https://..." style={inputBase} onFocus={focus} onBlur={blur} />
              </Field>
              <p className="font-mono text-[9px]" style={{ color: "#3a5a7a" }}>
                Rank inicial: TRAINEE · Score: 0 · Pode ser alterado no perfil do piloto após o cadastro
              </p>
            </div>
          </div>

          {/* Seção: Conta (segundo) */}
          <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
            <div className="px-4 py-2.5" style={{ borderBottom: "1px solid #1c2a3a" }}>
              <span className="font-mono text-[11px] tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>
                Dados de Acesso
              </span>
            </div>
            <div className="p-4 space-y-3">
              <Field
                label="Nome na conta"
                hint={nameLinked ? "Preenchido automaticamente do nome de guerra — altere se necessário" : undefined}
              >
                <input type="text" required value={name} onChange={(e) => onNameChange(e.target.value)}
                  placeholder="Henry Schneider"
                  style={{ ...inputBase, borderColor: nameLinked ? "#1c2a3a" : "#4a90e244" }}
                  onFocus={focus} onBlur={blur} />
              </Field>
              <Field label="Email *">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="henry@email.com" style={inputBase} onFocus={focus} onBlur={blur} />
              </Field>
              <Field label="Senha *">
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="mín. 6 caracteres" style={inputBase} onFocus={focus} onBlur={blur} />
              </Field>
            </div>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="font-mono text-[11px] px-3 py-2 rounded"
              style={{ background: "#2a0a0a", color: "#e24b4a", border: "1px solid #e24b4a33" }}>
              {error}
            </div>
          )}

          {success && (
            <div className="font-mono text-[11px] px-3 py-2 rounded"
              style={{ background: "#0a2a14", color: "#3dd68c", border: "1px solid #3dd68c33" }}>
              ✓ Membro cadastrado com sucesso. Redirecionando...
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => router.back()}
              className="flex-1 font-mono text-[12px] tracking-[1px] uppercase py-2.5 rounded"
              style={{ background: "#1c2a3a", color: "#5a7a9a" }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading || success}
              className="flex-1 font-mono text-[12px] tracking-[1.5px] uppercase py-2.5 rounded font-semibold"
              style={{ background: "#e8c97e", color: "#0a0d12", opacity: (loading || success) ? 0.6 : 1 }}>
              {loading ? "Cadastrando..." : success ? "✓ Cadastrado" : "Cadastrar Membro"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
