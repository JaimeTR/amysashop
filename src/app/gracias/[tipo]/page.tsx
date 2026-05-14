import Link from "next/link";

type ThanksPageProps = {
  params: { tipo: string };
  searchParams?: { nombre?: string };
};

function getConfig(tipo: string, nombre?: string) {
  const safeName = nombre?.trim();

  if (tipo === "contacto") {
    return {
      title: safeName ? `Gracias, ${safeName}` : "Gracias por escribirnos",
      description: safeName
        ? `Hemos recibido tu mensaje, ${safeName}. Te responderemos lo antes posible.`
        : "Hemos recibido tu mensaje. Te responderemos lo antes posible.",
      cta: "Volver al inicio",
      href: "/",
    };
  }

  if (tipo === "verificacion") {
    return {
      title: "Cuenta verificada",
      description: "Gracias por confirmar tu correo. Tu cuenta ya está activa.",
      cta: "Ir a iniciar sesión",
      href: "/login",
    };
  }

  return {
    title: "Gracias",
    description: "Tu solicitud fue recibida correctamente.",
    cta: "Volver al inicio",
    href: "/",
  };
}

export default function ThanksPage({ params, searchParams }: ThanksPageProps) {
  const config = getConfig(params.tipo, searchParams?.nombre);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl rounded-3xl border border-white/60 bg-white/80 p-8 text-center shadow-xl backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/80">AMYSA SHOP</p>
        <h1 className="mt-3 font-[var(--font-display)] text-4xl text-foreground">{config.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{config.description}</p>

        <div className="mt-8 flex justify-center">
          <Link href={config.href} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white">
            {config.cta}
          </Link>
        </div>
      </div>
    </main>
  );
}