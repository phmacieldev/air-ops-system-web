"use client";

import { useState } from "react";
import { ClipboardList, BookOpen, ClipboardCheck, Target, Shield, Eye, ExternalLink } from "lucide-react";

const DOCS = [
  {
    title: "SOP — Procedimentos Operacionais",
    category: "Regulamento",
    url: "https://docs.google.com/document/d/113UebkFf4pr4JZOWxBkkFTFOnBdiVPWQwdK47Q2QfRk/edit?tab=t.0",
    Icon: ClipboardList,
    accent: "#e8c97e",
    iconBg: "#1a2210",
    iconBorder: "#e8c97e22",
  },
  {
    title: "Manual Trainee",
    category: "Manual",
    url: "https://docs.google.com/document/d/1qsaEFwNjwrb-HHsrjWFZ3B2FNaYJ00CRmTqohHwzYGc/edit?tab=t.0",
    Icon: BookOpen,
    accent: "#4a90e2",
    iconBg: "#0a1f2a",
    iconBorder: "#4a90e222",
  },
  {
    title: "Avaliação Trainee",
    category: "Avaliação",
    url: "https://docs.google.com/document/d/1j5Z4R0UOYETfwEWbF-8OCz_jD8tZ28EG_Q4zd437xto/edit?tab=t.0",
    Icon: ClipboardCheck,
    accent: "#3dd68c",
    iconBg: "#0a2a14",
    iconBorder: "#3dd68c22",
  },
  {
    title: "Pursuit & VCB",
    category: "Protocolo",
    url: "https://docs.google.com/document/d/1IamijRO-vU9B_bIotuSShQMOlWhuP-busAgt-T4q_G0/edit?tab=t.0",
    Icon: Target,
    accent: "#e24b4a",
    iconBg: "#2a1010",
    iconBorder: "#e24b4a22",
  },
  {
    title: "Operational",
    category: "Protocolo",
    url: "https://docs.google.com/document/d/1RJF158H6M80QvOvroNXhxPjHs-o2YrtklPU3H5ZfJeM/edit?tab=t.0",
    Icon: Shield,
    accent: "#3dd68c",
    iconBg: "#0a2a14",
    iconBorder: "#3dd68c22",
  },
  {
    title: "Scene Control",
    category: "Protocolo",
    url: "https://docs.google.com/document/d/1x6fvJJmvhpEuuIhMOmMyq7DPr26uqL3UNfRciu6KV1o/edit?tab=t.0#heading=h.785q95irhal4",
    Icon: Eye,
    accent: "#a855f7",
    iconBg: "#1a1020",
    iconBorder: "#a855f722",
  },
];

function DocCard({ doc }: { doc: typeof DOCS[number] }) {
  const [hovered, setHovered] = useState(false);
  const { Icon } = doc;
  return (
    <a
      href={doc.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg p-4 transition-all"
      style={{
        background:   "#0d1117",
        border:       `1px solid ${hovered ? doc.accent + "44" : "#1c2a3a"}`,
        borderTop:    `2px solid ${hovered ? doc.accent : "#1c2a3a"}`,
        cursor:       "pointer",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
        style={{
          background: doc.iconBg,
          border:     `1px solid ${doc.iconBorder}`,
        }}
      >
        <Icon className="w-5 h-5" style={{ color: doc.accent }} />
      </div>

      {/* Title */}
      <div
        className="font-mono text-sm font-semibold leading-snug mb-1 transition-colors"
        style={{ color: hovered ? doc.accent : "#c8d6e5" }}
      >
        {doc.title}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        <span
          className="text-[9px] font-mono tracking-[1px] uppercase px-2 py-0.5 rounded"
          style={{
            background: doc.iconBg,
            color:      doc.accent,
            border:     `1px solid ${doc.iconBorder}`,
          }}
        >
          {doc.category}
        </span>
        <ExternalLink
          className="w-3.5 h-3.5 transition-colors"
          style={{ color: hovered ? doc.accent : "#5a7a9a" }}
        />
      </div>
    </a>
  );
}

export default function DocumentsPage() {
  return (
    <div className="p-3 md:p-6 space-y-4 min-h-full" style={{ background: "#0a0d12" }}>

      {/* Page header */}
      <div className="flex items-start md:items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono tracking-[3px] uppercase mb-1" style={{ color: "#5a7a9a" }}>
            Air Support Division · Biblioteca
          </p>
          <h1 className="text-lg md:text-2xl font-mono font-bold tracking-wide md:tracking-widest uppercase" style={{ color: "#e8c97e" }}>
            Documentos
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#3dd68c" }} />
          <span className="text-[10px] font-mono tracking-[2px] uppercase" style={{ color: "#3dd68c" }}>
            {DOCS.length} docs
          </span>
        </div>
      </div>

      {/* Panel */}
      <div className="rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid #1c2a3a" }}>
        <div className="px-4 py-2.5" style={{ borderBottom: "1px solid #1c2a3a" }}>
          <span className="text-[11px] font-mono tracking-[1.5px] uppercase" style={{ color: "#e8c97e" }}>
            Documentos da Unidade
          </span>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DOCS.map((doc) => (
            <DocCard key={doc.url} doc={doc} />
          ))}
        </div>
      </div>

    </div>
  );
}
