import type { Metadata } from "next";
import { BuscarClient } from "@/components/search/buscar-client";
import { getActiveProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Buscar productos",
  description: "Encuentra perfumes, maquillaje, cuidado personal y accesorios en AMYSA SHOP. Busca por nombre, marca o categoría.",
};

export default async function BuscarPage() {
  const products = await getActiveProducts();

  return <BuscarClient products={products} />;
}
