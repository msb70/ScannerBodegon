import Link from "next/link";

const features = [
  "Inventario aislado por usuario con RLS",
  "Captura cache-first con Open Food Facts y UPCitemdb",
  "POS rápido para cajeros con foco permanente en escáner",
  "Storage privado para fotos de productos",
  "Scanner Lab standalone para medir cobertura antes de integrar"
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-12">
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex rounded-full border border-teal-300/30 bg-teal-300/10 px-4 py-2 text-sm text-teal-100">
            POS SaaS para bodegones kosher
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Inventario y punto de venta listos para operar por tienda.
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            Base escalable con Next.js, Supabase Auth, PostgreSQL, Storage y
            políticas RLS para aislar productos, ventas y fotos por usuario.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/scanner-lab"
              className="rounded-2xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Probar Scanner Lab
            </Link>
            <Link
              href="/login"
              className="rounded-2xl bg-teal-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-teal-300"
            >
              Entrar al POS
            </Link>
            <Link
              href="/registro"
              className="rounded-2xl border border-white/15 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <div key={feature} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              {feature}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
