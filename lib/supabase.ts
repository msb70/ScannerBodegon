"use client";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const fallbackSupabaseUrl = "https://placeholder.supabase.co";
const fallbackSupabaseAnonKey = "placeholder-anon-key";

function getSafeSupabaseUrl(value: string | undefined) {
  if (!value) return fallbackSupabaseUrl;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return fallbackSupabaseUrl;
    }

    return value;
  } catch {
    return fallbackSupabaseUrl;
  }
}

export function isSupabaseConfigured() {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      !supabaseUrl.includes("your-project") &&
      !supabaseAnonKey.includes("your-public-anon-key")
  );
}

export function assertSupabaseConfigured() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno."
    );
  }
}

export const supabase = createClient(
  getSafeSupabaseUrl(supabaseUrl),
  supabaseAnonKey || fallbackSupabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
