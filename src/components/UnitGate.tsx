"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOfficer } from "@/context/OfficerContext";
import { PoliceUnit } from "@/types";

export function UnitGate({ unit, children }: { unit: PoliceUnit; children: React.ReactNode }) {
  const { units, isCommand, loading } = useOfficer();
  const router = useRouter();
  const hasAccess = isCommand || units.includes(unit);

  useEffect(() => {
    if (!loading && !hasAccess) {
      router.replace("/police/dashboard");
    }
  }, [loading, hasAccess, router]);

  if (loading || !hasAccess) return null;
  return <>{children}</>;
}
