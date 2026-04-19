import { NextResponse } from "next/server";

import { lookupScannerCatalog } from "@/lib/scanner-lab/catalog";
import { persistScannerLookup } from "@/lib/scanner-lab/repository";

export const dynamic = "force-dynamic";

function getPersistenceErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const text = error.message.toLowerCase();

    if (text.includes("enotfound") || text.includes("getaddrinfo") || text.includes("fetch failed")) {
      return "No se pudo conectar con Supabase. Verifica que el proyecto exista y que la URL configurada sea correcta.";
    }

    return error.message;
  }

  if (error && typeof error === "object") {
    const maybeError = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };

    const parts = [maybeError.message, maybeError.details, maybeError.hint].filter(Boolean);
    if (parts.length > 0) return parts.join(" ");
    if (maybeError.code) return `Error de base de datos: ${maybeError.code}`;
  }

  return "No se pudo guardar el escaneo.";
}

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
      console.error("Scanner Lab persist failed", error);
      persistenceError = getPersistenceErrorMessage(error);
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
