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
