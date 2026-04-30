"use client";

import { Button } from "@/components/ui/button";

export default function AdminInventarioError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="space-y-4 pb-8">
      <section className="glass-card rounded-2xl p-5">
        <h1 className="font-[var(--font-display)] text-2xl">No se pudo abrir Inventario</h1>
        <p className="mt-2 text-sm text-rose-700">{error.message || "Ocurrió un error inesperado."}</p>
        <div className="mt-4">
          <Button type="button" onClick={() => reset()}>
            Reintentar
          </Button>
        </div>
      </section>
    </main>
  );
}
