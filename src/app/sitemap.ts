import type { MetadataRoute } from "next";
import { getActiveProducts } from "@/lib/catalog";
import { getProductUrl } from "@/lib/product-url";
import { getSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const products = await getActiveProducts();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/tienda",
    "/buscar",
    "/ayuda",
    "/ayuda/contacto",
    "/ayuda/faq",
    "/ayuda/envios-devoluciones",
    "/carrito",
    "/registro",
    "/login",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}${getProductUrl(product)}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticRoutes, ...productRoutes];
}