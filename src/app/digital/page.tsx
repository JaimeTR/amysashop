import type { Metadata } from "next";
import { DigitalCatalog } from "@/components/digital/digital-catalog";
import { getPublicDigitalProducts } from "@/lib/digital-store";
import { DIGITAL_PRODUCT_TYPES, type DigitalProductType } from "@/lib/digital-types";
import { getSiteUrl, DEFAULT_OG_IMAGE } from "@/lib/site-url";

type Props = { searchParams?: { tipo?: string } };

function parseType(value?: string): DigitalProductType | undefined {
  return value && value in DIGITAL_PRODUCT_TYPES ? (value as DigitalProductType) : undefined;
}

export function generateMetadata({ searchParams }: Props): Metadata {
  const type = parseType(searchParams?.tipo);
  const title = type ? `${DIGITAL_PRODUCT_TYPES[type].plural} digitales` : "Productos digitales";
  const description =
    "Plantillas de Excel, libros digitales, guías y cursos para emprendedoras. Compra en soles con Yape, Plin o transferencia y recibe tu descarga por correo.";
  const canonical = type ? `/digital?tipo=${type}` : "/digital";
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title: `${title} | AMYSA SHOP`, description, url: canonical, type: "website", images: [DEFAULT_OG_IMAGE] },
  };
}

export default async function DigitalCatalogPage({ searchParams }: Props) {
  const products = await getPublicDigitalProducts();
  const activeType = parseType(searchParams?.tipo);
  const siteUrl = getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Productos digitales AMYSA SHOP",
    url: `${siteUrl}/digital`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteUrl}/digital/${product.slug}`,
        name: product.name,
      })),
    },
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/80">AMYSA SHOP</p>
        <h1 className="font-[var(--font-display)] text-3xl sm:text-4xl">Productos digitales</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Plantillas, libros, guías y cursos para organizar y hacer crecer tu negocio. Paga con Yape, Plin, transferencia o
          por WhatsApp y recibe tus archivos por correo.
        </p>
      </header>
      <DigitalCatalog products={products} basePath="/digital" activeType={activeType} />
    </div>
  );
}
