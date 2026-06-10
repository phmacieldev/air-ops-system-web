"use client";
import { UnitGate } from "@/components/UnitGate";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function FTOChatPage() {
  return (
    <UnitGate unit="FTO">
      <div className="p-3 md:p-6 flex flex-col gap-4 min-h-full" style={{ background: "#0a0d12" }}>
        <div>
          <p className="text-[10px] font-mono tracking-[3px] uppercase mb-1" style={{ color: "#5a7a9a" }}>Field Training Officers</p>
          <h1 className="text-lg md:text-2xl font-mono font-bold tracking-widest uppercase" style={{ color: "#f97316" }}>Chat</h1>
        </div>
        <div className="flex-1" style={{ minHeight: 500 }}>
          <ChatWindow channel="FTO_GENERAL" color="#f97316" />
        </div>
      </div>
    </UnitGate>
  );
}
