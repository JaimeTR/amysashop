import type { Metadata } from "next";
import { TiendaClientGrid } from "@/components/store/tienda-client-grid";
import { getActiveProducts, getRegisteredCategories } from "@/lib/catalog";
import { canonicalizeBrandName } from "@/lib/brands";

type Props = {
  searchParams?: {
    categoria?: string;
    marca?: string;
    destacados?: string;
  };
};

function buildSeoTitle(showFeatured: boolean, category?: string, brand?: string) {
  if (brand) {
    return `Catálogo de ${brand}`;
  }

  if (category) {
    return `${category} | Catálogo`;
  }

  return showFeatured ? "Destacados" : "Catálogo";
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const showFeatured = String(searchParams?.destacados || "").toLowerCase() === "true";
  const category = String(searchParams?.categoria || "").trim() || undefined;
  const brand = canonicalizeBrandName(String(searchParams?.marca || "").trim()) || undefined;
  const title = buildSeoTitle(showFeatured, category, brand);

  const description = brand
    ? `Explora el catálogo de AMYSA SHOP con productos de la marca ${brand} y otras opciones seleccionadas.`
    : category
      ? `Descubre productos de ${category.toLowerCase()} en AMYSA SHOP con novedades, ofertas y variedad para elegir.`
      : showFeatured
        ? "Revisa los productos destacados y las mejores ofertas del catálogo de AMYSA SHOP."
        : "Explora el catálogo completo de AMYSA SHOP con perfumes, maquillaje, cuidado personal y marcas seleccionadas.";

  const keywords = [
    "catálogo AMYSA SHOP",
    "tienda online",
    "perfumes",
    "maquillaje",
    "cuidado personal",
    "marcas",
    category,
    brand,
    showFeatured ? "destacados" : null,
  ].filter((value): value is string => Boolean(value));

  return {
    title,
    description,
    keywords,
  };
}

export default async function TiendaPage({ searchParams }: Props) {
  const showFeatured = String(searchParams?.destacados || "").toLowerCase() === "true";
  
  const [products, categories] = await Promise.all([
    getActiveProducts(),
    getRegisteredCategories(),
  ]);
  
  const initialCategory = String(searchParams?.categoria || "").trim() || undefined;
  const initialBrand = canonicalizeBrandName(String(searchParams?.marca || "").trim()) || undefined;

  return (
    <main className="space-y-5 pb-8">
      <div className="flex items-baseline justify-center gap-3 px-3 text-center sm:justify-start sm:px-0 sm:text-left">
        <h1 className="font-[var(--font-display)] text-3xl">{showFeatured ? "Destacados" : "CATÁLOGO"}</h1>
      </div>
      <TiendaClientGrid
        products={products}
        allProducts={products}
        categories={categories}
        initialCategory={initialCategory}
        initialBrand={initialBrand}
        showFeatured={showFeatured}
      />
    </main>
  );
}
