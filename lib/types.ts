export type Producto = {
  id: string;
  codigo: string;
  nombre: string;
  marca: string | null;
  kosher: boolean;
  imagen: string | null;
  precio_venta: number;
  stock: number;
  user_id: string;
  created_at?: string;
  updated_at?: string;
};

export type ProductoInsert = Omit<Producto, "id" | "created_at" | "updated_at">;

export type Venta = {
  id: string;
  total: number;
  fecha: string;
  user_id: string;
};

export type VentaItem = {
  id: string;
  venta_id: string;
  producto_id: string;
  cantidad: number;
  precio: number;
};

export type CartItem = Producto & {
  cantidad: number;
};

export type ExternalProductCandidate = {
  source: "open-food-facts" | "upcitemdb";
  codigo: string;
  nombre: string;
  marca: string | null;
  kosher: boolean;
  imagen: string | null;
  labels_tags: string[];
};

export type LookupResult =
  | { status: "cache"; product: Producto }
  | { status: "external"; candidate: ExternalProductCandidate }
  | { status: "manual"; codigo: string };

export type DashboardSummary = {
  ventasTotal: number;
  ventasCount: number;
  productosCount: number;
  lowStock: Producto[];
  topProductos: Array<{
    producto_id: string;
    nombre: string;
    cantidad: number;
    total: number;
  }>;
};
