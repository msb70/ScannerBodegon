"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Carrito } from "@/components/carrito";
import { ScannerInput } from "@/components/scanner-input";
import { addProductToCart, calculateCartTotal, formatCurrency, hasStockForCart, updateCartQuantity } from "@/lib/business";
import { useRequireUser } from "@/lib/auth";
import { lookupProductCacheFirst } from "@/lib/productos";
import { checkoutCart } from "@/lib/ventas";
import { getErrorMessage } from "@/lib/errors";
import type { CartItem } from "@/lib/types";

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
  gain.gain.value = 0.04;
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.08);
}

export default function PosPage() {
  const { user, loading: authLoading } = useRequireUser();
  const [scanValue, setScanValue] = useState("");
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; message: string } | null>(null);

  async function handleScan(codigo: string) {
    if (!user) return;
    setLoading(true);
    setFeedback(null);

    try {
      const result = await lookupProductCacheFirst(codigo, user.id);
      if (result.status !== "cache") {
        setFeedback({
          type: "error",
          message: `Producto ${codigo} no está en inventario. Captúralo antes de venderlo.`
        });
        return;
      }

      setItems((current) => addProductToCart(current, result.product));
      setFeedback({ type: "ok", message: `${result.product.nombre} agregado al carrito.` });
      beep();
    } catch (err) {
      setFeedback({
        type: "error",
        message: getErrorMessage(err, "No se pudo buscar el producto.")
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout() {
    if (!user || items.length === 0) return;
    if (!hasStockForCart(items)) {
      setFeedback({ type: "error", message: "Hay productos con stock insuficiente." });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const ventaId = await checkoutCart(items, user.id);
      setItems([]);
      setFeedback({ type: "ok", message: `Venta registrada correctamente: ${ventaId}` });
      beep();
    } catch (err) {
      setFeedback({
        type: "error",
        message: getErrorMessage(err, "No se pudo cobrar la venta.")
      });
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return <div className="grid min-h-screen place-items-center bg-slate-100">Cargando sesión...</div>;
  }

  return (
    <AppShell>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1fr_380px]">
        <section className="space-y-5">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-teal-700">Punto de venta</p>
                <h1 className="text-3xl font-bold text-slate-950">Escaneo rápido</h1>
              </div>
              <Link
                href="/captura"
                className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Capturar producto
              </Link>
            </div>
            <ScannerInput
              value={scanValue}
              onChange={setScanValue}
              onScan={handleScan}
              disabled={loading}
              placeholder="Escanea producto y presiona Enter..."
            />
            {loading && <p className="mt-3 text-sm text-slate-500">Buscando producto...</p>}
            {feedback && (
              <p
                className={
                  feedback.type === "ok"
                    ? "mt-3 rounded-2xl bg-teal-50 p-3 text-sm font-medium text-teal-700"
                    : "mt-3 rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700"
                }
              >
                {feedback.message}
              </p>
            )}
          </div>

          <Carrito
            items={items}
            onQuantityChange={(productId, cantidad) =>
              setItems((current) => updateCartQuantity(current, productId, cantidad))
            }
            onRemove={(productId) => setItems((current) => current.filter((item) => item.id !== productId))}
          />
        </section>

        <aside className="h-fit rounded-3xl bg-slate-950 p-6 text-white shadow-xl lg:sticky lg:top-24">
          <p className="text-sm font-semibold text-teal-200">Resumen</p>
          <div className="mt-5 space-y-4">
            <div className="flex justify-between text-slate-300">
              <span>Items</span>
              <span>{items.reduce((sum, item) => sum + item.cantidad, 0)}</span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-slate-300">Total</span>
              <span className="text-4xl font-bold">{formatCurrency(calculateCartTotal(items))}</span>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            disabled={loading || items.length === 0}
            className="mt-8 w-full rounded-2xl bg-teal-400 px-5 py-4 text-lg font-bold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Procesando..." : "Cobrar"}
          </button>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            El cobro registra la venta, inserta items y descuenta stock dentro de una función SQL
            transaccional.
          </p>
        </aside>
      </main>
    </AppShell>
  );
}
