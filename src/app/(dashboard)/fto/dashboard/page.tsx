"use client";
import { UnitGate } from "@/components/UnitGate";
import { UnitDashboard } from "@/components/units/UnitDashboard";

export default function FTODashboardPage() {
  return <UnitGate unit="FTO"><UnitDashboard unit="FTO" /></UnitGate>;
}
