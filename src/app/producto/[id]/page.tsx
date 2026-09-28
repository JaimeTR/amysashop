import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ProductDetailPurchase } from "@/components/product/product-detail-purchase";
import { ProductGallery } from "@/components/product/product-gallery";
import { RelatedProductsCarousel } from "@/components/product/related-products-carousel";
import { getActiveProducts, getProductById, getProductBySlug } from "@/lib/catalog";
import { getSafeProductImageSrc } from "@/lib/product-images";
import { getProductUrl, slugifyProductName } from "@/lib/product-url";
import { DEFAULT_WHATSAPP_PHONE } from "@/lib/whatsapp";
import { getSiteUrl } from "@/lib/site-url";
import { getCategoryPageByName } from "@/lib/category-pages";

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
  let product = await getProductById(params.id);

  if (!product) {
    product = await getProductBySlug(params.id);
  }

  if (!product) {
    notFound();
  }

  const canonicalPath = getProductUrl(product);
  const receivedSlug = String(params.id || "").trim().toLowerCase();
  const expectedSlug = slugifyProductName(product.name);

  if (receivedSlug !== expectedSlug) {
    redirect(canonicalPath);
  }

  const activeProducts = await getActiveProducts();

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

  const siteUrl = getSiteUrl();
  const productUrl = `${siteUrl}${canonicalPath}`;
  const categoryPage = getCategoryPageByName(product.category);
  const absoluteImages = product.images
    .filter((src) => !/\.(mp4|webm|ogg|mov|m4v)(?:$|\?)/i.test(src))
    .map((src) => (src.startsWith("/") ? `${siteUrl}${src}` : src))
    .slice(0, 6);
  const shippingRates = [
    { fee: 10, region: "Lima Metropolitana", transitDays: [2, 5] },
    { fee: 15, region: "Provincias (Shalom)", transitDays: [2, 5] },
  ];
  const productJsonLd = [
    {
      "@context": "https://schema.org/",
      "@type": "Product",
      "@id": `${productUrl}#product`,
      name: product.name,
      image: absoluteImages.length > 0 ? absoluteImages : mainImage ? [mainImage] : [],
      description: descriptionClean,
      sku: skuLabel,
      category: product.category,
      brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
      offers: {
        "@type": "Offer",
        url: productUrl,
        priceCurrency: "PEN",
        price: product.price?.toFixed(2),
        priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        itemCondition: "https://schema.org/NewCondition",
        availability: product.stock && product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        seller: { "@id": `${siteUrl}/#organization` },
        shippingDetails: shippingRates.map((rate) => ({
          "@type": "OfferShippingDetails",
          shippingRate: { "@type": "MonetaryAmount", value: rate.fee, currency: "PEN" },
          shippingDestination: { "@type": "DefinedRegion", addressCountry: "PE", name: rate.region },
          deliveryTime: {
            "@type": "ShippingDeliveryTime",
            handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 2, unitCode: "DAY" },
            transitTime: { "@type": "QuantitativeValue", minValue: rate.transitDays[0], maxValue: rate.transitDays[1], unitCode: "DAY" },
          },
        })),
        hasMerchantReturnPolicy: {
          "@type": "MerchantReturnPolicy",
          applicableCountry: "PE",
          returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
          merchantReturnDays: 7,
          returnMethod: "https://schema.org/ReturnByMail",
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl },
        {
          "@type": "ListItem",
          position: 2,
          name: categoryPage?.title || "Tienda",
          item: categoryPage ? `${siteUrl}/tienda/${categoryPage.slug}` : `${siteUrl}/tienda`,
        },
        { "@type": "ListItem", position: 3, name: product.name, item: productUrl },
      ],
    },
  ];

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
      {/* JSON-LD schema.org: Product (con envío y devoluciones) + BreadcrumbList */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
    </main>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  let product = await getProductById(params.id);

  if (!product) {
    product = await getProductBySlug(params.id);
  }

  if (!product) {
    return { title: "Producto no encontrado" };
  }

  const mainImage = getPrimaryPhoto(product.images);
  // Texto limpio (sin etiquetas internas [Marca: ...]) y de largo apto para Google (~160 caracteres).
  const baseDescription =
    removeMetadataTags((product.summary && product.summary.trim()) || product.description || "") ||
    `${product.name}${product.brand ? ` de ${product.brand}` : ""} en AMYSA SHOP.`;
  const priceText = `S/ ${product.price.toFixed(2)}`;
  const descriptionBody = baseDescription.length > 120 ? `${baseDescription.slice(0, 117).trimEnd()}...` : baseDescription;
  const description = `${descriptionBody} Precio: ${priceText}. Envío a Lima y provincias.`;
  const canonicalPath = getProductUrl(product);
  const canonicalUrl = `${getSiteUrl()}${canonicalPath}`;
  const seoTitle = product.brand && !product.name.toLowerCase().includes(product.brand.toLowerCase())
    ? `${product.name} - ${product.brand}`
    : product.name;

  const metadata: Metadata = {
    title: seoTitle,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: product.name,
      description,
      type: "website",
      url: canonicalUrl,
      images: mainImage ? [{ url: mainImage, alt: product.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: mainImage ? [mainImage] : undefined,
    },
  };

  return metadata;
}
