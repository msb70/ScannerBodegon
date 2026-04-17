"use client";

import { useEffect, useMemo, useState } from "react";

import { ScannerInput } from "@/components/scanner-input";
import {
  SCANNER_SOURCE_LABELS,
  type ScannerLabMetrics,
  type ScannerLabScanRecord,
  type ScannerLookupOutput
} from "@/lib/scanner-lab/types";

type LookupResponse = {
  lookup: ScannerLookupOutput;
  record: ScannerLabScanRecord | null;
  persisted: boolean;
  persistenceError: string | null;
};

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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function beep() {
  const AudioContextClass =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  const ctx = new AudioContextClass();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.frequency.value = 880;
  gain.gain.value = 0.03;
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.07);
}

async function getMetrics() {
  const response = await fetch("/api/scanner-lab/metrics", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("No se pudieron cargar las métricas del Scanner Lab.");
  }

  return (await response.json()) as ScannerLabMetrics;
}

export function ScannerLabClient() {
  const [scanValue, setScanValue] = useState("");
  const [metrics, setMetrics] = useState<ScannerLabMetrics>(emptyMetrics);
  const [lookup, setLookup] = useState<LookupResponse | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMetrics()
      .then(setMetrics)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar los datos."))
      .finally(() => setLoadingMetrics(false));
  }, []);

  const headline = useMemo(() => {
    if (!lookup) return "Escanea un producto y mide la cobertura real de tu catálogo abierto.";
    if (lookup.lookup.status === "found") return "Producto encontrado en catálogos abiertos.";
    if (lookup.lookup.status === "not_found") return "Producto no encontrado. Queda registrado para seguimiento.";
    return "La búsqueda falló en todas las fuentes configuradas.";
  }, [lookup]);

  async function refreshMetrics() {
    const nextMetrics = await getMetrics();
    setMetrics(nextMetrics);
  }

  async function handleScan(code: string) {
    setScanning(true);
    setError(null);

    try {
      const response = await fetch("/api/scanner-lab/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "No se pudo consultar el código.");
      }

      const payload = (await response.json()) as LookupResponse;
      setLookup(payload);
      beep();
      await refreshMetrics();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo consultar el código.");
    } finally {
      setScanning(false);
    }
  }

  const activeSource =
    lookup?.lookup.status === "found" ? SCANNER_SOURCE_LABELS[lookup.lookup.product.source] : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f3f5f8_0%,#eef1f5_35%,#e6eaf0_100%)] text-slate-950">
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <header className="mb-8 flex flex-col gap-6 rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex rounded-full border border-slate-300/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Scanner Lab
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Módulo standalone para validar la eficacia del escáner antes de integrarlo al POS.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              {headline}
            </p>
          </div>

          <div className="grid min-w-[260px] gap-3 rounded-[1.75rem] border border-slate-200/80 bg-slate-950 p-5 text-white">
            <div>
              <p className="text-sm text-slate-400">Efectividad total</p>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.04em]">{metrics.hitRate}%</p>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Encontrados</span>
              <span>{metrics.foundCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>No encontrados</span>
              <span>{metrics.notFoundCount}</span>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">Escaneo en vivo</p>
                  <h2 className="text-2xl font-semibold tracking-[-0.03em]">Prueba operativa</h2>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                  {metrics.configured ? "Persistencia activa" : "Modo demo sin base de datos"}
                </span>
              </div>

              <ScannerInput
                value={scanValue}
                onChange={setScanValue}
                onScan={handleScan}
                disabled={scanning}
                placeholder="Escanea o escribe un EAN / UPC y presiona Enter"
              />

              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1">Open Food Facts</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">Open Beauty Facts</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">Open Pet Food Facts</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">UPCitemdb</span>
              </div>

              {error && (
                <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </p>
              )}

              {lookup?.persistenceError && (
                <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                  Búsqueda completada, pero el registro no pudo guardarse: {lookup.persistenceError}
                </p>
              )}

              {lookup && (
                <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
                  <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-100">
                    {lookup.lookup.status === "found" && lookup.lookup.product.imagen ? (
                      <img
                        src={lookup.lookup.product.imagen}
                        alt={lookup.lookup.product.nombre}
                        className="h-full min-h-[220px] w-full object-cover"
                      />
                    ) : (
                      <div className="grid min-h-[220px] place-items-center bg-[linear-gradient(145deg,#f8fafc,#e2e8f0)] p-6 text-center">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                            Código
                          </p>
                          <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-800">
                            {lookup.lookup.codigo}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/90 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="max-w-2xl">
                        <p className="text-sm font-medium text-slate-500">Resultado más reciente</p>
                        <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
                          {lookup.lookup.status === "found"
                            ? lookup.lookup.product.nombre
                            : lookup.lookup.message ?? "Sin resultado"}
                        </h3>
                      </div>
                      <span
                        className={
                          lookup.lookup.status === "found"
                            ? "rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700"
                            : lookup.lookup.status === "not_found"
                              ? "rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700"
                              : "rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700"
                        }
                      >
                        {lookup.lookup.status === "found"
                          ? "Encontrado"
                          : lookup.lookup.status === "not_found"
                            ? "No encontrado"
                            : "Error"}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Fuente</p>
                        <p className="mt-2 text-base font-medium text-slate-800">
                          {activeSource ?? "Sin coincidencia"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Marca</p>
                        <p className="mt-2 text-base font-medium text-slate-800">
                          {lookup.lookup.status === "found"
                            ? lookup.lookup.product.marca ?? "No disponible"
                            : "No disponible"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Categoría</p>
                        <p className="mt-2 text-base font-medium text-slate-800">
                          {lookup.lookup.status === "found"
                            ? lookup.lookup.product.categoria ?? "No disponible"
                            : "No disponible"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Kosher hint</p>
                        <p className="mt-2 text-base font-medium text-slate-800">
                          {lookup.lookup.status === "found"
                            ? lookup.lookup.product.kosher
                              ? "Marcadores kosher detectados"
                              : "Sin marcadores kosher"
                            : "No aplica"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Descripción</p>
                      <p className="mt-2 text-base leading-7 text-slate-600">
                        {lookup.lookup.status === "found"
                          ? lookup.lookup.product.descripcion ??
                            "La fuente abierta no expone descripción útil para este código."
                          : lookup.lookup.message ?? "Sin descripción disponible."}
                      </p>
                    </div>

                    <div className="mt-5 border-t border-slate-200 pt-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Rastreo de fuentes</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {lookup.lookup.attempts.map((attempt) => (
                          <span
                            key={`${attempt.source}-${attempt.status}`}
                            className={
                              attempt.status === "found"
                                ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                                : attempt.status === "not_found"
                                  ? "rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                                  : "rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
                            }
                          >
                            {SCANNER_SOURCE_LABELS[attempt.source]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Escaneos", value: metrics.totalScans },
                { label: "Encontrados", value: metrics.foundCount },
                { label: "No encontrados", value: metrics.notFoundCount },
                { label: "Errores", value: metrics.errorCount }
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[1.75rem] border border-white/70 bg-white/75 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur"
                >
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="mt-3 text-4xl font-semibold tracking-[-0.05em]">{stat.value}</p>
                </div>
              ))}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="mb-5 flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">Dashboard</p>
                  <h2 className="text-2xl font-semibold tracking-[-0.03em]">Efectividad por fuente</h2>
                </div>
                {loadingMetrics && <span className="text-sm text-slate-400">Cargando...</span>}
              </div>

              <div className="space-y-4">
                {metrics.sourceBreakdown.length === 0 && (
                  <p className="text-sm leading-6 text-slate-500">
                    Aún no hay datos suficientes para comparar fuentes.
                  </p>
                )}

                {metrics.sourceBreakdown.map((source) => (
                  <div key={source.source} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{source.label}</span>
                      <span className="text-slate-500">
                        {source.hits}/{source.attempts} hits
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-slate-950 transition-[width]"
                        style={{ width: `${Math.min(source.hitRate, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs font-medium text-slate-500">{source.hitRate}% de efectividad</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">No encontrados frecuentes</h2>
              <div className="mt-5 space-y-3">
                {metrics.missingCodes.length === 0 && (
                  <p className="text-sm leading-6 text-slate-500">
                    Cuando un código falle, aparecerá aquí para priorizar nuevas fuentes o carga manual.
                  </p>
                )}
                {metrics.missingCodes.map((item) => (
                  <div key={item.code} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="font-medium text-slate-800">{item.code}</span>
                    <span className="text-sm text-slate-500">{item.count} intento(s)</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">Bitácora reciente</h2>
              <div className="mt-5 space-y-3">
                {metrics.recentScans.length === 0 && (
                  <p className="text-sm leading-6 text-slate-500">
                    Aquí verás tanto los encontrados como los no encontrados.
                  </p>
                )}
                {metrics.recentScans.map((scan) => (
                  <div key={scan.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {scan.productName ?? scan.normalizedCode}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{formatDate(scan.createdAt)}</p>
                      </div>
                      <span
                        className={
                          scan.status === "found"
                            ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                            : scan.status === "not_found"
                              ? "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700"
                              : "rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700"
                        }
                      >
                        {scan.status === "found"
                          ? "Encontrado"
                          : scan.status === "not_found"
                            ? "No encontrado"
                            : "Error"}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-white px-2.5 py-1">{scan.normalizedCode}</span>
                      {scan.source && (
                        <span className="rounded-full bg-white px-2.5 py-1">
                          {SCANNER_SOURCE_LABELS[scan.source]}
                        </span>
                      )}
                      {scan.category && <span className="rounded-full bg-white px-2.5 py-1">{scan.category}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}
