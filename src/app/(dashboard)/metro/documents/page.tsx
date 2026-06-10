"use client";
import { useUnitGuard } from "@/hooks/useUnitGuard";
import { UnitPageShell } from "@/components/units/UnitPageShell";

export default function METRODocumentsPage() {
  const blocked = useUnitGuard("METRO");
  if (blocked) return null;
  return <UnitPageShell unit="METRO" page="documents" />;
}
