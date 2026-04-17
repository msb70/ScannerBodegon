"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";

const nav = [
  { href: "/pos", label: "POS" },
  { href: "/captura", label: "Captura" },
  { href: "/dashboard", label: "Dashboard" }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/pos" className="font-bold text-slate-950">
            Bodegon POS
          </Link>
          <nav className="flex items-center gap-2">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active
                      ? "rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white"
                      : "rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              Salir
            </button>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
