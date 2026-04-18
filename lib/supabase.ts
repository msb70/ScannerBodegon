"use client";

import { createClient } from "@supabase/supabase-js";

import { getNormalizedEnvValue, getSafeSupabaseUrl, isValidSupabaseUrl } from "@/lib/supabase-config";

const supabaseUrl = getNormalizedEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = getNormalizedEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const fallbackSupabaseAnonKey = "placeholder-anon-key";

export function isSupabaseConfigured() {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      isValidSupabaseUrl(supabaseUrl) &&
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
