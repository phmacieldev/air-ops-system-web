"use client";
import { useUnitGuard } from "@/hooks/useUnitGuard";
import { UnitPageShell } from "@/components/units/UnitPageShell";

export default function CIDRosterPage() {
  const blocked = useUnitGuard("CID");
  if (blocked) return null;
  return <UnitPageShell unit="CID" page="roster" />;
}
