"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Pilot } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const statusColors: Record<string, string> = {
  ACTIVE: "text-green-400 border-green-400/30 bg-green-400/10",
  INACTIVE: "text-muted-foreground border-border bg-muted/20",
  SUSPENDED: "text-destructive border-destructive/30 bg-destructive/10",
  TRAINING: "text-primary border-primary/30 bg-primary/10",
};

const statusLabel: Record<string, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  SUSPENDED: "Suspenso",
  TRAINING: "Treinamento",
};

export default function PilotsPage() {
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Pilot[]>("/pilots")
      .then(setPilots)
      .finally(() => setLoading(false));
  }, []);

  const filtered = pilots.filter(
    (p) =>
      p.callsign.toLowerCase().includes(search.toLowerCase()) ||
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.rankName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Roster</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {pilots.length} membros cadastrados
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por callsign, nome ou rank..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/10 hover:bg-muted/10 border-border">
              <TableHead className="text-muted-foreground">Callsign</TableHead>
              <TableHead className="text-muted-foreground">Nome</TableHead>
              <TableHead className="text-muted-foreground">Rank</TableHead>
              <TableHead className="text-muted-foreground">Score</TableHead>
              <TableHead className="text-muted-foreground">Horas de Voo</TableHead>
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
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum piloto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((pilot) => (
                <TableRow key={pilot.id} className="border-border hover:bg-muted/5">
                  <TableCell className="font-mono font-semibold text-primary">
                    {pilot.callsign}
                  </TableCell>
                  <TableCell className="text-foreground">{pilot.fullName}</TableCell>
                  <TableCell className="text-foreground">{pilot.rankName}</TableCell>
                  <TableCell className="text-foreground">{pilot.accumulatedScore}</TableCell>
                  <TableCell className="text-foreground">
                    {pilot.flightMinutes > 0
                      ? `${Math.floor(pilot.flightMinutes / 60)}h ${pilot.flightMinutes % 60}m`
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusColors[pilot.status]}
                    >
                      {statusLabel[pilot.status] ?? pilot.status}
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
