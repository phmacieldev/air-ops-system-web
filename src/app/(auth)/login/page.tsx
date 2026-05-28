"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

const inputBase: React.CSSProperties = {
  background: "#0a0d12",
  border: "1px solid #1c2a3a",
  borderRadius: "6px",
  padding: "10px 12px",
  color: "#c8d6e5",
  fontFamily: "monospace",
  fontSize: "14px",
  width: "100%",
  outline: "none",
};

function borderFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = "#e8c97e";
  e.currentTarget.style.boxShadow   = "0 0 0 2px #e8c97e22";
}
function borderBlur(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = "#1c2a3a";
  e.currentTarget.style.boxShadow   = "none";
}

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post<{ token: string }>("/auth/login", { email, password });
      await login(res.token);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#0a0d12" }}
    >
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <svg width="60" height="66" viewBox="0 0 40 44" fill="none" aria-hidden="true">
            <path
              d="M20 2L4 8V22C4 32 11 40 20 43C29 40 36 32 36 22V8L20 2Z"
              fill="#1c2a3a" stroke="#e8c97e" strokeWidth="1.5"
            />
            <path
              d="M20 9L11 12.5V21C11 26.5 14.8 31.5 20 33.5C25.2 31.5 29 26.5 29 21V12.5L20 9Z"
              fill="#0d1117" stroke="#e8c97e44" strokeWidth="0.8"
            />
            <text
              x="20" y="25" textAnchor="middle"
              fontFamily="monospace" fontSize="10"
              fill="#e8c97e" letterSpacing="1"
            >
              ASD
            </text>
            <path d="M14 19L20 14L26 19" stroke="#e8c97e" strokeWidth="1.2" fill="none"/>
            <line x1="20" y1="14" x2="20" y2="28" stroke="#e8c97e" strokeWidth="1" strokeDasharray="2,2"/>
          </svg>

          <div className="text-center">
            <h1
              className="font-mono text-2xl font-bold tracking-widest uppercase"
              style={{ color: "#e8c97e" }}
            >
              Air Support Division
            </h1>
            <p
              className="font-mono text-[11px] tracking-[3px] uppercase mt-1"
              style={{ color: "#5a7a9a" }}
            >
              LSPD · Portal Interno
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-lg p-6 space-y-4"
          style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}
        >
          {/* Panel header */}
          <div
            className="pb-3"
            style={{ borderBottom: "1px solid #1c2a3a" }}
          >
            <span className="font-mono text-[11px] tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>
              Acesso Restrito
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-1">
              <label
                className="block font-mono text-[10px] tracking-[1.5px] uppercase"
                style={{ color: "#5a7a9a" }}
              >
                Email
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={inputBase}
                onFocus={borderFocus}
                onBlur={borderBlur}
              />
            </div>

            <div className="space-y-1">
              <label
                className="block font-mono text-[10px] tracking-[1.5px] uppercase"
                style={{ color: "#5a7a9a" }}
              >
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ ...inputBase, paddingRight: "40px" }}
                  onFocus={borderFocus}
                  onBlur={borderBlur}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] transition-colors"
                  style={{ color: showPassword ? "#e8c97e" : "#3a5a7a" }}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? "ocultar" : "mostrar"}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="font-mono text-[11px] px-3 py-2 rounded"
                style={{
                  background: "#2a0a0a",
                  color: "#e24b4a",
                  border: "1px solid #e24b4a33",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-mono text-[12px] tracking-[1.5px] uppercase py-2.5 rounded font-semibold transition-opacity"
              style={{
                background: "#e8c97e",
                color:      "#0a0d12",
                opacity:    loading ? 0.6 : 1,
                cursor:     loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Autenticando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p className="text-center font-mono text-[9px] tracking-[2px] uppercase" style={{ color: "#3a5a7a" }}>
          Acesso restrito a membros da ASD
        </p>

      </div>
    </div>
  );
}
