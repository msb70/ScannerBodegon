"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { formatCurrency } from "@/lib/business";
import { useRequireUser } from "@/lib/auth";
import { getErrorMessage } from "@/lib/errors";
import { getDashboardSummary } from "@/lib/productos";
import type { DashboardSummary } from "@/lib/types";

export default function DashboardPage() {
  const { user, loading: authLoading } = useRequireUser();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getDashboardSummary(user.id)
      .then(setSummary)
      .catch((err) => setError(getErrorMessage(err, "No se pudo cargar el dashboard.")));
  }, [user]);

  if (authLoading) {
    return <div className="grid min-h-screen place-items-center bg-slate-100">Cargando sesión...</div>;
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6">
          <p className="text-sm font-semibold text-teal-700">Dashboard</p>
          <h1 className="text-3xl font-bold text-slate-950">Resumen operativo</h1>
        </div>

        {error && <p className="rounded-2xl bg-red-50 p-4 text-red-700">{error}</p>}
        {!summary && !error && <p className="rounded-2xl bg-white p-4 text-slate-500">Cargando métricas...</p>}

        {summary && (
          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">Ventas totales</p>
                <p className="mt-3 text-3xl font-bold text-slate-950">
                  {formatCurrency(summary.ventasTotal)}
                </p>
              </div>
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">Tickets</p>
                <p className="mt-3 text-3xl font-bold text-slate-950">{summary.ventasCount}</p>
              </div>
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">Productos</p>
                <p className="mt-3 text-3xl font-bold text-slate-950">{summary.productosCount}</p>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-950">Productos más vendidos</h2>
                <div className="mt-5 space-y-3">
                  {summary.topProductos.length === 0 && (
                    <p className="text-slate-500">Aún no hay ventas registradas.</p>
                  )}
                  {summary.topProductos.map((product) => (
                    <div key={product.producto_id} className="flex justify-between rounded-2xl bg-slate-50 p-4">
                      <div>
                        <p className="font-semibold text-slate-950">{product.nombre}</p>
                        <p className="text-sm text-slate-500">{product.cantidad} unidades</p>
                      </div>
                      <p className="font-bold text-slate-950">{formatCurrency(product.total)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-950">Stock bajo</h2>
                <div className="mt-5 space-y-3">
                  {summary.lowStock.length === 0 && (
                    <p className="text-slate-500">No hay productos en nivel bajo.</p>
                  )}
                  {summary.lowStock.map((product) => (
                    <div key={product.id} className="flex justify-between rounded-2xl bg-amber-50 p-4">
                      <div>
                        <p className="font-semibold text-slate-950">{product.nombre}</p>
                        <p className="text-sm text-slate-500">{product.codigo}</p>
                      </div>
                      <p className="font-bold text-amber-700">{product.stock}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </AppShell>
  );
}
