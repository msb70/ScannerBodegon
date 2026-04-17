import { NextResponse } from "next/server";

import { lookupScannerCatalog } from "@/lib/scanner-lab/catalog";
import { persistScannerLookup } from "@/lib/scanner-lab/repository";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { code?: string };
    const rawCode = typeof payload.code === "string" ? payload.code.trim() : "";

    if (!rawCode) {
      return NextResponse.json(
        { error: "Debes enviar un código de barras para consultar." },
        { status: 400 }
      );
    }

    const lookup = await lookupScannerCatalog(rawCode);
    let record = null;
    let persistenceError: string | null = null;

    try {
      record = await persistScannerLookup(rawCode, lookup);
    } catch (error) {
      persistenceError = error instanceof Error ? error.message : "No se pudo guardar el escaneo.";
    }

    return NextResponse.json({
      lookup,
      record,
      persisted: Boolean(record),
      persistenceError
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo procesar el escaneo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
