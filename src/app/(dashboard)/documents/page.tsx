"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Document } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, FileText } from "lucide-react";

const categoryIcons: Record<string, string> = {
  SOP: "📋",
  Manual: "📖",
  Avaliação: "📝",
  Certificado: "🏅",
};

function getCategoryIcon(category: string) {
  const key = Object.keys(categoryIcons).find((k) =>
    category.toLowerCase().includes(k.toLowerCase())
  );
  return key ? categoryIcons[key] : "📄";
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Document[]>("/documents")
      .then(setDocuments)
      .finally(() => setLoading(false));
  }, []);

  const grouped = documents.reduce<Record<string, Document[]>>((acc, doc) => {
    const cat = doc.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Documentos Operacionais</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Acesse os documentos oficiais da ASD
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhum documento cadastrado.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([category, docs]) => (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getCategoryIcon(category)}</span>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {category}
              </h2>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {docs.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <Card className="bg-card border-border hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                          {doc.title}
                        </CardTitle>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Badge
                        variant="outline"
                        className="text-xs text-primary border-primary/30 bg-primary/5"
                      >
                        {doc.category}
                      </Badge>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
