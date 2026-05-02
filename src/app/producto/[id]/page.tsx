import { notFound } from "next/navigation";
import { ProductDetailPurchase } from "@/components/product/product-detail-purchase";
import { ProductGallery } from "@/components/product/product-gallery";
import { RelatedProductsCarousel } from "@/components/product/related-products-carousel";
import { getActiveProducts, getProductById } from "@/lib/catalog";
import { getSafeProductImageSrc } from "@/lib/product-images";
import { DEFAULT_WHATSAPP_PHONE } from "@/lib/whatsapp";

type Props = {
  params: { id: string };
};

function extractTagValue(description: string, keys: string[]) {
  for (const key of keys) {
    const regex = new RegExp(`\\[${key}:\\s*(.*?)\\]`, "i");
    const match = description.match(regex);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return "";
}

function parseOptions(raw: string) {
  if (!raw) {
    return [] as string[];
  }

  return raw
    .split(/,|\||\//)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePriceValue(raw: string) {
  if (!raw) {
    return null;
  }

  const normalized = raw.replace(/[^0-9,.-]/g, "").replace(",", ".");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

function removeMetadataTags(description: string) {
  return description.replace(/\[[^\]]+?:\s*[^\]]*\]/g, "").replace(/\s{2,}/g, " ").trim();
}

function getSafeImageSrc(images: string[]) {
  return getSafeProductImageSrc(images);
}

function getPrimaryPhoto(images: string[]) {
  return getSafeImageSrc(images);
}

export default async function ProductoPage({ params }: Props) {
  const [product, activeProducts] = await Promise.all([getProductById(params.id), getActiveProducts()]);

  if (!product) {
    notFound();
  }

  const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || DEFAULT_WHATSAPP_PHONE;
  const mainImage = getPrimaryPhoto(product.images);
  const rawDescription = product.description || "";
  const descriptionClean = removeMetadataTags(rawDescription) || "Sin descripcion";
  const subtitle = extractTagValue(rawDescription, ["Subtitulo", "Subtítulo", "Tagline"]);
  const oldPriceFromTags = parsePriceValue(
    extractTagValue(rawDescription, ["PrecioAntes", "Precio Anterior", "PVP", "PrecioLista", "Precio Lista"])
  );
  const oldPriceValue = (product.priceBefore && product.priceBefore > 0 ? product.priceBefore : null) ?? oldPriceFromTags;

  const colorOptions = parseOptions(extractTagValue(rawDescription, ["Colores", "Color"]));
  const volumeOptions = parseOptions(
    extractTagValue(rawDescription, ["Mililitros", "ML", "Ml", "Contenido", "Presentacion", "Presentación"])
  );
  const sizeOptions = parseOptions(extractTagValue(rawDescription, ["Tallas", "Talla", "Tamano", "Tamano", "MM", "Mm", "Medidas"]));
  const contentLabel = product.content || volumeOptions[0] || extractTagValue(rawDescription, ["Contenido", "Mililitros", "ML", "Ml"]);
  const skuLabel = extractTagValue(rawDescription, ["Codigo", "Código", "SKU"]) || product.id.slice(0, 12).toUpperCase();
  const descriptionSource = (product.summary && product.summary.trim()) || descriptionClean;
  const descriptionParagraphs = descriptionSource
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const relatedProducts = activeProducts
    .filter((item) => item.id !== product.id)
    .map((item) => {
      let score = 0;
      if (item.category === product.category) score += 4;
      if (product.brand && item.brand === product.brand) score += 2;
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item)
    .slice(0, 12);

  const fallbackProducts = activeProducts
    .filter((item) => item.id !== product.id)
    .slice(0, 12);

  const carouselProducts = relatedProducts.length > 0 ? relatedProducts : fallbackProducts;

  return (
    <main className="space-y-5 pb-8">
      <section className="grid gap-3 px-3 lg:px-0 lg:grid-cols-[minmax(0,600px)_minmax(0,600px)] lg:items-start lg:justify-center">
        <article className="rounded-3xl p-0">
          <ProductGallery images={product.images} name={product.name} />
        </article>

        <aside className="glass-card space-y-5 rounded-3xl p-4 sm:p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">{product.category}</p>
          <h1 className="font-[var(--font-display)] text-2xl text-primary md:text-3xl">{product.name}</h1>

          {subtitle ? <p className="text-lg text-foreground/80">{subtitle}</p> : null}
          {contentLabel ? <p className="text-sm text-muted-foreground">{contentLabel}</p> : null}

          <div className="space-y-2">
            {oldPriceValue && oldPriceValue > product.price ? (
              <p className="text-sm font-medium text-muted-foreground line-through">S/ {oldPriceValue.toFixed(2)}</p>
            ) : null}
            <p className="text-4xl font-bold text-foreground">S/ {product.price.toFixed(2)}</p>
          </div>

          <p className="text-lg font-medium text-muted-foreground">{skuLabel}</p>

          <section className="space-y-2 text-muted-foreground">
            {(descriptionParagraphs.length > 0 ? descriptionParagraphs : [descriptionClean]).map((paragraph, index) => (
              <p key={`${product.id}-desc-${index}`} className="text-base leading-relaxed">
                {paragraph}
              </p>
            ))}
          </section>

          <ProductDetailPurchase
            productId={product.id}
            name={product.name}
            price={product.price}
            priceBefore={oldPriceValue}
            image={mainImage}
            category={product.category}
            whatsappPhone={whatsappPhone}
            colorOptions={colorOptions}
            volumeOptions={volumeOptions}
            sizeOptions={sizeOptions}
          />
        </aside>
      </section>

      <RelatedProductsCarousel products={carouselProducts} />
    </main>
  );
}
