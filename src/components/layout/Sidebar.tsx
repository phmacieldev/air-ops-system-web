"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useOfficer } from "@/context/OfficerContext";
import { api } from "@/lib/api";
import {
  LayoutDashboard, Users, Plane, FileText, BookOpen, LogOut,
  UserPlus, Award, Settings, Shield, ClipboardList, BadgeCheck,
  UserCheck, ChevronDown, ChevronRight, MessageSquare, Hash,
} from "lucide-react";
import { PoliceUnit } from "@/types";

// ── Unit page definitions ──────────────────────────────────────────────────
const UNIT_PAGES: Partial<Record<PoliceUnit, { label: string; href: string; Icon: React.ElementType }[]>> = {
  ASD: [
    { label: "Dashboard",     href: "/dashboard",     Icon: LayoutDashboard },
    { label: "Roster",        href: "/pilots",         Icon: Users           },
    { label: "Voos",          href: "/flights",        Icon: Plane           },
    { label: "Relatórios",    href: "/reports",        Icon: FileText        },
    { label: "Certificações", href: "/certifications", Icon: Award           },
    { label: "Documentos",    href: "/documents",      Icon: BookOpen        },
    { label: "Chat",          href: "/asd/chat",       Icon: MessageSquare   },
  ],
  CID: [
    { label: "Dashboard", href: "/cid/dashboard", Icon: LayoutDashboard },
    { label: "Roster",    href: "/cid/roster",    Icon: Users           },
    { label: "Documentos",href: "/cid/documents", Icon: BookOpen        },
    { label: "Chat",      href: "/cid/chat",      Icon: MessageSquare   },
  ],
  HEAT: [
    { label: "Dashboard", href: "/heat/dashboard", Icon: LayoutDashboard },
    { label: "Roster",    href: "/heat/roster",    Icon: Users           },
    { label: "Documentos",href: "/heat/documents", Icon: BookOpen        },
    { label: "Chat",      href: "/heat/chat",      Icon: MessageSquare   },
  ],
  MU: [
    { label: "Dashboard", href: "/mu/dashboard", Icon: LayoutDashboard },
    { label: "Roster",    href: "/mu/roster",    Icon: Users           },
    { label: "Documentos",href: "/mu/documents", Icon: BookOpen        },
    { label: "Chat",      href: "/mu/chat",      Icon: MessageSquare   },
  ],
  FTO: [
    { label: "Dashboard", href: "/fto/dashboard", Icon: LayoutDashboard },
    { label: "Roster",    href: "/fto/roster",    Icon: Users           },
    { label: "Documentos",href: "/fto/documents", Icon: BookOpen        },
    { label: "Chat",      href: "/fto/chat",      Icon: MessageSquare   },
  ],
  METRO: [
    { label: "Dashboard", href: "/metro/dashboard", Icon: LayoutDashboard },
    { label: "Roster",    href: "/metro/roster",    Icon: Users           },
    { label: "Documentos",href: "/metro/documents", Icon: BookOpen        },
    { label: "Chat",      href: "/metro/chat",      Icon: MessageSquare   },
  ],
};

const UNIT_LABEL: Partial<Record<PoliceUnit, string>> = {
  ASD:   "Air Support Division",
  CID:   "Criminal Invest. Div.",
  HEAT:  "High Enforcement AT",
  METRO: "Metro",
  MU:    "Motor Unit",
  FTO:   "Field Training",
};

const UNIT_COLOR: Partial<Record<PoliceUnit, string>> = {
  ASD:   "#4a90e2",
  CID:   "#e24b4a",
  HEAT:  "#c084fc",
  METRO: "#e8c97e",
  MU:    "#3dd68c",
  FTO:   "#f97316",
};

const RANK_ORDER: Record<string, number> = {
  CADET: 1, SOLO_CADET: 2, OFFICER: 3, OFFICER_1: 4, OFFICER_2: 5,
  OFFICER_3: 6, SENIOR_OFFICER: 7, CORPORAL: 8, SERGEANT: 9,
  LIEUTENANT: 10, CAPTAIN: 11, ASSISTANT_CHIEF: 12, CHIEF: 13, COMMISSIONER: 14,
};

// ── NavItem ────────────────────────────────────────────────────────────────

function NavItem({ href, label, Icon, active, badge }: {
  href: string; label: string; Icon: React.ElementType; active: boolean; badge?: number;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={href}
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
      <span className="font-mono text-[11px] tracking-[1px] uppercase flex-1">{label}</span>
      {(badge ?? 0) > 0 && (
        <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: "#e8c97e", color: "#0a0d12", minWidth: 16, textAlign: "center" }}>
          {badge}
        </span>
      )}
    </Link>
  );
}

// ── UnitDropdown ───────────────────────────────────────────────────────────

function UnitDropdown({
  unit, pathname, extraItems, pendingCount, itemBadges,
}: {
  unit: PoliceUnit;
  pathname: string;
  extraItems?: { label: string; href: string; Icon: React.ElementType }[];
  pendingCount?: number;
  itemBadges?: Record<string, number>;
}) {
  const pages = UNIT_PAGES[unit];
  const label = UNIT_LABEL[unit] ?? unit;
  const color = UNIT_COLOR[unit] ?? "#5a7a9a";
  const allItems = [...(pages ?? []), ...(extraItems ?? [])];

  const isAnyActive = allItems.some((p) => pathname === p.href || pathname.startsWith(p.href));
  const [open, setOpen] = useState(isAnyActive);

  useEffect(() => {
    if (isAnyActive) setOpen(true);
  }, [isAnyActive]);

  if (!pages) return null;

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md transition-colors"
        style={{
          background: isAnyActive ? `${color}10` : "transparent",
          color: isAnyActive ? color : "#5a7a9a",
          borderLeft: isAnyActive ? `2px solid ${color}` : "2px solid transparent",
        }}
      >
        <span className="font-mono text-[11px] tracking-[1px] uppercase flex-1 text-left">{label}</span>
        {(pendingCount ?? 0) > 0 && (
          <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: "#e8c97e", color: "#0a0d12", minWidth: 16, textAlign: "center" }}>
            {pendingCount}
          </span>
        )}
        {open
          ? <ChevronDown className="w-3 h-3 shrink-0" />
          : <ChevronRight className="w-3 h-3 shrink-0" />}
      </button>
      {open && (
        <div className="ml-3 mt-0.5 space-y-0.5" style={{ borderLeft: `1px solid ${color}33`, paddingLeft: 8 }}>
          {allItems.map(({ label: lbl, href, Icon }) => (
            <NavItem key={href} href={href} label={lbl} Icon={Icon}
              active={pathname === href || (href !== "/" && pathname.startsWith(href))}
              badge={itemBadges?.[href]} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── PoliceChatDropdown ─────────────────────────────────────────────────────

function PoliceChatDropdown({ pathname, myLevel, isCommand }: {
  pathname: string; myLevel: number; isCommand: boolean;
}) {
  const channels = [
    { id: "POLICE_GENERAL",     label: "# geral",       minLevel: 0 },
    { id: "POLICE_CADET",       label: "# cadet",       minLevel: 0 },
    { id: "POLICE_SUPERVISION", label: "# supervision", minLevel: 7 },
    { id: "POLICE_HC",          label: "# hc",          minLevel: 9 },
  ].filter((c) => isCommand || myLevel >= c.minLevel);

  const isAnyActive = channels.some((c) => pathname === `/police/chat/${c.id}`);
  const [open, setOpen] = useState(isAnyActive);

  useEffect(() => { if (isAnyActive) setOpen(true); }, [isAnyActive]);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md transition-colors"
        style={{
          background: isAnyActive ? "#1a2210" : "transparent",
          color:      isAnyActive ? "#e8c97e" : "#5a7a9a",
          borderLeft: isAnyActive ? "2px solid #e8c97e" : "2px solid transparent",
        }}
      >
        <MessageSquare className="w-4 h-4 shrink-0" />
        <span className="font-mono text-[11px] tracking-[1px] uppercase flex-1 text-left">Chat</span>
        {open ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
      </button>
      {open && (
        <div className="ml-3 mt-0.5 space-y-0.5" style={{ borderLeft: "1px solid #e8c97e33", paddingLeft: 8 }}>
          {channels.map((c) => {
            const active = pathname === `/police/chat/${c.id}`;
            return (
              <Link key={c.id} href={`/police/chat/${c.id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-md transition-colors"
                style={{
                  background: active ? "#1a2210" : "transparent",
                  color:      active ? "#e8c97e" : "#5a7a9a",
                  borderLeft: active ? "2px solid #e8c97e" : "2px solid transparent",
                }}>
                <Hash className="w-3 h-3 shrink-0" />
                <span className="font-mono text-[11px] tracking-[0.5px]">{c.label.replace("# ", "")}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── LogoutButton ───────────────────────────────────────────────────────────

function LogoutButton({ onLogout }: { onLogout: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onLogout}
      className="flex items-center gap-3 w-full px-3 py-2 rounded-md font-mono text-[11px] tracking-[1px] uppercase transition-colors"
      style={{ color: hovered ? "#e24b4a" : "#5a7a9a", background: hovered ? "#2a0a0a" : "transparent" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <LogOut className="w-4 h-4 shrink-0" />
      Sair
    </button>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();
  const { officerId, rank, units, canApprove, isCommand } = useOfficer();
  const [pendingRolecall,  setPendingRolecall]  = useState(0);
  const [flightsPending,   setFlightsPending]   = useState(0);
  const [reportsPending,   setReportsPending]   = useState(0);

  const canSeeFlights = user?.role === "LEAD" || user?.role === "ADM";
  const canSeeReports = user?.role === "LEAD" || user?.role === "ADM" || user?.role === "SUPERVISOR";

  useEffect(() => {
    api.get<{ count: number }>("/rolecall/pending/count", 30)
      .then((r) => setPendingRolecall(r.count))
      .catch(() => {});

    if (canSeeFlights) {
      api.get<{ count: number }>("/flights/pending/count")
        .then((r) => setFlightsPending(r.count))
        .catch(() => {});
    }
    if (canSeeReports) {
      api.get<{ count: number }>("/reports/pending/count")
        .then((r) => setReportsPending(r.count))
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const unitPending: Record<string, number> = {
    ASD: flightsPending + reportsPending,
  };

  const asdItemBadges: Record<string, number> = {};
  if (flightsPending > 0)  asdItemBadges["/flights"] = flightsPending;
  if (reportsPending > 0)  asdItemBadges["/reports"] = reportsPending;

  const myLevel      = rank ? (RANK_ORDER[rank] ?? 0) : 0;
  const isSergeant   = myLevel >= 9;
  const isAdmin      = isCommand || user?.role === "LEAD" || user?.role === "ADM";

  // Command (badge 100/200/300) vê todas as unidades; outros só a própria
  const ALL_UNITS = (Object.keys(UNIT_PAGES) as PoliceUnit[])
    .sort((a, b) => (UNIT_LABEL[a] ?? a).localeCompare(UNIT_LABEL[b] ?? b));
  const visibleUnits = isCommand
    ? ALL_UNITS
    : units.filter((u) => u in UNIT_PAGES)
        .sort((a, b) => (UNIT_LABEL[a] ?? a).localeCompare(UNIT_LABEL[b] ?? b));

  // Painel Admin aparece no final do dropdown de qualquer unidade para LEAD/ADM
  const adminItem = { label: "Painel Admin", Icon: Shield };
  const unitAdminHref: Partial<Record<PoliceUnit, string>> = {
    ASD:   "/admin",
    CID:   "/cid/admin",
    HEAT:  "/heat/admin",
    MU:    "/mu/admin",
    FTO:   "/fto/admin",
    METRO: "/metro/admin",
  };
  function extraForUnit(u: PoliceUnit) {
    if (!isAdmin) return undefined;
    const href = unitAdminHref[u];
    return href ? [{ ...adminItem, href }] : undefined;
  }

  return (
    <aside className="flex flex-col w-56 h-screen shrink-0 sticky top-0"
      style={{ background: "#0d1117", borderRight: "1px solid #1c2a3a" }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4"
        style={{ borderBottom: "1px solid #1c2a3a" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://static.wikia.nocookie.net/revorz/images/5/57/Lspdlogo.png/revision/latest/scale-to-width-down/1200?cb=20231105110531&path-prefix=tr"
          alt="LSPD"
          width={76}
          height={76}
          style={{ objectFit: "contain", filter: "drop-shadow(0 0 10px #e8c97e55)" }}
        />
        <div>
          <div className="font-mono text-[14px] font-bold leading-none tracking-widest" style={{ color: "#e8c97e" }}>
            LOS SANTOS
          </div>
          <div className="font-mono text-[12px] mt-1.5 tracking-[1px] uppercase" style={{ color: "#5a7a9a" }}>
            Police Dept.
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-2 px-4 py-2"
        style={{ borderBottom: "1px solid #1c2a3a", background: "#0a0d12" }}>
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#3dd68c" }} />
        <span className="font-mono text-[9px] tracking-[2px] uppercase" style={{ color: "#3dd68c" }}>
          Sistema Online
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#1c2a3a transparent" }}>

        {/* Seção Polícia — sempre visível */}
        <div className="px-3 pb-1">
          <span className="text-[9px] font-mono tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>
            Polícia
          </span>
        </div>
        <NavItem href="/police/dashboard" label="Dashboard"  Icon={LayoutDashboard} active={pathname.startsWith("/police/dashboard")} />
        <NavItem href="/police/roster"    label="Roster"     Icon={Users}           active={pathname.startsWith("/police/roster")} />
        <NavItem href="/police/briefings" label="Briefings"  Icon={ClipboardList}   active={pathname.startsWith("/police/briefings")} />
        <NavItem href="/police/badges"    label="Badges"     Icon={BadgeCheck}      active={pathname.startsWith("/police/badges")} />
        <NavItem href="/police/documents" label="Documentos" Icon={BookOpen} active={pathname.startsWith("/police/documents")} />

        {/* Chat dropdown */}
        <PoliceChatDropdown pathname={pathname} myLevel={myLevel} isCommand={isCommand} />

        {/* Role Call */}
        <Link href="/police/rolecall"
          className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors"
          style={{
            background: pathname.startsWith("/police/rolecall") ? "#1a1020" : "transparent",
            color:      pathname.startsWith("/police/rolecall") ? "#c084fc" : "#5a7a9a",
            borderLeft: pathname.startsWith("/police/rolecall") ? "2px solid #c084fc" : "2px solid transparent",
          }}>
          <UserCheck className="w-4 h-4 shrink-0" />
          <span className="font-mono text-[11px] tracking-[1px] uppercase flex-1">Role Call</span>
          {(canApprove || isCommand) && pendingRolecall > 0 && (
            <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: "#c084fc", color: "#0a0d12", minWidth: 18, textAlign: "center" }}>
              {pendingRolecall}
            </span>
          )}
        </Link>

        {/* Cadastrar Oficial — Sergeant+ */}
        {(isSergeant || isCommand) && (
          <NavItem href="/register" label="Cadastrar Oficial" Icon={UserPlus} active={pathname === "/register"} />
        )}

        {/* Seção Unidades */}
        {visibleUnits.length > 0 && (
          <>
            <div className="my-2 mx-3" style={{ borderTop: "1px solid #1c2a3a" }} />
            <div className="px-3 py-1">
              <span className="text-[9px] font-mono tracking-[2px] uppercase" style={{ color: "#5a7a9a" }}>
                Unidades
              </span>
            </div>
            {visibleUnits.map((u) => (
              <UnitDropdown
                key={u}
                unit={u}
                pathname={pathname}
                extraItems={extraForUnit(u)}
                pendingCount={unitPending[u] ?? 0}
                itemBadges={u === "ASD" ? asdItemBadges : undefined}
              />
            ))}
          </>
        )}
      </nav>

      {/* User info + Logout + Configurações */}
      <div className="px-3 py-3" style={{ borderTop: "1px solid #1c2a3a" }}>
        {user && officerId ? (
          <Link href={`/police/roster/${officerId}`}
            className="block px-3 py-2 mb-1 rounded transition-colors"
            style={{ background: "#0a0d12" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#111823")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#0a0d12")}>
            <p className="font-mono text-[11px] font-bold truncate" style={{ color: "#c8d6e5" }}>{user.name}</p>
            <p className="font-mono text-[9px] tracking-[1.5px] uppercase truncate" style={{ color: "#5a7a9a" }}>
              {user.role} · ver perfil
            </p>
          </Link>
        ) : user ? (
          <div className="px-3 py-2 mb-1 rounded" style={{ background: "#0a0d12" }}>
            <p className="font-mono text-[11px] font-bold truncate" style={{ color: "#c8d6e5" }}>{user.name}</p>
            <p className="font-mono text-[9px] tracking-[1.5px] uppercase truncate" style={{ color: "#5a7a9a" }}>{user.role}</p>
          </div>
        ) : null}

        <div className="flex items-center gap-1">
          <div className="flex-1">
            <LogoutButton onLogout={() => { logout(); router.push("/login"); }} />
          </div>
          <Link
            href="/settings"
            className="p-2 rounded-md transition-colors shrink-0"
            title="Configurações"
            style={{
              color: pathname === "/settings" ? "#e8c97e" : "#5a7a9a",
              background: pathname === "/settings" ? "#1a2210" : "transparent",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#c8d6e5"; e.currentTarget.style.background = "#111823"; }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = pathname === "/settings" ? "#e8c97e" : "#5a7a9a";
              e.currentTarget.style.background = pathname === "/settings" ? "#1a2210" : "transparent";
            }}
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
