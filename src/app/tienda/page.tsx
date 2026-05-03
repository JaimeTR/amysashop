import { TiendaClientGrid } from "@/components/store/tienda-client-grid";
import { getActiveProducts, getProductsPage, getRegisteredCategories } from "@/lib/catalog";
import { canonicalizeBrandName } from "@/lib/brands";
import Link from "next/link";

type Props = {
  searchParams?: {
    categoria?: string;
    marca?: string;
    page?: string;
    destacados?: string;
  };
};

export default async function TiendaPage({ searchParams }: Props) {
  const showFeaturedCatalog = String(searchParams?.destacados || "").toLowerCase() === "true";
  const page = Number.parseInt(String(searchParams?.page || "1"), 10) || 1;
  const pageSize = 20;
  
  // Obtener todos los productos (para contar géneros, marcas, etc) Y los de la página
  const [pageResult, featuredProducts, categories, allProducts] = await Promise.all([
    showFeaturedCatalog ? Promise.resolve(null) : getProductsPage(page, pageSize),
    showFeaturedCatalog ? getActiveProducts() : Promise.resolve([]),
    getRegisteredCategories(),
    showFeaturedCatalog ? Promise.resolve([]) : getActiveProducts(), // Todos los productos activos
  ]);
  
  const { products, total } = showFeaturedCatalog
    ? { products: featuredProducts, total: featuredProducts.length }
    : pageResult!;
  
  const initialCategory = String(searchParams?.categoria || "").trim() || undefined;
  const initialBrand = canonicalizeBrandName(String(searchParams?.marca || "").trim()) || undefined;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="space-y-5 pb-8">
      <div className="flex items-baseline gap-3 px-3 sm:px-0">
        <h1 className="font-[var(--font-display)] text-3xl">{showFeaturedCatalog ? "Destacados" : "Tienda"}</h1>
      </div>
      <TiendaClientGrid
        products={products}
        allProducts={showFeaturedCatalog ? featuredProducts : allProducts}
        categories={categories}
        initialCategory={initialCategory}
        initialBrand={initialBrand}
      />

      {!showFeaturedCatalog ? (
        <nav className="flex items-center justify-center gap-3">
        <Link
          href={`/tienda?${new URLSearchParams({ ...(searchParams as Record<string,string>), page: String(Math.max(1, page - 1)) })}`}
          className={`rounded-xl border px-3 py-2 ${page <= 1 ? "opacity-50 pointer-events-none" : ""}`}
        >
          Anterior
        </Link>

        <span className="text-sm text-muted-foreground">
          Página {page} de {totalPages}
        </span>

        <Link
          href={`/tienda?${new URLSearchParams({ ...(searchParams as Record<string,string>), page: String(Math.min(totalPages, page + 1)) })}`}
          className={`rounded-xl border px-3 py-2 ${page >= totalPages ? "opacity-50 pointer-events-none" : ""}`}
        >
          Siguiente
        </Link>
        </nav>
      ) : null}
    </main>
  );
}
