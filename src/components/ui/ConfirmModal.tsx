"use client";

import { useEffect } from "react";

type ModalVariant = "danger" | "warning";

const VARIANT_STYLES: Record<ModalVariant, {
  border: string; glow: string; iconBg: string; iconStroke: string; confirmBg: string;
  confirmColor: string; confirmBorder: string; confirmHover: string;
}> = {
  danger: {
    border:       "#e24b4a55",
    glow:         "#e24b4a22",
    iconBg:       "#2a0a0a",
    iconStroke:   "#e24b4a",
    confirmBg:    "#3d0f0f",
    confirmColor: "#e24b4a",
    confirmBorder:"#e24b4a66",
    confirmHover: "#4d1515",
  },
  warning: {
    border:       "#e8c97e55",
    glow:         "#e8c97e18",
    iconBg:       "#2a1f0a",
    iconStroke:   "#e8c97e",
    confirmBg:    "#2a1f0a",
    confirmColor: "#e8c97e",
    confirmBorder:"#e8c97e66",
    confirmHover: "#3a2c10",
  },
};

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: ModalVariant;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  variant = "danger",
}: ConfirmModalProps) {
  const s = VARIANT_STYLES[variant];
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-6 flex flex-col gap-5"
        style={{
          background: "#0d1117",
          border: `1px solid ${s.border}`,
          boxShadow: `0 0 40px ${s.glow}`,
        }}
      >
        {/* Icon */}
        <div className="flex items-center justify-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: s.iconBg, border: `1px solid ${s.iconStroke}44` }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={s.iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
        </div>

        {/* Text */}
        <div className="text-center flex flex-col gap-1.5">
          <h3
            className="font-mono text-base font-bold tracking-wide uppercase"
            style={{ color: "#c8d6e5" }}
          >
            {title}
          </h3>
          <p className="font-mono text-[12px] leading-relaxed" style={{ color: "#5a7a9a" }}>
            {description}
          </p>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid #1c2a3a" }} />

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 font-mono text-[11px] tracking-[1px] uppercase py-2.5 rounded transition-colors"
            style={{
              background: "#0a1628",
              color: "#5a7a9a",
              border: "1px solid #1c2a3a",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#111e30")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#0a1628")}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 font-mono text-[11px] tracking-[1px] uppercase py-2.5 rounded font-bold transition-colors"
            style={{
              background: s.confirmBg,
              color:      s.confirmColor,
              border:     `1px solid ${s.confirmBorder}`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = s.confirmHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = s.confirmBg)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
