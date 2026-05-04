import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-2xl rounded-[32px] border border-white/40 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,248,242,0.96))] p-8 text-center shadow-[0_18px_55px_rgba(110,71,49,0.10)]">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/80">AMYSA SHOP</p>
        <h1 className="mt-3 font-[var(--font-display)] text-4xl text-foreground">Te perdiste</h1>
        <p className="mt-4 text-base text-muted-foreground">
          La página que intentas abrir no existe o ya no está disponible.
          Regresa al inicio o ve directo a la tienda para seguir comprando.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white">
            Ir al inicio
          </Link>
          <Link href="/tienda" className="inline-flex items-center justify-center rounded-xl border border-primary/20 bg-white px-5 py-3 text-sm font-semibold text-primary">
            Ir a la tienda
          </Link>
        </div>
      </div>
    </main>
  );
}
