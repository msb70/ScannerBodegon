import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getNormalizedEnvValue, isValidSupabaseUrl } from "@/lib/supabase-config";

const supabaseUrl = getNormalizedEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseServiceRoleKey = getNormalizedEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

export function isSupabaseAdminConfigured() {
  return Boolean(
    supabaseUrl &&
      supabaseServiceRoleKey &&
      isValidSupabaseUrl(supabaseUrl) &&
      !supabaseUrl.includes("your-project") &&
      !supabaseServiceRoleKey.includes("your-service-role-key")
  );
}

export function getSupabaseAdmin() {
  if (!isSupabaseAdminConfigured()) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para persistir el Scanner Lab."
    );
  }

  return createClient(supabaseUrl!, supabaseServiceRoleKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
