"use client";

import { useParams } from "next/navigation";
import { ChatWindow } from "@/components/chat/ChatWindow";

const CHANNEL_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  POLICE_GENERAL:     { label: "geral",       color: "#e8c97e", description: "Canal geral da LSPD"       },
  POLICE_CADET:       { label: "cadet",        color: "#8a9ab8", description: "Canal dos recrutas"        },
  POLICE_SUPERVISION: { label: "supervision",  color: "#4a90e2", description: "Canal de supervisão"       },
  POLICE_HC:          { label: "hc",           color: "#c084fc", description: "High Command"              },
};

export default function PoliceChatChannelPage() {
  const { channel } = useParams<{ channel: string }>();
  const cfg = CHANNEL_CONFIG[channel] ?? { label: channel, color: "#e8c97e", description: "" };

  return (
    <div className="flex flex-col h-full min-h-screen p-3 md:p-6" style={{ background: "#0a0d12" }}>
      <div className="mb-4">
        <p className="text-[10px] font-mono tracking-[3px] uppercase mb-1" style={{ color: "#5a7a9a" }}>
          Los Santos Police Department · Chat
        </p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xl font-bold" style={{ color: cfg.color }}>#</span>
          <h1 className="text-lg md:text-2xl font-mono font-bold tracking-widest uppercase" style={{ color: cfg.color }}>
            {cfg.label}
          </h1>
        </div>
        {cfg.description && (
          <p className="font-mono text-[11px] mt-0.5" style={{ color: "#5a7a9a" }}>{cfg.description}</p>
        )}
      </div>
      <div className="flex-1" style={{ minHeight: 500 }}>
        <ChatWindow channel={channel} color={cfg.color} />
      </div>
    </div>
  );
}
