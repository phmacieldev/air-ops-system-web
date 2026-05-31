"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Pilot } from "@/types";
import { LayoutDashboard, Users, Plane, FileText, BookOpen, LogOut, UserPlus, Award, Settings, Shield } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard",        href: "/dashboard",       Icon: LayoutDashboard },
  { label: "Roster",           href: "/pilots",           Icon: Users            },
  { label: "Protocolo de Voo", href: "/flights",          Icon: Plane            },
  { label: "Relatórios",       href: "/reports",          Icon: FileText         },
  { label: "Certificações",    href: "/certifications",   Icon: Award            },
  { label: "Documentos",       href: "/documents",        Icon: BookOpen         },
  { label: "Configurações",    href: "/settings",         Icon: Settings         },
];

function NavItem({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: React.ElementType;
  active: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors"
      style={{
        background: active ? "#1a2210" : hovered ? "#111823" : "transparent",
        color:      active ? "#e8c97e" : hovered ? "#c8d6e5" : "#5a7a9a",
        borderLeft: active ? "2px solid #e8c97e" : "2px solid transparent",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="font-mono text-[11px] tracking-[1px] uppercase">{label}</span>
    </Link>
  );
}

function LogoutButton({ onLogout }: { onLogout: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onLogout}
      className="flex items-center gap-3 w-full px-3 py-2 rounded-md font-mono text-[11px] tracking-[1px] uppercase transition-colors"
      style={{
        color:      hovered ? "#e24b4a" : "#5a7a9a",
        background: hovered ? "#2a0a0a" : "transparent",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <LogOut className="w-4 h-4 shrink-0" />
      Sair
    </button>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout, token } = useAuth();
  const [myPilotId, setMyPilotId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.get<Pilot>("/pilots/me", 60)
      .then((p) => setMyPilotId(p.id))
      .catch(() => {});
  }, [token]);

  return (
    <aside
      className="flex flex-col w-56 min-h-screen shrink-0"
      style={{ background: "#0d1117", borderRight: "1px solid #1c2a3a" }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-4"
        style={{ borderBottom: "1px solid #1c2a3a" }}
      >
        <svg width="34" height="38" viewBox="0 0 40 44" fill="none" aria-hidden="true">
          <path
            d="M20 2L4 8V22C4 32 11 40 20 43C29 40 36 32 36 22V8L20 2Z"
            fill="#1c2a3a" stroke="#e8c97e" strokeWidth="1.5"
          />
          <path
            d="M20 9L11 12.5V21C11 26.5 14.8 31.5 20 33.5C25.2 31.5 29 26.5 29 21V12.5L20 9Z"
            fill="#0d1117" stroke="#e8c97e44" strokeWidth="0.8"
          />
          <text
            x="20" y="25" textAnchor="middle"
            fontFamily="monospace" fontSize="10"
            fill="#e8c97e" letterSpacing="1"
          >
            ASD
          </text>
          <path d="M14 19L20 14L26 19" stroke="#e8c97e" strokeWidth="1.2" fill="none"/>
          <line x1="20" y1="14" x2="20" y2="28" stroke="#e8c97e" strokeWidth="1" strokeDasharray="2,2"/>
        </svg>
        <div>
          <div
            className="font-mono text-[11px] font-bold leading-none tracking-widest"
            style={{ color: "#e8c97e" }}
          >
            AIR SUPPORT
          </div>
          <div
            className="font-mono text-[9px] mt-1 tracking-[2px] uppercase"
            style={{ color: "#5a7a9a" }}
          >
            Division
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div
        className="flex items-center gap-2 px-4 py-2"
        style={{ borderBottom: "1px solid #1c2a3a", background: "#0a0d12" }}
      >
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#3dd68c" }} />
        <span className="font-mono text-[9px] tracking-[2px] uppercase" style={{ color: "#3dd68c" }}>
          Sistema Online
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ label, href, Icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            Icon={Icon}
            active={pathname === href}
          />
        ))}
        {/* Admin-only: cadastro de usuário */}
        {(user?.role === "LEAD" || user?.role === "SUPERVISOR" || user?.role === "ADM") && (
          <>
            <div className="my-1 mx-3" style={{ borderTop: "1px solid #1c2a3a" }} />
            <NavItem
              href="/register"
              label="Cadastrar Membro"
              Icon={UserPlus}
              active={pathname === "/register"}
            />
          </>
        )}
        {(user?.role === "LEAD" || user?.role === "ADM") && (
          <NavItem
            href="/admin"
            label="Painel Admin"
            Icon={Shield}
            active={pathname === "/admin"}
          />
        )}
      </nav>

      {/* User info + Logout */}
      <div className="px-3 py-3" style={{ borderTop: "1px solid #1c2a3a" }}>
        {user && myPilotId && (
          <Link href={`/pilots/${myPilotId}`}
            className="block px-3 py-2 mb-1 rounded transition-colors"
            style={{ background: "#0a0d12" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#111823")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#0a0d12")}>
            <p className="font-mono text-[11px] font-bold truncate" style={{ color: "#c8d6e5" }}>
              {user.name}
            </p>
            <p className="font-mono text-[9px] tracking-[1.5px] uppercase truncate" style={{ color: "#5a7a9a" }}>
              {user.role} · ver perfil
            </p>
          </Link>
        )}
        {user && !myPilotId && (
          <div className="px-3 py-2 mb-1 rounded" style={{ background: "#0a0d12" }}>
            <p className="font-mono text-[11px] font-bold truncate" style={{ color: "#c8d6e5" }}>{user.name}</p>
            <p className="font-mono text-[9px] tracking-[1.5px] uppercase truncate" style={{ color: "#5a7a9a" }}>{user.role}</p>
          </div>
        )}
        <LogoutButton onLogout={() => { logout(); router.push("/login"); }} />
      </div>
    </aside>
  );
}
