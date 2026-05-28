"use client";

import { useEffect, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

interface Stats {
  periodo: string;
  efetivo_ativo: number;
  efetivo_total: number;
  apreensoes: number;
  horas_voo: number;
  acidentes: number;
  taxa_sucesso: number;
  atualizado_em: string;
}

function useCountUp(target: number, duration = 1400, active = false) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!active || target === 0) { setValue(target); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(ease * target));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration, active]);

  return value;
}

function KpiCard({
  label,
  value,
  sub,
  accent,
  active,
  suffix = "",
}: {
  label: string;
  value: number;
  sub?: string;
  accent: string;
  active: boolean;
  suffix?: string;
}) {
  const displayed = useCountUp(value, 1400, active);
  return (
    <div
      className="rounded-lg px-5 py-5 flex flex-col gap-2"
      style={{
        background: "#0d1117",
        border: "1px solid #1c2a3a",
        borderTop: `2px solid ${accent}`,
      }}
    >
      <div className="text-[9px] font-mono tracking-[2px] uppercase" style={{ color: "#3a5a7a" }}>
        {label}
      </div>
      <div className="font-mono text-4xl font-bold leading-none" style={{ color: accent }}>
        {displayed}{suffix}
      </div>
      {sub && (
        <div className="text-[10px] font-mono" style={{ color: "#3a5a7a" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function StatusPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/public/stats`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<Stats>;
      })
      .then((data) => {
        setStats(data);
        setTimeout(() => setActive(true), 100);
      })
      .catch(() => setError(true));
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#0a0d12", fontFamily: "monospace" }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 py-3"
        style={{ borderBottom: "1px solid #1c2a3a" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#3dd68c" }} />
          <span className="text-[10px] font-mono tracking-[2px] uppercase" style={{ color: "#3dd68c" }}>
            Sistema Online
          </span>
        </div>
        <span className="text-[10px] font-mono tracking-[2px] uppercase" style={{ color: "#3a5a7a" }}>
          Air Support Division · LSPD
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 gap-10">

        {/* Header */}
        <div className="text-center space-y-2">
          <p className="text-[10px] font-mono tracking-[4px] uppercase" style={{ color: "#3a5a7a" }}>
            Air Support Division · Relatório Público
          </p>
          <h1
            className="text-2xl md:text-4xl font-mono font-bold tracking-widest uppercase"
            style={{ color: "#e8c97e" }}
          >
            Status Operacional
          </h1>
          {stats && (
            <p className="text-[11px] font-mono tracking-[3px] uppercase" style={{ color: "#5a7a9a" }}>
              Período: {stats.periodo}
            </p>
          )}
        </div>

        {error && (
          <div
            className="text-[12px] font-mono tracking-[2px] uppercase px-6 py-4 rounded"
            style={{ color: "#e24b4a", background: "#1a0a0a", border: "1px solid #e24b4a44" }}
          >
            Erro ao carregar dados — tente novamente mais tarde
          </div>
        )}

        {!stats && !error && (
          <div className="text-[11px] font-mono tracking-[3px] uppercase animate-pulse" style={{ color: "#3a5a7a" }}>
            Carregando...
          </div>
        )}

        {stats && (
          <>
            {/* KPI grid */}
            <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard
                label="Pilotos Ativos"
                value={stats.efetivo_ativo}
                sub={`${stats.efetivo_total} no efetivo`}
                accent="#e8c97e"
                active={active}
              />
              <KpiCard
                label="Horas de Voo"
                value={stats.horas_voo}
                sub="horas acumuladas"
                accent="#4a90e2"
                active={active}
              />
              <KpiCard
                label="Apreensões"
                value={stats.apreensoes}
                sub="em relatórios aprovados"
                accent="#3dd68c"
                active={active}
              />
              <KpiCard
                label="Acidentes"
                value={stats.acidentes}
                sub="em relatórios aprovados"
                accent="#e24b4a"
                active={active}
              />
            </div>

            {/* Secondary row */}
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-3">
              <KpiCard
                label="Taxa de Sucesso"
                value={stats.taxa_sucesso}
                sub="relatórios aprovados / total"
                accent="#3dd68c"
                active={active}
                suffix="%"
              />
              <div
                className="rounded-lg px-5 py-5 flex flex-col justify-center gap-2"
                style={{
                  background: "#0d1117",
                  border: "1px solid #1c2a3a",
                  borderTop: "2px solid #5a7a9a",
                }}
              >
                <div className="text-[9px] font-mono tracking-[2px] uppercase" style={{ color: "#3a5a7a" }}>
                  Atualizado em
                </div>
                <div className="font-mono text-2xl font-bold" style={{ color: "#5a7a9a" }}>
                  {formatTime(stats.atualizado_em)}
                </div>
                <div className="text-[10px] font-mono" style={{ color: "#3a5a7a" }}>
                  horário do servidor
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-center px-6 py-4 gap-6"
        style={{ borderTop: "1px solid #1c2a3a" }}
      >
        <span className="text-[9px] font-mono tracking-[2px] uppercase" style={{ color: "#1c2a3a" }}>
          ASD · Air Support Division · LSPD
        </span>
        <span className="text-[9px] font-mono tracking-[2px] uppercase" style={{ color: "#1c2a3a" }}>
          Dados públicos · Sem informações sensíveis
        </span>
      </div>
    </div>
  );
}
