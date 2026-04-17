"use client";

import { assertSupabaseConfigured, supabase } from "./supabase";
import type { CartItem } from "./types";

export async function checkoutCart(items: CartItem[], userId: string) {
  assertSupabaseConfigured();

  const payload = items.map((item) => ({
    producto_id: item.id,
    cantidad: item.cantidad
  }));

  const { data, error } = await supabase.rpc("registrar_venta", {
    p_user_id: userId,
    p_items: payload
  });

  if (error) throw error;
  return data as string;
}
