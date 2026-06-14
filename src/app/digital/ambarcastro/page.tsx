import { DigitalLandingClient } from "@/components/digital/digital-landing-client";
import { getDigitalProducts } from "@/lib/digital-actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plantillas de Excel | Ambarcastro",
  description: "Plantillas profesionales de Excel para organizar ventas, inventario y finanzas de tu negocio.",
};

export default async function AmbarcastroPage() {
  const products = await getDigitalProducts();

  return <DigitalLandingClient initialProducts={products} />;
}
