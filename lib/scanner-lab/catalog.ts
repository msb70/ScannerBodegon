import {
  SCANNER_SOURCE_LABELS,
  type ScannerCatalogProduct,
  type ScannerCatalogSource,
  type ScannerLookupAttempt,
  type ScannerLookupOutput
} from "./types";

const KOSHER_MARKERS = [
  "kosher",
  "casher",
  "kasher",
  "kashrut",
  "hechsher",
  "rabbinical",
  "parve",
  "pareve",
  "glatt"
];

type OpenFactsPayload = {
  status?: number;
  product?: {
    product_name?: string;
    generic_name?: string;
    brands?: string;
    categories?: string;
    categories_tags?: string[];
    labels_tags?: string[];
    image_front_url?: string;
    image_url?: string;
    quantity?: string;
  };
};

type CatalogFetcher = (codigo: string) => Promise<ScannerCatalogProduct | null>;

function firstText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function uniqueTexts(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => firstText(value)).filter(Boolean))] as string[];
}

function toHumanLabel(tag: string) {
  return tag
    .replace(/^[a-z]{2}:/i, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function inferKosher(values: string[]) {
  return values.some((value) => {
    const normalized = value.toLowerCase();
    return KOSHER_MARKERS.some((marker) => normalized.includes(marker));
  });
}

function withTimeoutSignal(timeoutMs: number) {
  if (typeof AbortSignal !== "undefined" && "timeout" in AbortSignal) {
    return AbortSignal.timeout(timeoutMs);
  }

  return undefined;
}

export function normalizeBarcode(rawCode: string) {
  return rawCode.replace(/[^\d]/g, "").trim();
}

async function fetchOpenFactsProduct(
  hostname: string,
  source: ScannerCatalogSource,
  codigo: string
): Promise<ScannerCatalogProduct | null> {
  const url = new URL(`https://${hostname}/api/v2/product/${codigo}.json`);
  url.searchParams.set(
    "fields",
    [
      "code",
      "product_name",
      "generic_name",
      "brands",
      "categories",
      "categories_tags",
      "labels_tags",
      "image_front_url",
      "image_url",
      "quantity"
    ].join(",")
  );

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: withTimeoutSignal(4500)
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as OpenFactsPayload;
  if (payload.status !== 1 || !payload.product) return null;

  const labels = uniqueTexts([
    ...(payload.product.labels_tags ?? []),
    ...(payload.product.categories_tags ?? []),
    payload.product.categories,
    payload.product.generic_name,
    payload.product.quantity
  ]);

  const categoria =
    firstText(payload.product.categories) ??
    payload.product.categories_tags?.map(toHumanLabel).find(Boolean) ??
    null;
  const descripcion = uniqueTexts([
    payload.product.generic_name,
    payload.product.quantity,
    payload.product.categories
  ]).join(" · ");

  return {
    source,
    codigo,
    nombre: firstText(payload.product.product_name) ?? `Producto ${codigo}`,
    marca: firstText(payload.product.brands),
    descripcion: descripcion || null,
    categoria,
    imagen: firstText(payload.product.image_front_url) ?? firstText(payload.product.image_url),
    kosher: inferKosher(labels),
    labels
  };
}

async function fetchUpcItemDbProduct(codigo: string): Promise<ScannerCatalogProduct | null> {
  const url = new URL("https://api.upcitemdb.com/prod/trial/lookup");
  url.searchParams.set("upc", codigo);

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: withTimeoutSignal(4500)
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as {
    items?: Array<{
      title?: string;
      brand?: string;
      description?: string;
      category?: string;
      images?: string[];
    }>;
  };

  const item = payload.items?.[0];
  if (!item) return null;

  const labels = uniqueTexts([item.description, item.category, item.brand, item.title]);

  return {
    source: "upcitemdb",
    codigo,
    nombre: firstText(item.title) ?? `Producto ${codigo}`,
    marca: firstText(item.brand),
    descripcion: firstText(item.description),
    categoria: firstText(item.category),
    imagen: item.images?.find(Boolean) ?? null,
    kosher: inferKosher(labels),
    labels
  };
}

const fetchers: Array<{
  source: ScannerCatalogSource;
  lookup: CatalogFetcher;
}> = [
  {
    source: "open-food-facts",
    lookup: (codigo) => fetchOpenFactsProduct("world.openfoodfacts.org", "open-food-facts", codigo)
  },
  {
    source: "open-beauty-facts",
    lookup: (codigo) =>
      fetchOpenFactsProduct("world.openbeautyfacts.org", "open-beauty-facts", codigo)
  },
  {
    source: "open-pet-food-facts",
    lookup: (codigo) =>
      fetchOpenFactsProduct("world.openpetfoodfacts.org", "open-pet-food-facts", codigo)
  },
  {
    source: "upcitemdb",
    lookup: fetchUpcItemDbProduct
  }
];

export async function lookupScannerCatalog(rawCode: string): Promise<ScannerLookupOutput> {
  const codigo = normalizeBarcode(rawCode);
  if (codigo.length < 8) {
    return {
      status: "error",
      codigo,
      attempts: [],
      message: "El código de barras debe tener al menos 8 dígitos."
    };
  }

  const attempts: ScannerLookupAttempt[] = [];

  for (const fetcher of fetchers) {
    try {
      const product = await fetcher.lookup(codigo);
      if (product) {
        attempts.push({
          source: fetcher.source,
          status: "found",
          message: `Coincidencia en ${SCANNER_SOURCE_LABELS[fetcher.source]}.`
        });

        return {
          status: "found",
          codigo,
          product,
          attempts
        };
      }

      attempts.push({
        source: fetcher.source,
        status: "not_found",
        message: `Sin coincidencia en ${SCANNER_SOURCE_LABELS[fetcher.source]}.`
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      attempts.push({
        source: fetcher.source,
        status: "error",
        message
      });
    }
  }

  const allErrored = attempts.length > 0 && attempts.every((attempt) => attempt.status === "error");
  return {
    status: allErrored ? "error" : "not_found",
    codigo,
    attempts,
    message: allErrored
      ? "Las fuentes externas fallaron en esta búsqueda."
      : "No se encontró el producto en las fuentes abiertas configuradas."
  };
}
