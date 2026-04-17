import type { ExternalProductCandidate } from "./types";

const KOSHER_MARKERS = ["kosher", "casher", "kasher", "kashrut", "hechsher"];

function isKosherFromLabels(labels: string[]) {
  return labels.some((label) => {
    const normalized = label.toLowerCase();
    return KOSHER_MARKERS.some((marker) => normalized.includes(marker));
  });
}

function firstText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function lookupOpenFoodFacts(codigo: string): Promise<ExternalProductCandidate | null> {
  const url = new URL(`https://world.openfoodfacts.org/api/v2/product/${codigo}.json`);
  url.searchParams.set("fields", "code,product_name,brands,labels_tags,image_front_url,image_url");

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as {
    status?: number;
    product?: {
      product_name?: string;
      brands?: string;
      labels_tags?: string[];
      image_front_url?: string;
      image_url?: string;
    };
  };

  if (payload.status !== 1 || !payload.product) return null;

  const labels = Array.isArray(payload.product.labels_tags) ? payload.product.labels_tags : [];
  const nombre = firstText(payload.product.product_name) ?? `Producto ${codigo}`;

  return {
    source: "open-food-facts",
    codigo,
    nombre,
    marca: firstText(payload.product.brands),
    kosher: isKosherFromLabels(labels),
    imagen: firstText(payload.product.image_front_url) ?? firstText(payload.product.image_url),
    labels_tags: labels
  };
}

async function lookupUpcItemDb(codigo: string): Promise<ExternalProductCandidate | null> {
  const url = new URL("https://api.upcitemdb.com/prod/trial/lookup");
  url.searchParams.set("upc", codigo);

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as {
    code?: string;
    items?: Array<{
      title?: string;
      brand?: string;
      images?: string[];
      description?: string;
      category?: string;
    }>;
  };

  const item = payload.items?.[0];
  if (!item) return null;

  const labels = [item.description, item.category].filter(Boolean) as string[];

  return {
    source: "upcitemdb",
    codigo,
    nombre: firstText(item.title) ?? `Producto ${codigo}`,
    marca: firstText(item.brand),
    kosher: isKosherFromLabels(labels),
    imagen: item.images?.[0] ?? null,
    labels_tags: labels
  };
}

export async function lookupExternalProduct(codigo: string) {
  try {
    const openFoodFacts = await lookupOpenFoodFacts(codigo);
    if (openFoodFacts) return openFoodFacts;
  } catch {
    // External catalogs are best-effort; the capture screen falls back to manual entry.
  }

  try {
    return await lookupUpcItemDb(codigo);
  } catch {
    return null;
  }
}
