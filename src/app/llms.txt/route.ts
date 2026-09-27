import { getActiveProducts } from "@/lib/catalog";
import { CATEGORY_PAGES, getCategoryPageByName } from "@/lib/category-pages";
import { getProductUrl } from "@/lib/product-url";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 3600;

// llms.txt (https://llmstxt.org): resumen del sitio para buscadores con IA (GEO).
// Los datos de pago/envío deben coincidir con src/app/ayuda/faq/page.tsx.
export async function GET() {
  const siteUrl = getSiteUrl();
  const products = (await getActiveProducts()).filter((product) => product.id.includes("-"));

  const byCategory = new Map<string, typeof products>();
  for (const product of products) {
    const list = byCategory.get(product.category) || [];
    list.push(product);
    byCategory.set(product.category, list);
  }

  const brands = Array.from(new Set(products.map((product) => product.brand).filter(Boolean))).sort();

  const productSections = Array.from(byCategory.entries()).flatMap(([category, items]) => {
    const page = getCategoryPageByName(category);
    return [
      `### ${category}${page ? ` (${siteUrl}/tienda/${page.slug})` : ""}`,
      ...items.map((product) => {
        const offer =
          product.priceBefore && product.priceBefore > product.price ? ` (antes S/ ${product.priceBefore.toFixed(2)})` : "";
        const brand = product.brand ? ` - ${product.brand}` : "";
        return `- [${product.name}](${siteUrl}${getProductUrl(product)})${brand} - S/ ${product.price.toFixed(2)}${offer}`;
      }),
      "",
    ];
  });

  const lines = [
    "# AMYSA SHOP",
    "",
    "> Tienda online peruana de perfumes, maquillaje, cuidado personal, joyas y accesorios de marcas de catálogo (Ésika, L'Bel, Cyzone, Yanbal) y packs propios. Vende en soles (PEN) con envío a Lima y a todo el Perú.",
    "",
    "## Datos clave",
    "- País: Perú (Lima). Moneda: soles (S/).",
    "- Pagos: Yape, Plin y transferencia bancaria (BCP, Interbank, BBVA).",
    "- Envío Lima Metropolitana: S/ 10.00. Envío a provincias por Shalom: S/ 15.00. Entrega a coordinar en Lima: sin costo.",
    "- Tiempos: preparación 24-48 h hábiles; entrega 2-5 días hábiles según destino.",
    "- Cambios y devoluciones: dentro de 7 días de recibido, por producto defectuoso o error en el pedido.",
    "- Pedidos: desde el carrito (checkout) o por WhatsApp.",
    "- WhatsApp / teléfono: +51 965 312 386.",
    `- Marcas disponibles: ${brands.join(", ") || "Ésika, L'Bel, Cyzone, Yanbal"}.`,
    "",
    "## Categorías",
    `- [Catálogo completo](${siteUrl}/tienda)`,
    ...CATEGORY_PAGES.map((page) => `- [${page.title}](${siteUrl}/tienda/${page.slug}): ${page.description}`),
    "",
    `## Productos (${products.length})`,
    "",
    ...productSections,
    "## Ayuda",
    `- [Preguntas frecuentes](${siteUrl}/ayuda/faq): pagos, envíos, tiempos y devoluciones.`,
    `- [Envíos y devoluciones](${siteUrl}/ayuda/envios-devoluciones)`,
    `- [Contacto](${siteUrl}/ayuda/contacto)`,
    "",
    "## Productos digitales",
    `- [Plantillas de Excel para vendedoras por catálogo](${siteUrl}/digital/ambarcastro): control de ventas, pedidos y ganancias (niveles Básico, Intermedio y PRO).`,
    "",
    "## Redes sociales",
    "- [Instagram](https://www.instagram.com/amysa.shop/)",
    "- [TikTok](https://www.tiktok.com/@amysa.shop)",
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
