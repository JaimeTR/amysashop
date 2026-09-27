import { buildCategoryMetadata, CategoryCatalogPage } from "@/components/store/category-catalog-page";

export const metadata = buildCategoryMetadata("cuidado-corporal");

export default function Page() {
  return <CategoryCatalogPage slug="cuidado-corporal" />;
}
