import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { getSupabaseServerClient, isSupabaseServerConfigured } from "@/lib/supabase-server";

import {
  SCANNER_SOURCE_LABELS,
  type ScannerLabMetrics,
  type ScannerLabScanRecord,
  type ScannerLabScanRow,
  type ScannerLookupOutput,
  type ScannerLookupStatus
} from "./types";

function toRecord(row: ScannerLabScanRow): ScannerLabScanRecord {
  return {
    id: row.id,
    rawCode: row.raw_code,
    normalizedCode: row.normalized_code,
    status: row.status,
    source: row.source,
    productName: row.product_name,
    brand: row.brand,
    description: row.product_description,
    category: row.category,
    imageUrl: row.image_url,
    kosherHint: row.kosher_hint,
    attempts: Array.isArray(row.api_attempts) ? row.api_attempts : [],
    createdAt: row.created_at
  };
}

function emptyMetrics(): ScannerLabMetrics {
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

function getScannerLabClient() {
  if (isSupabaseAdminConfigured()) return getSupabaseAdmin();
  if (isSupabaseServerConfigured()) return getSupabaseServerClient();
  return null;
}

export async function persistScannerLookup(rawCode: string, lookup: ScannerLookupOutput) {
  const supabase = getScannerLabClient();
  if (!supabase) return null;

  const payload = {
    raw_code: rawCode,
    normalized_code: lookup.codigo,
    status: lookup.status,
    source: lookup.status === "found" ? lookup.product.source : null,
    product_name: lookup.status === "found" ? lookup.product.nombre : null,
    brand: lookup.status === "found" ? lookup.product.marca : null,
    product_description: lookup.status === "found" ? lookup.product.descripcion : null,
    category: lookup.status === "found" ? lookup.product.categoria : null,
    image_url: lookup.status === "found" ? lookup.product.imagen : null,
    kosher_hint: lookup.status === "found" ? lookup.product.kosher : false,
    api_attempts: lookup.attempts
  };

  const { data, error } = await supabase
    .from("scanner_lab_scans")
    .insert(payload)
    .select("*")
    .single<ScannerLabScanRow>();

  if (error) throw error;
  return toRecord(data);
}

export async function getScannerMetrics(): Promise<ScannerLabMetrics> {
  const supabase = getScannerLabClient();
  if (!supabase) return emptyMetrics();

  const [totalResult, foundResult, notFoundResult, errorResult, recentResult, summaryResult] =
    await Promise.all([
      supabase.from("scanner_lab_scans").select("*", { count: "exact", head: true }),
      supabase
        .from("scanner_lab_scans")
        .select("*", { count: "exact", head: true })
        .eq("status", "found"),
      supabase
        .from("scanner_lab_scans")
        .select("*", { count: "exact", head: true })
        .eq("status", "not_found"),
      supabase
        .from("scanner_lab_scans")
        .select("*", { count: "exact", head: true })
        .eq("status", "error"),
      supabase
        .from("scanner_lab_scans")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(24)
        .returns<ScannerLabScanRow[]>(),
      supabase
        .from("scanner_lab_scans")
        .select("normalized_code,status,api_attempts")
        .order("created_at", { ascending: false })
        .limit(500)
        .returns<
          Array<{
            normalized_code: string;
            status: ScannerLookupStatus;
            api_attempts: ScannerLabScanRow["api_attempts"];
          }>
        >()
    ]);

  if (totalResult.error) throw totalResult.error;
  if (foundResult.error) throw foundResult.error;
  if (notFoundResult.error) throw notFoundResult.error;
  if (errorResult.error) throw errorResult.error;
  if (recentResult.error) throw recentResult.error;
  if (summaryResult.error) throw summaryResult.error;

  const recentRows = recentResult.data ?? [];
  const summaryRows = summaryResult.data ?? [];
  const totalScans = totalResult.count ?? recentRows.length;
  const foundCount = foundResult.count ?? 0;
  const notFoundCount = notFoundResult.count ?? 0;
  const errorCount = errorResult.count ?? 0;

  const sourceMap = new Map<
    keyof typeof SCANNER_SOURCE_LABELS,
    { attempts: number; hits: number }
  >();
  const missingMap = new Map<string, number>();

  for (const row of summaryRows) {
    const attempts = Array.isArray(row.api_attempts) ? row.api_attempts : [];

    for (const attempt of attempts) {
      const current = sourceMap.get(attempt.source) ?? { attempts: 0, hits: 0 };
      current.attempts += 1;
      if (attempt.status === "found") current.hits += 1;
      sourceMap.set(attempt.source, current);
    }

    if (row.status === "not_found") {
      missingMap.set(row.normalized_code, (missingMap.get(row.normalized_code) ?? 0) + 1);
    }
  }

  const recentScans = recentRows.map(toRecord);

  return {
    configured: true,
    totalScans,
    foundCount,
    notFoundCount,
    errorCount,
    hitRate: totalScans > 0 ? Math.round((foundCount / totalScans) * 1000) / 10 : 0,
    recentScans,
    recentFound: recentScans.filter((scan) => scan.status === "found").slice(0, 8),
    recentMissing: recentScans.filter((scan) => scan.status === "not_found").slice(0, 8),
    missingCodes: [...missingMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([code, count]) => ({ code, count })),
    sourceBreakdown: [...sourceMap.entries()].map(([source, stats]) => ({
      source,
      label: SCANNER_SOURCE_LABELS[source],
      attempts: stats.attempts,
      hits: stats.hits,
      hitRate: stats.attempts > 0 ? Math.round((stats.hits / stats.attempts) * 1000) / 10 : 0
    }))
  };
}
