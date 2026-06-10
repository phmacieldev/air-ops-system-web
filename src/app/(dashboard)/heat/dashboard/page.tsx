"use client";
import { UnitGate } from "@/components/UnitGate";
import { UnitDashboard } from "@/components/units/UnitDashboard";

export default function HEATDashboardPage() {
  return <UnitGate unit="HEAT"><UnitDashboard unit="HEAT" /></UnitGate>;
}
