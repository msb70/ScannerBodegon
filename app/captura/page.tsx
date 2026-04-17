"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProductoCard } from "@/components/producto";
import { ScannerInput } from "@/components/scanner-input";
import { useRequireUser } from "@/lib/auth";
import {
  createProduct,
  lookupProductCacheFirst,
  uploadImageFromUrl,
  uploadProductImage
} from "@/lib/productos";
import { getErrorMessage } from "@/lib/errors";
import type { Producto, ProductoInsert } from "@/lib/types";

type FormState = {
  codigo: string;
  nombre: string;
  marca: string;
  kosher: boolean;
  imagen: string;
  precio_venta: string;
  stock: string;
};

const emptyForm: FormState = {
  codigo: "",
  nombre: "",
  marca: "",
  kosher: false,
  imagen: "",
  precio_venta: "",
  stock: "0"
};

export default function CapturaPage() {
  const { user, loading: authLoading } = useRequireUser();
  const [scanValue, setScanValue] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [existingProduct, setExistingProduct] = useState<Producto | null>(null);
  const [cameraFile, setCameraFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "error" | "info"; message: string } | null>(null);

  const previewUrl = useMemo(() => {
    if (cameraFile) return URL.createObjectURL(cameraFile);
    return form.imagen || null;
  }, [cameraFile, form.imagen]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleScan(codigo: string) {
    if (!user) return;
    setLoading(true);
    setFeedback(null);
    setExistingProduct(null);
    setCameraFile(null);

    try {
      const result = await lookupProductCacheFirst(codigo, user.id);
      if (result.status === "cache") {
        const product = result.product;
        setExistingProduct(product);
        setForm({
          codigo: product.codigo,
          nombre: product.nombre,
          marca: product.marca ?? "",
          kosher: product.kosher,
          imagen: product.imagen ?? "",
          precio_venta: String(product.precio_venta),
          stock: String(product.stock)
        });
        setFeedback({ type: "info", message: "Este producto ya existe en tu inventario." });
        return;
      }

      if (result.status === "external") {
        setForm({
          codigo: result.candidate.codigo,
          nombre: result.candidate.nombre,
          marca: result.candidate.marca ?? "",
          kosher: result.candidate.kosher,
          imagen: result.candidate.imagen ?? "",
          precio_venta: "",
          stock: "0"
        });
        setFeedback({
          type: "ok",
          message: `Producto encontrado en ${result.candidate.source}. Completa precio y stock.`
        });
        return;
      }

      setForm({ ...emptyForm, codigo });
      setFeedback({
        type: "info",
        message: "Producto no encontrado en caché ni APIs externas. Ingresa los datos manualmente."
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: getErrorMessage(err, "No se pudo capturar el producto.")
      });
    } finally {
      setLoading(false);
    }
  }

  async function buildImageValue() {
    if (!user) return null;
    if (cameraFile) {
      const ext = cameraFile.type.includes("png") ? "png" : cameraFile.type.includes("webp") ? "webp" : "jpg";
      return uploadProductImage(cameraFile, user.id, form.codigo, ext);
    }

    if (form.imagen.startsWith("http://") || form.imagen.startsWith("https://")) {
      try {
        return await uploadImageFromUrl(form.imagen, user.id, form.codigo);
      } catch {
        return form.imagen;
      }
    }

    return form.imagen || null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || existingProduct) return;

    const price = Number(form.precio_venta);
    const stock = Number(form.stock);
    if (!Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
      setFeedback({ type: "error", message: "Precio y stock deben ser valores válidos." });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const imagen = await buildImageValue();
      const payload: ProductoInsert = {
        codigo: form.codigo.trim(),
        nombre: form.nombre.trim(),
        marca: form.marca.trim() || null,
        kosher: form.kosher,
        imagen,
        precio_venta: price,
        stock,
        user_id: user.id
      };

      const saved = await createProduct(payload);
      setExistingProduct(saved);
      setFeedback({ type: "ok", message: "Producto guardado correctamente en Supabase." });
    } catch (err) {
      setFeedback({
        type: "error",
        message: getErrorMessage(err, "No se pudo guardar el producto.")
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
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[420px_1fr]">
        <section className="space-y-5">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-teal-700">Captura de productos</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-950">Cache first</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Primero se busca en Supabase. Solo si no existe se consulta Open Food Facts y luego
              UPCitemdb.
            </p>
            <div className="mt-5">
              <ScannerInput
                value={scanValue}
                onChange={setScanValue}
                onScan={handleScan}
                disabled={loading}
                placeholder="Escanea código para capturar..."
              />
            </div>
            {loading && <p className="mt-3 text-sm text-slate-500">Buscando datos...</p>}
            {feedback && (
              <p
                className={
                  feedback.type === "ok"
                    ? "mt-3 rounded-2xl bg-teal-50 p-3 text-sm font-medium text-teal-700"
                    : feedback.type === "error"
                      ? "mt-3 rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700"
                      : "mt-3 rounded-2xl bg-slate-100 p-3 text-sm font-medium text-slate-700"
                }
              >
                {feedback.message}
              </p>
            )}
          </div>

          {existingProduct && <ProductoCard producto={existingProduct} />}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Código</span>
                <input
                  required
                  value={form.codigo}
                  onChange={(event) => updateField("codigo", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Marca</span>
                <input
                  value={form.marca}
                  onChange={(event) => updateField("marca", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-500"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Nombre</span>
              <input
                required
                value={form.nombre}
                onChange={(event) => updateField("nombre", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-500"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Precio venta</span>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.precio_venta}
                  onChange={(event) => updateField("precio_venta", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Stock</span>
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(event) => updateField("stock", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-500"
                />
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.kosher}
                  onChange={(event) => updateField("kosher", event.target.checked)}
                  className="h-5 w-5 accent-teal-600"
                />
                <span className="font-semibold text-slate-700">Kosher</span>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-[180px_1fr]">
              <div className="h-44 overflow-hidden rounded-3xl bg-slate-100">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Vista previa" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                    Sin imagen
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">URL de imagen externa</span>
                  <input
                    value={form.imagen}
                    onChange={(event) => updateField("imagen", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-500"
                    placeholder="https://..."
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Cámara o archivo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(event) => setCameraFile(event.target.files?.[0] ?? null)}
                    className="mt-2 w-full rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm"
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading || Boolean(existingProduct)}
                className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Guardando..." : existingProduct ? "Ya existe" : "Guardar producto"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm(emptyForm);
                  setExistingProduct(null);
                  setCameraFile(null);
                  setFeedback(null);
                }}
                className="rounded-2xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-200"
              >
                Limpiar
              </button>
            </div>
          </form>
        </section>
      </main>
    </AppShell>
  );
}
