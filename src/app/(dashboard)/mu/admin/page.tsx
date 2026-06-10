"use client";
import { useUnitGuard } from "@/hooks/useUnitGuard";
import { UnitPageShell } from "@/components/units/UnitPageShell";

export default function MUAdminPage() {
  const blocked = useUnitGuard("MU");
  if (blocked) return null;
  return <UnitPageShell unit="MU" page="admin" />;
}
