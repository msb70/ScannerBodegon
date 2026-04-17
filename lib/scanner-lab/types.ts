export const SCANNER_SOURCE_LABELS = {
  "open-food-facts": "Open Food Facts",
  "open-beauty-facts": "Open Beauty Facts",
  "open-pet-food-facts": "Open Pet Food Facts",
  upcitemdb: "UPCitemdb"
} as const;

export type ScannerCatalogSource = keyof typeof SCANNER_SOURCE_LABELS;
export type ScannerLookupStatus = "found" | "not_found" | "error";

export type ScannerCatalogProduct = {
  source: ScannerCatalogSource;
  codigo: string;
  nombre: string;
  marca: string | null;
  descripcion: string | null;
  categoria: string | null;
  imagen: string | null;
  kosher: boolean;
  labels: string[];
};

export type ScannerLookupAttempt = {
  source: ScannerCatalogSource;
  status: "found" | "not_found" | "error";
  message: string | null;
};

export type ScannerLookupOutput =
  | {
      status: "found";
      codigo: string;
      product: ScannerCatalogProduct;
      attempts: ScannerLookupAttempt[];
    }
  | {
      status: "not_found" | "error";
      codigo: string;
      attempts: ScannerLookupAttempt[];
      message: string | null;
    };

export type ScannerLabScanRow = {
  id: string;
  raw_code: string;
  normalized_code: string;
  status: ScannerLookupStatus;
  source: ScannerCatalogSource | null;
  product_name: string | null;
  brand: string | null;
  product_description: string | null;
  category: string | null;
  image_url: string | null;
  kosher_hint: boolean;
  api_attempts: ScannerLookupAttempt[];
  created_at: string;
};

export type ScannerLabScanRecord = {
  id: string;
  rawCode: string;
  normalizedCode: string;
  status: ScannerLookupStatus;
  source: ScannerCatalogSource | null;
  productName: string | null;
  brand: string | null;
  description: string | null;
  category: string | null;
  imageUrl: string | null;
  kosherHint: boolean;
  attempts: ScannerLookupAttempt[];
  createdAt: string;
};

export type ScannerLabMetrics = {
  configured: boolean;
  totalScans: number;
  foundCount: number;
  notFoundCount: number;
  errorCount: number;
  hitRate: number;
  recentScans: ScannerLabScanRecord[];
  recentFound: ScannerLabScanRecord[];
  recentMissing: ScannerLabScanRecord[];
  missingCodes: Array<{ code: string; count: number }>;
  sourceBreakdown: Array<{
    source: ScannerCatalogSource;
    label: string;
    attempts: number;
    hits: number;
    hitRate: number;
  }>;
};
