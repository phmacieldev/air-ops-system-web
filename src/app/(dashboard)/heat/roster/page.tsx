"use client";
import { useUnitGuard } from "@/hooks/useUnitGuard";
import { UnitPageShell } from "@/components/units/UnitPageShell";

export default function HEATRosterPage() {
  const blocked = useUnitGuard("HEAT");
  if (blocked) return null;
  return <UnitPageShell unit="HEAT" page="roster" />;
}
