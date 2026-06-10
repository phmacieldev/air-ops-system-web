"use client";
import { UnitGate } from "@/components/UnitGate";
import { UnitDashboard } from "@/components/units/UnitDashboard";

export default function CIDDashboardPage() {
  return <UnitGate unit="CID"><UnitDashboard unit="CID" /></UnitGate>;
}
