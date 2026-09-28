import type { MetadataRoute } from "next";
import { getActiveProducts } from "@/lib/catalog";
import { CATEGORY_PAGES } from "@/lib/category-pages";
import { getPublicDigitalProducts } from "@/lib/digital-store";
import { getProductUrl } from "@/lib/product-url";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const [products, digitalProducts] = await Promise.all([getActiveProducts(), getPublicDigitalProducts()]);
  // Solo productos reales de la BD (los de ejemplo no tienen UUID).
  const realProducts = products.filter((product) => product.id.includes("-"));
  const latestUpdate = realProducts
    .map((product) => product.updatedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);
  const catalogLastModified = latestUpdate ? new Date(latestUpdate) : new Date();

  const pages: Array<{ path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }> = [
    { path: "", priority: 1, changeFrequency: "daily" },
    { path: "/tienda", priority: 0.9, changeFrequency: "daily" },
    ...CATEGORY_PAGES.map((page) => ({ path: `/tienda/${page.slug}`, priority: 0.8, changeFrequency: "daily" as const })),
    { path: "/digital", priority: 0.7, changeFrequency: "weekly" },
    { path: "/digital/ambarcastro", priority: 0.6, changeFrequency: "monthly" },
    { path: "/ayuda", priority: 0.5, changeFrequency: "monthly" },
    { path: "/ayuda/faq", priority: 0.6, changeFrequency: "monthly" },
    { path: "/ayuda/envios-devoluciones", priority: 0.6, changeFrequency: "monthly" },
    { path: "/ayuda/contacto", priority: 0.5, changeFrequency: "monthly" },
    { path: "/legal/terminos", priority: 0.3, changeFrequency: "monthly" },
    { path: "/legal/privacidad", priority: 0.3, changeFrequency: "monthly" },
    { path: "/legal/cookies", priority: 0.2, changeFrequency: "monthly" },
    { path: "/libro-de-reclamaciones", priority: 0.3, changeFrequency: "monthly" },
  ];

  const staticRoutes: MetadataRoute.Sitemap = pages.map((page) => ({
    url: `${siteUrl}${page.path}`,
    lastModified: page.changeFrequency === "daily" ? catalogLastModified : undefined,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const productRoutes: MetadataRoute.Sitemap = realProducts.map((product) => ({
    url: `${siteUrl}${getProductUrl(product)}`,
    lastModified: product.updatedAt ? new Date(product.updatedAt) : undefined,
    changeFrequency: "weekly",
    priority: 0.7,
    images: product.images.filter((src) => /^https?:\/\//.test(src)).slice(0, 3),
  }));

  const digitalRoutes: MetadataRoute.Sitemap = digitalProducts.map((product) => ({
    url: `${siteUrl}/digital/${product.slug}`,
    lastModified: product.updatedAt ? new Date(product.updatedAt) : undefined,
    changeFrequency: "weekly",
    priority: 0.7,
    images: [product.coverUrl, ...product.previewImages].filter((src): src is string => Boolean(src)).slice(0, 3),
  }));

  return [...staticRoutes, ...productRoutes, ...digitalRoutes];
}
