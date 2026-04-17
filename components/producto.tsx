"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/business";
import { resolveProductImageUrl } from "@/lib/productos";
import type { Producto } from "@/lib/types";

type ProductoProps = {
  producto: Producto;
  action?: React.ReactNode;
};

export function ProductoCard({ producto, action }: ProductoProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    resolveProductImageUrl(producto.imagen).then((url) => {
      if (mounted) setImageUrl(url);
    });
    return () => {
      mounted = false;
    };
  }, [producto.imagen]);

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex gap-4 p-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={producto.nombre} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
              Sin foto
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="truncate font-semibold text-slate-950">{producto.nombre}</h3>
              <p className="text-sm text-slate-500">{producto.marca ?? "Sin marca"}</p>
            </div>
            {producto.kosher && (
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
                Kosher
              </span>
            )}
          </div>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-lg font-bold text-slate-950">
                {formatCurrency(producto.precio_venta)}
              </p>
              <p className={producto.stock <= 5 ? "text-sm font-semibold text-amber-600" : "text-sm text-slate-500"}>
                Stock: {producto.stock}
              </p>
            </div>
            {action}
          </div>
        </div>
      </div>
    </article>
  );
}
