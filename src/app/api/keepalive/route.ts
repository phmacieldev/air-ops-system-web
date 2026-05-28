import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Called by Vercel Cron (vercel.json) every 5 minutes to prevent the
// Render free-tier backend from going idle.
export async function GET() {
  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

  try {
    const res = await fetch(`${backendUrl}/swagger-ui.html`, {
      signal: AbortSignal.timeout(10_000),
    });
    return NextResponse.json({ ok: true, status: res.status, ts: Date.now() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
