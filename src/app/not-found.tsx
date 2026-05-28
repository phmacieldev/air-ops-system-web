import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "#0a0d12" }}
    >
      {/* Code */}
      <p
        className="font-mono text-[11px] tracking-[4px] uppercase mb-4"
        style={{ color: "#3a5a7a" }}
      >
        Air Support Division · Erro de Navegação
      </p>

      <div
        className="font-mono font-bold leading-none mb-2"
        style={{ fontSize: "clamp(72px, 15vw, 120px)", color: "#1c2a3a" }}
      >
        404
      </div>

      <h1
        className="font-mono text-lg md:text-2xl font-bold tracking-widest uppercase mb-2"
        style={{ color: "#e8c97e" }}
      >
        Rota Não Encontrada
      </h1>

      <p
        className="font-mono text-[12px] tracking-[2px] uppercase mb-8"
        style={{ color: "#5a7a9a" }}
      >
        Retorne à base · A localização solicitada não existe
      </p>

      {/* Divider */}
      <div className="w-24 h-px mb-8" style={{ background: "#1c2a3a" }} />

      <Link
        href="/dashboard"
        className="font-mono text-[12px] tracking-[2px] uppercase px-6 py-3 rounded transition-colors"
        style={{
          background: "#0d1117",
          border: "1px solid #e8c97e44",
          color: "#e8c97e",
        }}
      >
        ← Voltar à Base
      </Link>

      <p
        className="font-mono text-[10px] mt-8 tracking-[1px]"
        style={{ color: "#1c2a3a" }}
      >
        ASD · LSPD Air Support Division
      </p>
    </div>
  );
}
