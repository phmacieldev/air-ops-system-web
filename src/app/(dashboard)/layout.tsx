"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { Menu, X } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // fecha o menu ao trocar de rota
  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <div className="min-h-screen" style={{ background: "#0a0d12" }} />;
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen" style={{ background: "#0a0d12" }}>

      {/* Sidebar desktop — oculta abaixo de md */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar mobile — slide-in */}
      <div
        className="fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-200"
        style={{ transform: open ? "translateX(0)" : "translateX(-100%)" }}
      >
        <Sidebar />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar desktop */}
        <div
          className="hidden md:flex items-center justify-end px-4 py-2 shrink-0"
          style={{ background: "#0d1117", borderBottom: "1px solid #1c2a3a" }}
        >
          <NotificationBell />
        </div>

        {/* Topbar mobile */}
        <div
          className="flex md:hidden items-center gap-3 px-4 py-3 shrink-0"
          style={{ background: "#0d1117", borderBottom: "1px solid #1c2a3a" }}
        >
          <button
            onClick={() => setOpen(true)}
            className="p-1.5 rounded"
            style={{ color: "#5a7a9a" }}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span
            className="flex-1 font-mono text-[11px] font-bold tracking-widest uppercase"
            style={{ color: "#e8c97e" }}
          >
            Air Support Division
          </span>
          <NotificationBell />
        </div>

        <main className="flex-1 flex flex-col overflow-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
