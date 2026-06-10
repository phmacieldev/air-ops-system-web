"use client";
import { UnitGate } from "@/components/UnitGate";
import { UnitDashboard } from "@/components/units/UnitDashboard";

export default function MUDashboardPage() {
  return <UnitGate unit="MU"><UnitDashboard unit="MU" /></UnitGate>;
}
