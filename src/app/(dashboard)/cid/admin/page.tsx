"use client";
import { useUnitGuard } from "@/hooks/useUnitGuard";
import { UnitPageShell } from "@/components/units/UnitPageShell";

export default function CIDAdminPage() {
  const blocked = useUnitGuard("CID");
  if (blocked) return null;
  return <UnitPageShell unit="CID" page="admin" />;
}
