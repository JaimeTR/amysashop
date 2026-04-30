import { BuscarClient } from "@/components/search/buscar-client";
import { getActiveProducts } from "@/lib/catalog";

export default async function BuscarPage() {
  const products = await getActiveProducts();

  return <BuscarClient products={products} />;
}
