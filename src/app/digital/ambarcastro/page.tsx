import type { Metadata } from "next";
import { DigitalCatalog } from "@/components/digital/digital-catalog";
import { getPublicDigitalProducts } from "@/lib/digital-store";
import { DEFAULT_OG_IMAGE } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Plantillas de Excel para vendedoras por catálogo | Ambar Castro",
  description:
    "Plantillas profesionales de Excel para organizar ventas, inventario, comisiones y ganancias de tu negocio por catálogo. Niveles básico, intermedio y PRO.",
  alternates: { canonical: "/digital/ambarcastro" },
  openGraph: { url: "/digital/ambarcastro", type: "website", images: [DEFAULT_OG_IMAGE] },
};

// Landing de Ambar Castro: muestra las plantillas del catálogo digital.
export default async function AmbarcastroPage() {
  const products = (await getPublicDigitalProducts()).filter((product) => product.productType === "plantilla");

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="space-y-2 text-center sm:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/80">By Ambar Castro</p>
        <h1 className="font-[var(--font-display)] text-3xl sm:text-4xl">Plantillas de Excel para tu negocio por catálogo</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Controla tus ventas, clientes, comisiones y ganancias con plantillas listas para usar. Elige tu nivel, paga con Yape,
          Plin, transferencia o por WhatsApp y recibe tus archivos por correo.
        </p>
      </header>
      <DigitalCatalog products={products} basePath="/digital/ambarcastro" showFilters={false} />
    </div>
  );
}
