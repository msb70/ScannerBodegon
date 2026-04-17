"use client";

import { lookupExternalProduct } from "./api";
import { assertSupabaseConfigured, supabase } from "./supabase";
import type { DashboardSummary, LookupResult, Producto, ProductoInsert } from "./types";

function isMissingUserIdColumn(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: unknown; message?: unknown };
  return (
    err.code === "42703" &&
    typeof err.message === "string" &&
    err.message.includes("productos.user_id")
  );
}

export async function findProductByCode(codigo: string, userId: string) {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("codigo", codigo)
    .eq("user_id", userId)
    .maybeSingle<Producto>();

  if (error) throw error;
  return data;
}

export async function lookupProductCacheFirst(codigo: string, userId: string): Promise<LookupResult> {
  try {
    const product = await findProductByCode(codigo, userId);
    if (product) return { status: "cache", product };
  } catch (error) {
    if (!isMissingUserIdColumn(error)) throw error;
  }

  const candidate = await lookupExternalProduct(codigo);
  if (candidate) return { status: "external", candidate };

  return { status: "manual", codigo };
}

export async function createProduct(input: ProductoInsert) {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("productos")
    .insert(input)
    .select("*")
    .single<Producto>();

  if (error) throw error;
  return data;
}

export async function listProducts(userId: string) {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("user_id", userId)
    .order("nombre", { ascending: true })
    .returns<Producto[]>();

  if (error) throw error;
  return data ?? [];
}

export async function uploadProductImage(file: Blob, userId: string, codigo: string, ext = "jpg") {
  assertSupabaseConfigured();

  const safeCode = codigo.replace(/[^a-zA-Z0-9_-]/g, "-");
  const path = `${userId}/${safeCode}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("productos_fotos").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || `image/${ext}`
  });

  if (error) throw error;
  return path;
}

export async function uploadImageFromUrl(imageUrl: string, userId: string, codigo: string) {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("No se pudo descargar la imagen externa.");

  const blob = await response.blob();
  const contentType = blob.type || "image/jpeg";
  const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  return uploadProductImage(blob, userId, codigo, ext);
}

export async function resolveProductImageUrl(imagen: string | null) {
  if (!imagen) return null;
  if (imagen.startsWith("http://") || imagen.startsWith("https://")) return imagen;
  assertSupabaseConfigured();

  const { data, error } = await supabase.storage
    .from("productos_fotos")
    .createSignedUrl(imagen, 60 * 60);

  if (error) return null;
  return data.signedUrl;
}

export async function getDashboardSummary(userId: string): Promise<DashboardSummary> {
  assertSupabaseConfigured();

  const [ventasResult, productosResult, itemsResult] = await Promise.all([
    supabase.from("ventas").select("total").eq("user_id", userId),
    supabase.from("productos").select("*").eq("user_id", userId).returns<Producto[]>(),
    supabase
      .from("ventas_items")
      .select("producto_id,cantidad,precio,producto:productos(nombre)")
      .returns<
        Array<{
          producto_id: string;
          cantidad: number;
          precio: number;
          producto: { nombre: string } | null;
        }>
      >()
  ]);

  if (ventasResult.error) throw ventasResult.error;
  if (productosResult.error) throw productosResult.error;
  if (itemsResult.error) throw itemsResult.error;

  const ventas = ventasResult.data ?? [];
  const productos = productosResult.data ?? [];
  const topMap = new Map<string, { producto_id: string; nombre: string; cantidad: number; total: number }>();

  for (const item of itemsResult.data ?? []) {
    const current = topMap.get(item.producto_id) ?? {
      producto_id: item.producto_id,
      nombre: item.producto?.nombre ?? "Producto eliminado",
      cantidad: 0,
      total: 0
    };
    current.cantidad += item.cantidad;
    current.total += item.cantidad * item.precio;
    topMap.set(item.producto_id, current);
  }

  return {
    ventasTotal: ventas.reduce((sum, venta) => sum + Number(venta.total), 0),
    ventasCount: ventas.length,
    productosCount: productos.length,
    lowStock: productos.filter((producto) => producto.stock <= 5).slice(0, 8),
    topProductos: [...topMap.values()].sort((a, b) => b.cantidad - a.cantidad).slice(0, 5)
  };
}
