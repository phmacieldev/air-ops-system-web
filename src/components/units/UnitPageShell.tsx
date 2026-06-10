"use client";

import { PoliceUnit } from "@/types";

const UNIT_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  CID:   { label: "Criminal Investigation Division", color: "#e24b4a", description: "Investigação criminal e inteligência policial." },
  HEAT:  { label: "High Enforcement Action Team",    color: "#c084fc", description: "Operações de alta intensidade e resposta tática." },
  MU:    { label: "Motor Unit",                      color: "#3dd68c", description: "Patrulha motorizada e controle de trânsito." },
  FTO:   { label: "Field Training Officers",         color: "#f97316", description: "Treinamento e qualificação de novos oficiais." },
  METRO: { label: "Metro Division",                  color: "#e8c97e", description: "Operações metropolitanas e suporte tático." },
};

const PAGE_CONFIG: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard",  subtitle: "Visão geral da unidade" },
  roster:    { title: "Roster",     subtitle: "Efetivo ativo da unidade" },
  documents: { title: "Documentos", subtitle: "Arquivos e protocolos internos" },
  admin:     { title: "Painel Admin", subtitle: "Gerenciamento da unidade" },
};

export function UnitPageShell({
  unit,
  page,
  children,
}: {
  unit: string;
  page: string;
  children?: React.ReactNode;
}) {
  const cfg  = UNIT_CONFIG[unit] ?? { label: unit, color: "#5a7a9a", description: "" };
  const pg   = PAGE_CONFIG[page] ?? { title: page, subtitle: "" };
  const color = cfg.color;

  return (
    <div className="p-3 md:p-6 space-y-4 min-h-full" style={{ background: "#0a0d12" }}>

      {/* Header */}
      <div className="flex items-start md:items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono tracking-[3px] uppercase mb-1" style={{ color: "#5a7a9a" }}>
            {cfg.label}
          </p>
          <h1 className="text-lg md:text-2xl font-mono font-bold tracking-wide uppercase" style={{ color }}>
            {pg.title}
          </h1>
          <p className="font-mono text-[11px] mt-1" style={{ color: "#5a7a9a" }}>{pg.subtitle}</p>
        </div>
        <div className="shrink-0 px-3 py-1.5 rounded font-mono text-[10px] tracking-[1px] uppercase"
          style={{ background: `${color}15`, color, border: `1px solid ${color}44` }}>
          {unit}
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: `1px solid ${color}22` }} />

      {/* Content */}
      {children ?? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: `${color}15`, border: `1px solid ${color}33` }}>
            <span className="font-mono text-2xl font-bold" style={{ color }}>{unit[0]}</span>
          </div>
          <p className="font-mono text-[11px] tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>
            Em construção
          </p>
          <p className="font-mono text-[10px]" style={{ color: "#3a4a5a" }}>
            {cfg.description}
          </p>
        </div>
      )}
    </div>
  );
}
