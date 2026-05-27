"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Pilot, FlightLog, PerformanceReport } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plane, FileText, Clock } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [flights, setFlights] = useState<FlightLog[]>([]);
  const [reports, setReports] = useState<PerformanceReport[]>([]);

  useEffect(() => {
    api.get<Pilot[]>("/pilots").then(setPilots).catch(() => {});
    api.get<FlightLog[]>("/flights").then(setFlights).catch(() => {});
    api.get<PerformanceReport[]>("/reports").then(setReports).catch(() => {});
  }, []);

  const activePilots = pilots.filter((p) => p.status === "ACTIVE").length;
  const pendingFlights = flights.filter((f) => f.flightStatus === "PENDING").length;
  const pendingReports = reports.filter((r) => r.status === "PENDING").length;
  const totalFlightHours = Math.floor(
    pilots.reduce((acc, p) => acc + p.flightMinutes, 0) / 60
  );

  const metrics = [
    {
      title: "Pilotos Ativos",
      value: activePilots,
      total: `${pilots.length} total`,
      icon: Users,
    },
    {
      title: "Voos Pendentes",
      value: pendingFlights,
      total: `${flights.length} total`,
      icon: Plane,
    },
    {
      title: "Relatórios Pendentes",
      value: pendingReports,
      total: `${reports.length} total`,
      icon: FileText,
    },
    {
      title: "Horas de Voo",
      value: totalFlightHours,
      total: "horas acumuladas",
      icon: Clock,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Bem-vindo, {user?.name}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {user?.role} — Air Support Division
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map(({ title, value, total, icon: Icon }) => (
          <Card key={title} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {title}
              </CardTitle>
              <Icon className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{total}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent flights */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Últimos Protocolos de Voo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {flights.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum voo registrado.</p>
          ) : (
            <div className="space-y-2">
              {flights.slice(0, 5).map((flight) => (
                <div
                  key={flight.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {flight.pilotCallsign}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {flight.aircraft} · {flight.flightType}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                      flight.flightStatus === "APPROVED"
                        ? "text-green-400 border-green-400/30 bg-green-400/10"
                        : flight.flightStatus === "REJECTED"
                        ? "text-destructive border-destructive/30 bg-destructive/10"
                        : "text-primary border-primary/30 bg-primary/10"
                    }`}
                  >
                    {flight.flightStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
