import { buildCategoryMetadata, CategoryCatalogPage } from "@/components/store/category-catalog-page";

export const metadata = buildCategoryMetadata("perfumes");

export default function Page() {
  return <CategoryCatalogPage slug="perfumes" />;
}
