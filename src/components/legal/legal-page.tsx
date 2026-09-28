import Link from "next/link";
import { LEGAL_INFO, LEGAL_LINKS } from "@/lib/legal-info";

// Contenedor común de las páginas legales: título, fecha de actualización y navegación entre políticas.
export function LegalPage({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-4xl space-y-6 pb-10">
      <article className="glass-card space-y-6 rounded-3xl p-5 sm:p-8">
        <header className="space-y-2 border-b border-border/60 pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/80">Información legal</p>
          <h1 className="font-[var(--font-display)] text-3xl sm:text-4xl">{title}</h1>
          <p className="text-xs text-muted-foreground">Última actualización: {LEGAL_INFO.lastUpdated}</p>
          {intro ? <p className="text-sm text-muted-foreground">{intro}</p> : null}
        </header>
        <div className="legal-content space-y-5 text-sm leading-relaxed text-foreground/90 [&_h2]:pt-2 [&_h2]:font-[var(--font-display)] [&_h2]:text-xl [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
          {children}
        </div>
      </article>

      <nav aria-label="Políticas" className="flex flex-wrap justify-center gap-2">
        {LEGAL_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full border border-primary/20 bg-white/70 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </main>
  );
}

export function ProviderData() {
  const rows = [
    ["Nombre comercial", LEGAL_INFO.tradeName],
    ["Razón social", LEGAL_INFO.legalName || "Por completar"],
    ["RUC", LEGAL_INFO.ruc || "Por completar"],
    ["Domicilio", LEGAL_INFO.address || "Por completar"],
    ["Correo", LEGAL_INFO.email || "Por completar"],
    ["Teléfono / WhatsApp", LEGAL_INFO.phone],
  ];
  return (
    <dl className="grid gap-x-4 gap-y-1 rounded-2xl bg-white/60 p-4 text-sm sm:grid-cols-[180px_1fr]">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="font-semibold text-foreground">{label}</dt>
          <dd className="text-muted-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
