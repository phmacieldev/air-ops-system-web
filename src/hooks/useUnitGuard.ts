"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOfficer } from "@/context/OfficerContext";
import { PoliceUnit } from "@/types";

export function useUnitGuard(requiredUnit: PoliceUnit): boolean {
  const { units, isCommand, loading } = useOfficer();
  const router = useRouter();

  const hasAccess = isCommand || units.includes(requiredUnit);

  useEffect(() => {
    if (!loading && !hasAccess) {
      router.replace("/police/dashboard");
    }
  }, [loading, hasAccess, router]);

  return loading || !hasAccess;
}
