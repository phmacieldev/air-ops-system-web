"use client";
import { useUnitGuard } from "@/hooks/useUnitGuard";
import { UnitPageShell } from "@/components/units/UnitPageShell";

export default function FTORosterPage() {
  const blocked = useUnitGuard("FTO");
  if (blocked) return null;
  return <UnitPageShell unit="FTO" page="roster" />;
}
