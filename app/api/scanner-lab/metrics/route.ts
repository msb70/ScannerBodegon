import { NextResponse } from "next/server";

import { getScannerMetrics } from "@/lib/scanner-lab/repository";

export const dynamic = "force-dynamic";

function emptyMetrics() {
  return {
    configured: false,
    totalScans: 0,
    foundCount: 0,
    notFoundCount: 0,
    errorCount: 0,
    hitRate: 0,
    recentScans: [],
    recentFound: [],
    recentMissing: [],
    missingCodes: [],
    sourceBreakdown: []
  };
}

export async function GET() {
  try {
    const metrics = await getScannerMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Scanner Lab metrics failed", error);
    return NextResponse.json(emptyMetrics());
  }
}
