import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bodegon POS Kosher",
  description: "SaaS multi-tenant para inventario, punto de venta y scanner lab kosher."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
