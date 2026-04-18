import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getNormalizedEnvValue, isValidSupabaseUrl } from "@/lib/supabase-config";

const supabaseUrl = getNormalizedEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = getNormalizedEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export function isSupabaseServerConfigured() {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      isValidSupabaseUrl(supabaseUrl) &&
      !supabaseUrl.includes("your-project") &&
      !supabaseAnonKey.includes("your-public-anon-key")
  );
}

export function getSupabaseServerClient() {
  if (!isSupabaseServerConfigured()) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY para usar Supabase desde el servidor."
    );
  }

  return createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
