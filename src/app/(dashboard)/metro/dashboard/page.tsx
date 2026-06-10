"use client";
import { UnitGate } from "@/components/UnitGate";
import { UnitDashboard } from "@/components/units/UnitDashboard";

export default function METRODashboardPage() {
  return <UnitGate unit="METRO"><UnitDashboard unit="METRO" /></UnitGate>;
}
