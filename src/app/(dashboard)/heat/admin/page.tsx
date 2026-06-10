"use client";
import { useUnitGuard } from "@/hooks/useUnitGuard";
import { UnitPageShell } from "@/components/units/UnitPageShell";

export default function HEATAdminPage() {
  const blocked = useUnitGuard("HEAT");
  if (blocked) return null;
  return <UnitPageShell unit="HEAT" page="admin" />;
}
