import type { CartItem, Producto } from "./types";

export function calculateCartTotal(items: CartItem[]) {
  return items.reduce((total, item) => total + item.precio_venta * item.cantidad, 0);
}

export function addProductToCart(items: CartItem[], product: Producto) {
  const current = items.find((item) => item.id === product.id);
  if (current) {
    return items.map((item) =>
      item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item
    );
  }

  return [...items, { ...product, cantidad: 1 }];
}

export function updateCartQuantity(items: CartItem[], productId: string, cantidad: number) {
  if (cantidad <= 0) {
    return items.filter((item) => item.id !== productId);
  }

  return items.map((item) => (item.id === productId ? { ...item, cantidad } : item));
}

export function hasStockForCart(items: CartItem[]) {
  return items.every((item) => item.stock >= item.cantidad);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}
