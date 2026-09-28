import type { Metadata } from "next";
import { ComplaintForm } from "@/components/legal/complaint-form";
import { ProviderData } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Libro de Reclamaciones",
  description: "Libro de Reclamaciones virtual de AMYSA SHOP conforme al Código de Protección y Defensa del Consumidor (Ley N.° 29571).",
  alternates: { canonical: "/libro-de-reclamaciones" },
};

export default function LibroReclamacionesPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-5 pb-10">
      <header className="glass-card space-y-3 rounded-3xl p-5 sm:p-8">
        <div className="flex items-center gap-3">
          <BookIcon />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/80">Conforme a la Ley N.° 29571</p>
            <h1 className="font-[var(--font-display)] text-3xl sm:text-4xl">Libro de Reclamaciones</h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Registra aquí tu reclamo o queja. Recibirás una copia en tu correo electrónico y te responderemos en un plazo máximo de{" "}
          <strong className="text-foreground">15 días hábiles</strong>.
        </p>
        <ProviderData />
      </header>

      <ComplaintForm />

      <section className="glass-card space-y-2 rounded-3xl p-5 text-xs text-muted-foreground sm:p-6">
        <p>
          <strong className="text-foreground">Reclamo:</strong> disconformidad relacionada con los productos o servicios adquiridos.
        </p>
        <p>
          <strong className="text-foreground">Queja:</strong> disconformidad no relacionada con los productos o servicios, o malestar
          respecto a la atención al público.
        </p>
        <p>
          La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer
          una denuncia ante el INDECOPI. El proveedor deberá dar respuesta al reclamo en un plazo no mayor a quince (15) días hábiles.
        </p>
      </section>
    </main>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-12 shrink-0 text-primary" aria-hidden="true">
      <rect x="8" y="6" width="32" height="36" rx="3" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M16 16h16M16 23h16M16 30h10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
