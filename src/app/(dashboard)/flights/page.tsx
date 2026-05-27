"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { FlightLog } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const statusColors: Record<string, string> = {
  APPROVED: "text-green-400 border-green-400/30 bg-green-400/10",
  REJECTED: "text-destructive border-destructive/30 bg-destructive/10",
  PENDING: "text-primary border-primary/30 bg-primary/10",
};

const statusLabel: Record<string, string> = {
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
  PENDING: "Pendente",
};

function formatDuration(minutes: number | null) {
  if (!minutes) return "—";
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FlightsPage() {
  const [flights, setFlights] = useState<FlightLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<FlightLog[]>("/flights")
      .then(setFlights)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Protocolos de Voo</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {flights.length} registros
        </p>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/10 hover:bg-muted/10 border-border">
              <TableHead className="text-muted-foreground">Piloto</TableHead>
              <TableHead className="text-muted-foreground">Aeronave</TableHead>
              <TableHead className="text-muted-foreground">Tipo</TableHead>
              <TableHead className="text-muted-foreground">Início</TableHead>
              <TableHead className="text-muted-foreground">Duração</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : flights.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum voo registrado.
                </TableCell>
              </TableRow>
            ) : (
              flights.map((flight) => (
                <TableRow key={flight.id} className="border-border hover:bg-muted/5">
                  <TableCell className="font-mono font-semibold text-primary">
                    {flight.pilotCallsign}
                  </TableCell>
                  <TableCell className="text-foreground">{flight.aircraft}</TableCell>
                  <TableCell className="text-foreground">{flight.flightType}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(flight.startedAt)}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {formatDuration(flight.durationMinutes)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[flight.flightStatus]}>
                      {statusLabel[flight.flightStatus] ?? flight.flightStatus}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
