"use client";
import { useUnitGuard } from "@/hooks/useUnitGuard";
import { UnitPageShell } from "@/components/units/UnitPageShell";

export default function HEATDocumentsPage() {
  const blocked = useUnitGuard("HEAT");
  if (blocked) return null;
  return <UnitPageShell unit="HEAT" page="documents" />;
}
