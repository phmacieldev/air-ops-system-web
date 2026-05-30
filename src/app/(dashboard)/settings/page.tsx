"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

const inputStyle: React.CSSProperties = {
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

function focusBorder(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = "#e8c97e";
}
function blurBorder(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = "#1c2a3a";
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block font-mono text-[10px] tracking-[1.5px] uppercase mb-1" style={{ color: "#c8d6e5" }}>
      {children}
    </label>
  );
}

function Feedback({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div role="alert" className="font-mono text-[11px] px-3 py-2 rounded"
      style={ok
        ? { background: "#0a2a14", color: "#3dd68c", border: "1px solid #3dd68c33" }
        : { background: "#2a0a0a", color: "#e24b4a", border: "1px solid #e24b4a33" }}>
      {msg}
    </div>
  );
}

// ── Change Email ──────────────────────────────────────────────────────────────

function ChangeEmailSection({ onNewToken }: { onNewToken: (t: string) => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail,         setNewEmail]         = useState("");
  const [saving,  setSaving]  = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await api.patch<{ token: string }>("/auth/email", { currentPassword, newEmail });
      onNewToken(res.token);
      setFeedback({ msg: "E-mail atualizado com sucesso.", ok: true });
      setCurrentPassword("");
      setNewEmail("");
    } catch (err: unknown) {
      setFeedback({ msg: err instanceof Error ? err.message : "Erro ao alterar e-mail.", ok: false });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label>Senha atual</Label>
        <input type="password" required value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
      </div>
      <div className="space-y-1">
        <Label>Novo e-mail</Label>
        <input type="email" required value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
      </div>
      {feedback && <Feedback msg={feedback.msg} ok={feedback.ok} />}
      <div className="flex justify-end">
        <button type="submit" disabled={saving}
          className="font-mono text-[11px] tracking-[1px] uppercase px-5 py-2 rounded font-bold"
          style={{ background: "#2a1f0a", color: "#e8c97e", border: "1px solid #e8c97e44", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Salvando..." : "Alterar E-mail"}
        </button>
      </div>
    </form>
  );
}

// ── Change Password ───────────────────────────────────────────────────────────

function ChangePasswordSection({ onNewToken }: { onNewToken: (t: string) => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,      setNewPassword]      = useState("");
  const [confirmPassword,  setConfirmPassword]  = useState("");
  const [saving,   setSaving]   = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setFeedback({ msg: "As senhas não coincidem.", ok: false });
      return;
    }
    if (newPassword.length < 8) {
      setFeedback({ msg: "A nova senha deve ter pelo menos 8 caracteres.", ok: false });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const res = await api.patch<{ token: string }>("/auth/password", { currentPassword, newPassword });
      onNewToken(res.token);
      setFeedback({ msg: "Senha alterada com sucesso.", ok: true });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setFeedback({ msg: err instanceof Error ? err.message : "Erro ao alterar senha.", ok: false });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label>Senha atual</Label>
        <input type="password" required value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
      </div>
      <div className="space-y-1">
        <Label>Nova senha</Label>
        <input type="password" required value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
      </div>
      <div className="space-y-1">
        <Label>Confirmar nova senha</Label>
        <input type="password" required value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
      </div>
      {feedback && <Feedback msg={feedback.msg} ok={feedback.ok} />}
      <div className="flex justify-end">
        <button type="submit" disabled={saving}
          className="font-mono text-[11px] tracking-[1px] uppercase px-5 py-2 rounded font-bold"
          style={{ background: "#2a1f0a", color: "#e8c97e", border: "1px solid #e8c97e44", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Salvando..." : "Alterar Senha"}
        </button>
      </div>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
      <div className="px-5 py-3" style={{ borderBottom: "1px solid #1c2a3a" }}>
        <span className="font-mono text-[11px] tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>
          {title}
        </span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, login } = useAuth();

  async function handleNewToken(token: string) {
    await login(token);
  }

  return (
    <div className="p-3 md:p-6 space-y-4 min-h-full" style={{ background: "#0a0d12" }}>

      <div>
        <p className="font-mono text-[10px] tracking-[3px] uppercase mb-1" style={{ color: "#5a7a9a" }}>
          Air Support Division · Conta
        </p>
        <h1 className="font-mono text-xl font-bold tracking-widest uppercase" style={{ color: "#e8c97e" }}>
          Configurações
        </h1>
        {user && (
          <p className="font-mono text-[11px] mt-0.5" style={{ color: "#5a7a9a" }}>
            {user.email} · {user.role}
          </p>
        )}
      </div>

      <div className="max-w-md space-y-4">
        <Section title="Alterar E-mail">
          <ChangeEmailSection onNewToken={handleNewToken} />
        </Section>

        <Section title="Alterar Senha">
          <ChangePasswordSection onNewToken={handleNewToken} />
        </Section>
      </div>

    </div>
  );
}
