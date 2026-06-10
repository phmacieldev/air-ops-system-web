"use client";

import { useState } from "react";
import { useOfficer } from "@/context/OfficerContext";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { MessageSquare, Hash } from "lucide-react";

const RANK_ORDER: Record<string, number> = {
  CADET: 1, SOLO_CADET: 2, OFFICER: 3, OFFICER_1: 4, OFFICER_2: 5,
  OFFICER_3: 6, SENIOR_OFFICER: 7, CORPORAL: 8, SERGEANT: 9,
  LIEUTENANT: 10, CAPTAIN: 11, ASSISTANT_CHIEF: 12, CHIEF: 13, COMMISSIONER: 14,
};

const ALL_CHANNELS = [
  { id: "POLICE_GENERAL",     label: "geral",      color: "#e8c97e", minLevel: 0  },
  { id: "POLICE_CADET",       label: "cadet",      color: "#8a9ab8", minLevel: 0  },
  { id: "POLICE_SUPERVISION", label: "supervision", color: "#4a90e2", minLevel: 7  },
  { id: "POLICE_HC",          label: "hc",          color: "#c084fc", minLevel: 9  },
];

export default function PoliceChatPage() {
  const { rank, isCommand } = useOfficer();
  const myLevel = isCommand ? 99 : (RANK_ORDER[rank ?? ""] ?? 0);

  const channels = ALL_CHANNELS.filter((c) => myLevel >= c.minLevel);

  const [activeId, setActiveId] = useState(() => channels[0]?.id ?? "POLICE_GENERAL");
  const active = channels.find((c) => c.id === activeId) ?? channels[0];

  if (!active) return null;

  return (
    <div className="flex h-full min-h-screen" style={{ background: "#0a0d12" }}>

      {/* Channel sidebar */}
      <div className="w-44 shrink-0 flex flex-col"
        style={{ background: "#0d1117", borderRight: "1px solid #1c2a3a" }}>

        {/* Header */}
        <div className="px-4 py-3 flex items-center gap-2"
          style={{ borderBottom: "1px solid #1c2a3a" }}>
          <MessageSquare className="w-3.5 h-3.5 shrink-0" style={{ color: "#5a7a9a" }} />
          <span className="font-mono text-[10px] tracking-[2px] uppercase font-bold" style={{ color: "#e8c97e" }}>
            Chat LSPD
          </span>
        </div>

        {/* Channel list */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          <div className="px-2 pb-1">
            <span className="font-mono text-[8px] tracking-[2px] uppercase" style={{ color: "#3a4a5a" }}>Canais</span>
          </div>
          {channels.map((c) => {
            const isActive = c.id === active.id;
            return (
              <button key={c.id} onClick={() => setActiveId(c.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded transition-colors text-left"
                style={{
                  background: isActive ? `${c.color}15` : "transparent",
                  color:      isActive ? c.color : "#5a7a9a",
                  borderLeft: isActive ? `2px solid ${c.color}` : "2px solid transparent",
                }}>
                <Hash className="w-3 h-3 shrink-0" />
                <span className="font-mono text-[11px] tracking-[0.5px]">{c.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col p-3 md:p-4 min-w-0">
        <div className="mb-3 flex items-center gap-2">
          <Hash className="w-4 h-4" style={{ color: active.color }} />
          <span className="font-mono text-sm font-bold tracking-wide uppercase" style={{ color: active.color }}>
            {active.label}
          </span>
        </div>
        <div className="flex-1" style={{ minHeight: 500 }}>
          <ChatWindow key={active.id} channel={active.id} color={active.color} />
        </div>
      </div>

    </div>
  );
}
