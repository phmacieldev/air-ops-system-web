"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

interface ChatMsg {
  id: string;
  channel: string;
  sender: string;
  content: string;
  createdAt: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return time;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " " + time;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export function ChatWindow({ channel, color = "#e8c97e" }: { channel: string; color?: string }) {
  const { user } = useAuth();
  const [messages,   setMessages]   = useState<ChatMsg[]>([]);
  const [text,       setText]       = useState("");
  const [connected,  setConnected]  = useState(false);
  const [loading,    setLoading]    = useState(true);
  const clientRef  = useRef<Client | null>(null);
  const bottomRef  = useRef<HTMLDivElement>(null);

  // scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // load history
  useEffect(() => {
    setMessages([]);
    setLoading(true);
    api.get<ChatMsg[]>(`/chat/${channel}/history?limit=100`)
      .then(setMessages)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [channel]);

  // websocket connection
  const connect = useCallback(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_URL}/ws`),
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/chat/${channel}`, (frame) => {
          const msg: ChatMsg = JSON.parse(frame.body);
          setMessages((prev) => {
            // avoid duplicates (history might overlap)
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        });
      },
      onDisconnect: () => setConnected(false),
    });
    client.activate();
    clientRef.current = client;
    return client;
  }, [channel]);

  useEffect(() => {
    const client = connect();
    return () => { client.deactivate(); };
  }, [connect]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !clientRef.current?.connected) return;
    clientRef.current.publish({
      destination: `/app/chat/${channel}`,
      body: JSON.stringify({ sender: user?.name ?? "Anônimo", content: text.trim() }),
    });
    setText("");
  }

  return (
    <div className="flex flex-col h-full rounded-lg overflow-hidden"
      style={{ background: "#0d1117", border: "1px solid #1c2a3a", minHeight: 420 }}>

      {/* Header */}
      <div className="px-4 py-2.5 flex items-center gap-2 shrink-0"
        style={{ borderBottom: "1px solid #1c2a3a", background: "#0a0d12" }}>
        <div className="w-1.5 h-1.5 rounded-full"
          style={{ background: connected ? "#3dd68c" : "#e24b4a", transition: "background 0.3s" }} />
        <span className="font-mono text-[10px] tracking-[2px] uppercase"
          style={{ color: connected ? "#3dd68c" : "#5a7a9a" }}>
          {connected ? "Conectado" : "Reconectando..."}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#1c2a3a transparent" }}>
        {loading ? (
          <p className="text-center font-mono text-[11px] py-8" style={{ color: "#5a7a9a" }}>Carregando...</p>
        ) : messages.length === 0 ? (
          <p className="text-center font-mono text-[11px] py-8 tracking-[2px] uppercase" style={{ color: "#3a4a5a" }}>
            Nenhuma mensagem ainda
          </p>
        ) : (
          messages.map((m) => {
            const isMe = m.sender === user?.name;
            return (
              <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                {!isMe && (
                  <span className="font-mono text-[9px] tracking-[1px] uppercase mb-0.5 px-1"
                    style={{ color }}>
                    {m.sender}
                  </span>
                )}
                <div className="max-w-[75%] px-3 py-2 rounded-lg"
                  style={{
                    background: isMe ? `${color}18` : "#111823",
                    border: `1px solid ${isMe ? color + "44" : "#1c2a3a"}`,
                  }}>
                  <p className="font-mono text-sm break-words" style={{ color: isMe ? color : "#c8d6e5" }}>
                    {m.content}
                  </p>
                </div>
                <span className="font-mono text-[9px] mt-0.5 px-1" style={{ color: "#3a4a5a" }}>
                  {formatTime(m.createdAt)}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="flex gap-2 px-4 py-3 shrink-0"
        style={{ borderTop: "1px solid #1c2a3a", background: "#0a0d12" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={connected ? "Mensagem..." : "Aguardando conexão..."}
          disabled={!connected}
          className="flex-1 font-mono text-sm px-3 py-2 rounded outline-none"
          style={{
            background: "#0d1117", border: "1px solid #1c2a3a",
            color: "#c8d6e5", opacity: connected ? 1 : 0.5,
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = color)}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#1c2a3a")}
        />
        <button type="submit" disabled={!connected || !text.trim()}
          className="font-mono text-[11px] tracking-[1px] uppercase px-4 py-2 rounded shrink-0"
          style={{
            background: connected && text.trim() ? color : "#1c2a3a",
            color: connected && text.trim() ? "#0a0d12" : "#5a7a9a",
            fontWeight: 700, transition: "all 0.15s",
          }}>
          Enviar
        </button>
      </form>
    </div>
  );
}
