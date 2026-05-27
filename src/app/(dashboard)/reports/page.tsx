"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PerformanceReport } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const RANK_THRESHOLDS = [
  { label: "PILOT_SENIOR", min: 1000, color: "text-yellow-300" },
  { label: "PILOT_PLENO", min: 600, color: "text-primary" },
  { label: "PILOT_STANDARD", min: 200, color: "text-blue-300" },
  { label: "TRAINEE", min: 0, color: "text-muted-foreground" },
];

function ScoreBar({ score }: { score: number }) {
  const maxScore = 1200;
  const pct = Math.min((score / maxScore) * 100, 100);
  const tier = RANK_THRESHOLDS.find((t) => score >= t.min)!;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${tier.color}`}>{tier.label}</span>
        <span className="text-xs text-muted-foreground">{score} pts</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [reports, setReports] = useState<PerformanceReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<PerformanceReport[]>("/reports")
      .then(setReports)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatórios de Desempenho</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {reports.length} relatórios
        </p>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/10 hover:bg-muted/10 border-border">
              <TableHead className="text-muted-foreground">Piloto</TableHead>
              <TableHead className="text-muted-foreground">Apreensões</TableHead>
              <TableHead className="text-muted-foreground">Perseguições</TableHead>
              <TableHead className="text-muted-foreground">Operações</TableHead>
              <TableHead className="text-muted-foreground">Acidentes</TableHead>
              <TableHead className="text-muted-foreground w-48">Score</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum relatório encontrado.
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id} className="border-border hover:bg-muted/5">
                  <TableCell>
                    <p className="font-mono font-semibold text-primary text-sm">
                      {report.pilotCallsign}
                    </p>
                    <p className="text-xs text-muted-foreground">{report.pilotName}</p>
                  </TableCell>
                  <TableCell className="text-foreground">{report.seizures}</TableCell>
                  <TableCell className="text-foreground">{report.chases}</TableCell>
                  <TableCell className="text-foreground">{report.operations}</TableCell>
                  <TableCell className="text-destructive">{report.accidents}</TableCell>
                  <TableCell>
                    <ScoreBar score={report.score} />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        report.status === "APPROVED"
                          ? "text-green-400 border-green-400/30 bg-green-400/10"
                          : "text-primary border-primary/30 bg-primary/10"
                      }
                    >
                      {report.status === "APPROVED" ? "Aprovado" : "Pendente"}
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
