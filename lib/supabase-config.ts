const fallbackSupabaseUrl = "https://placeholder.supabase.co";

function normalizeEnvValue(value: string | null | undefined) {
  return value?.trim() || "";
}

export function isValidSupabaseUrl(value: string | null | undefined) {
  const normalized = normalizeEnvValue(value);
  if (!normalized) return false;

  try {
    const url = new URL(normalized);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function getSafeSupabaseUrl(value: string | null | undefined) {
  return isValidSupabaseUrl(value) ? normalizeEnvValue(value) : fallbackSupabaseUrl;
}

export function getNormalizedEnvValue(value: string | null | undefined) {
  const normalized = normalizeEnvValue(value);
  return normalized || null;
}
