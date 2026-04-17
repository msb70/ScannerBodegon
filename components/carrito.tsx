"use client";

import { calculateCartTotal, formatCurrency } from "@/lib/business";
import type { CartItem } from "@/lib/types";

type CarritoProps = {
  items: CartItem[];
  onQuantityChange: (productId: string, cantidad: number) => void;
  onRemove: (productId: string) => void;
};

export function Carrito({ items, onQuantityChange, onRemove }: CarritoProps) {
  const total = calculateCartTotal(items);

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        Escanea productos para iniciar el carrito.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const subtotal = item.cantidad * item.precio_venta;
        const stockInsuficiente = item.cantidad > item.stock;

        return (
          <article
            key={item.id}
            className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-950">{item.nombre}</h3>
                <p className="text-sm text-slate-500">
                  {formatCurrency(item.precio_venta)} por unidad
                </p>
                {stockInsuficiente && (
                  <p className="mt-1 text-sm font-medium text-red-600">
                    Stock insuficiente: quedan {item.stock}
                  </p>
                )}
              </div>
              <p className="text-right text-lg font-bold text-slate-950">
                {formatCurrency(subtotal)}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center rounded-2xl border border-slate-200">
                <button
                  className="px-4 py-2 text-slate-700 hover:text-slate-950"
                  onClick={() => onQuantityChange(item.id, item.cantidad - 1)}
                >
                  -
                </button>
                <span className="min-w-10 text-center font-semibold">{item.cantidad}</span>
                <button
                  className="px-4 py-2 text-slate-700 hover:text-slate-950"
                  onClick={() => onQuantityChange(item.id, item.cantidad + 1)}
                >
                  +
                </button>
              </div>
              <button
                className="rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                onClick={() => onRemove(item.id)}
              >
                Eliminar
              </button>
            </div>
          </article>
        );
      })}

      <div className="rounded-3xl bg-slate-950 p-5 text-white">
        <div className="flex items-center justify-between">
          <span className="text-slate-300">Total</span>
          <span className="text-3xl font-bold">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
