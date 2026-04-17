import { NextResponse } from "next/server";

import { getScannerMetrics } from "@/lib/scanner-lab/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const metrics = await getScannerMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudieron cargar las métricas del Scanner Lab.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
