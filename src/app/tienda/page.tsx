import { TiendaClientGrid } from "@/components/store/tienda-client-grid";
import { getProductsPage, getRegisteredCategories } from "@/lib/catalog";
import { canonicalizeBrandName } from "@/lib/brands";
import Link from "next/link";

type Props = {
  searchParams?: {
    categoria?: string;
    marca?: string;
    page?: string;
  };
};

export default async function TiendaPage({ searchParams }: Props) {
  const page = Number.parseInt(String(searchParams?.page || "1"), 10) || 1;
  const pageSize = 20;
  const [pageResult, categories] = await Promise.all([getProductsPage(page, pageSize), getRegisteredCategories()]);
  const { products, total } = pageResult;
  const initialCategory = String(searchParams?.categoria || "").trim() || undefined;
  const initialBrand = canonicalizeBrandName(String(searchParams?.marca || "").trim()) || undefined;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="space-y-5 pb-8">
      <div className="flex items-baseline gap-3">
        <h1 className="font-[var(--font-display)] text-3xl">Tienda</h1>
        <span className="text-sm font-semibold uppercase text-muted-foreground">({products.length} PRODUCTOS)</span>
      </div>
      <TiendaClientGrid
        products={products}
        categories={categories}
        initialCategory={initialCategory}
        initialBrand={initialBrand}
      />

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
    </main>
  );
}
