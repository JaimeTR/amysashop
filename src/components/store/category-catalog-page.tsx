import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TiendaClientGrid } from "@/components/store/tienda-client-grid";
import { getActiveProducts, getRegisteredCategories } from "@/lib/catalog";
import { getCategoryPage, matchCategoryName } from "@/lib/category-pages";
import { getProductUrl } from "@/lib/product-url";
import { getSiteUrl } from "@/lib/site-url";

export function buildCategoryMetadata(slug: string): Metadata {
  const config = getCategoryPage(slug);
  if (!config) return {};

  const path = `/tienda/${config.slug}`;
  return {
    title: config.title,
    description: config.description,
    keywords: [...config.keywords, "AMYSA SHOP"],
    alternates: { canonical: path },
    openGraph: { title: `${config.title} | AMYSA SHOP`, description: config.description, url: path, type: "website" },
  };
}

// Página de categoría renderizada en el servidor: título, texto propio y el catálogo filtrado,
// para que Google y los buscadores con IA encuentren contenido real (antes era un placeholder).
export async function CategoryCatalogPage({ slug }: { slug: string }) {
  const config = getCategoryPage(slug);
  if (!config) notFound();

  const [products, categories] = await Promise.all([getActiveProducts(), getRegisteredCategories()]);
  const categoryName = matchCategoryName(config, categories);
  const categoryProducts = products.filter((product) => product.category === categoryName);
  const siteUrl = getSiteUrl();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: config.title,
      description: config.description,
      url: `${siteUrl}/tienda/${config.slug}`,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: categoryProducts.length,
        itemListElement: categoryProducts.slice(0, 30).map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${siteUrl}${getProductUrl(product)}`,
          name: product.name,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Tienda", item: `${siteUrl}/tienda` },
        { "@type": "ListItem", position: 3, name: config.title, item: `${siteUrl}/tienda/${config.slug}` },
      ],
    },
  ];

  return (
    <main className="space-y-5 pb-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="space-y-2 px-3 text-center sm:px-0 sm:text-left">
        <h1 className="font-[var(--font-display)] text-3xl">{config.title}</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">{config.intro}</p>
      </header>
      <TiendaClientGrid products={products} categories={categories} initialCategory={categoryName} />
    </main>
  );
}
