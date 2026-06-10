"use client";
import { useUnitGuard } from "@/hooks/useUnitGuard";
import { UnitPageShell } from "@/components/units/UnitPageShell";

export default function METROAdminPage() {
  const blocked = useUnitGuard("METRO");
  if (blocked) return null;
  return <UnitPageShell unit="METRO" page="admin" />;
}
