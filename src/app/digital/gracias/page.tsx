"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DigitalGraciasPage() {
  const [params, setParams] = useState({ nombre: "", producto: "" });

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setParams({
      nombre: sp.get("nombre") || "",
      producto: sp.get("producto") || "tu producto digital",
    });
  }, []);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl rounded-3xl border border-white/60 bg-white/80 p-8 text-center shadow-xl backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/80">AMYSA SHOP</p>
        <h1 className="mt-3 font-[var(--font-display)] text-4xl text-foreground">
          {params.nombre ? `Gracias, ${params.nombre}` : "Gracias por tu compra"}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Hemos recibido tu solicitud de compra de {params.producto}. En las próximas horas verificaremos el pago y te
          enviaremos un correo con las instrucciones de descarga.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          ¿Ya realizaste el pago? Revisa el estado de tu descarga{" "}
          <Link href="/digital/descargas" className="font-semibold text-primary underline">
            aquí
          </Link>
          .
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/digital/ambarcastro"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white"
          >
            Volver a tienda
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
