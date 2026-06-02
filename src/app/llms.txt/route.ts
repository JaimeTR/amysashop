import { getActiveProducts } from "@/lib/catalog";
import { getProductUrl } from "@/lib/product-url";
import { getSiteUrl } from "@/lib/site-url";

export async function GET() {
  const siteUrl = getSiteUrl();
  const products = await getActiveProducts();

  const topProducts = products.slice(0, 20);

  const lines = [
    "# AMYSA SHOP",
    "> Tienda online peruana de perfumes, maquillaje, cuidado personal y accesorios. Venta de productos de belleza de marcas como AMYSA, CYZONE, ESIKA, LBEL, NATURA y YANBAL.",
    "",
    "## Catálogo",
    `- [Tienda](${siteUrl}/tienda)`,
    `- [Buscar productos](${siteUrl}/buscar)`,
    "",
    "## Productos destacados",
    ...topProducts.map(
      (p) => `- [${p.name}](${siteUrl}${getProductUrl(p)}) - S/ ${p.price.toFixed(2)} - ${p.category}`
    ),
    "",
    "## Ayuda",
    `- [Centro de ayuda](${siteUrl}/ayuda)`,
    `- [Preguntas frecuentes](${siteUrl}/ayuda/faq)`,
    `- [Contacto](${siteUrl}/ayuda/contacto)`,
    `- [Envíos y devoluciones](${siteUrl}/ayuda/envios-devoluciones)`,
    "",
    "## Redes sociales",
    `- [Instagram](https://www.instagram.com/amysa.shop/)`,
    `- [TikTok](http://tiktok.com/@amysa.shop)`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
