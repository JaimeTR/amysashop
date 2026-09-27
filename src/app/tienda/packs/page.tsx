import { buildCategoryMetadata, CategoryCatalogPage } from "@/components/store/category-catalog-page";

export const metadata = buildCategoryMetadata("packs");

export default function Page() {
  return <CategoryCatalogPage slug="packs" />;
}
