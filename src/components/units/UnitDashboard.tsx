"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Officer, PoliceUnit, UnitAviso } from "@/types";
import { UnitAvisosSection } from "./UnitAvisosSection";
import { UnitPageShell } from "./UnitPageShell";

const UNIT_COLOR: Record<string, string> = {
  CID:   "#e24b4a",
  HEAT:  "#c084fc",
  MU:    "#3dd68c",
  FTO:   "#f97316",
  METRO: "#e8c97e",
};

export function UnitDashboard({ unit }: { unit: string }) {
  const { user } = useAuth();
  const color = UNIT_COLOR[unit] ?? "#5a7a9a";

  const [officers, setOfficers] = useState<Officer[]>([]);
  const [avisos, setAvisos]     = useState<UnitAviso[]>([]);
  const [loading, setLoading]   = useState(true);

  const canManage =
    user?.role === "LEAD" || user?.role === "SUPERVISOR" || user?.role === "ADM";

  useEffect(() => {
    Promise.all([
      api.get<Officer[]>("/officers", 60).catch(() => [] as Officer[]),
      api.get<UnitAviso[]>(`/unit-avisos?unit=${unit}`, 30).catch(() => [] as UnitAviso[]),
    ]).then(([o, a]) => {
      setOfficers(o);
      setAvisos(a);
    }).finally(() => setLoading(false));
  }, [unit]);

  const unitOfficers = officers.filter((o) => (o.units ?? []).includes(unit as PoliceUnit));
  const active       = unitOfficers.filter((o) => o.status === "ACTIVE").length;
  const inactive     = unitOfficers.filter((o) => o.status !== "ACTIVE").length;
  const total        = unitOfficers.length;

  const statCards = [
    { label: "Ativos na Unidade",  value: loading ? "—" : active,   accent: "#3dd68c" },
    { label: "Apreensões",         value: "—",                       accent: color     },
    { label: "Inativos",           value: loading ? "—" : inactive,  accent: "#5a7a9a" },
    { label: "Total na Unidade",   value: loading ? "—" : total,     accent: "#4a90e2" },
  ];

  return (
    <UnitPageShell unit={unit} page="dashboard">
      <div className="space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {statCards.map(({ label, value, accent }) => (
            <div key={label} className="rounded-lg px-4 py-4"
              style={{ background: "#0d1117", border: "1px solid #1c2a3a", borderTop: `2px solid ${accent}` }}>
              <div className="text-[10px] font-mono tracking-[1.5px] uppercase mb-2" style={{ color: "#5a7a9a" }}>{label}</div>
              <div className="font-mono text-3xl font-bold leading-none" style={{ color: accent }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Avisos */}
        <UnitAvisosSection
          unit={unit}
          avisos={avisos}
          loading={loading}
          canManage={canManage}
          onAdd={(a) => setAvisos((prev) => [a, ...prev])}
          onEdit={(a) => setAvisos((prev) => prev.map((x) => (x.id === a.id ? a : x)))}
          onDelete={(id) => setAvisos((prev) => prev.filter((x) => x.id !== id))}
        />

        {/* Roster preview */}
        <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
          <div className="px-4 py-2.5" style={{ borderBottom: "1px solid #1c2a3a" }}>
            <span className="text-[11px] font-mono tracking-[1.5px] uppercase" style={{ color }}>Efetivo da Unidade</span>
          </div>
          {loading ? (
            <p className="py-6 text-center font-mono text-[11px]" style={{ color: "#5a7a9a" }}>Carregando...</p>
          ) : unitOfficers.length === 0 ? (
            <p className="py-10 text-center font-mono text-[11px] tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>Nenhum oficial nesta unidade</p>
          ) : (
            <div>
              {unitOfficers.slice(0, 10).map((o) => (
                <div key={o.id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: "1px solid #111823" }}>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm font-bold truncate" style={{ color: "#c8d6e5" }}>{o.fullName}</div>
                    <div className="font-mono text-[10px]" style={{ color: "#5a7a9a" }}>{o.callsign} · {o.rank}</div>
                  </div>
                  <span
                    className="font-mono text-[9px] tracking-[1px] uppercase px-2 py-0.5 rounded shrink-0"
                    style={{
                      background: o.status === "ACTIVE" ? "#0a2a14" : "#1a1c2a",
                      color: o.status === "ACTIVE" ? "#3dd68c" : "#5a7a9a",
                    }}
                  >{o.status === "ACTIVE" ? "Ativo" : "Inativo"}</span>
                </div>
              ))}
              {unitOfficers.length > 10 && (
                <p className="px-4 py-2 font-mono text-[10px]" style={{ color: "#5a7a9a" }}>
                  +{unitOfficers.length - 10} mais no roster completo
                </p>
              )}
            </div>
          )}
        </div>

      </div>
    </UnitPageShell>
  );
}
