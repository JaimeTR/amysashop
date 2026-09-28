import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowRight, Droplets, Gem, MessageCircle, Package, Palette, ShoppingBag, Smartphone, Sparkles, Tag, Store, Truck } from "lucide-react";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { BrandShowcase } from "@/components/store/brand-showcase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleFavoriteButton } from "@/components/product/toggle-favorite-button";
import { getActiveProducts, getRegisteredCategories } from "@/lib/catalog";
import { DiscountCarouselClient } from "@/components/store/discount-carousel-client";
import { HomeHeroTypingSlogan } from "@/components/store/home-hero-typing-slogan";
import { DEFAULT_PRODUCT_IMAGE, getSafeProductImageSrc, isOptimizableImageSrc } from "@/lib/product-images";
import { getProductUrl } from "@/lib/product-url";
import { getCategoryHref } from "@/lib/category-pages";
import { DigitalProductCard } from "@/components/digital/digital-product-card";
import { getPublicDigitalProducts } from "@/lib/digital-store";
import { getSiteUrl, DEFAULT_OG_IMAGE } from "@/lib/site-url";

function extractTagValue(description: string, key: string) {
  const regex = new RegExp(`\\[${key}:\\s*(.*?)\\]`, "i");
  const match = description.match(regex);
  return match?.[1]?.trim() || "";
}

function parseOptions(raw: string) {
  if (!raw) return [] as string[];
  return raw
    .split(/,|\||\//)
    .flatMap((item) => {
      const trimmed = item.trim();
      return trimmed ? [trimmed] : [];
    });
}

function normalizeLabel(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function uniqueLabels(values: string[]) {
  const seen = new Map<string, string>();

  for (const value of values) {
    const label = String(value || "").trim();
    if (!label) continue;

    const key = normalizeLabel(label);
    if (!seen.has(key)) {
      seen.set(key, label);
    }
  }

  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b, "es"));
}

const palette = [
  "from-[#f9efe9] to-[#f4e1d6] text-[#7b4f3a]",
  "from-[#f7f1e6] to-[#efe3cd] text-[#6f5a2a]",
  "from-[#eef4ea] to-[#ddebd4] text-[#3f6a3d]",
  "from-[#eaf1f6] to-[#d9e7f1] text-[#345b77]",
  "from-[#f2ecf7] to-[#e5d8f1] text-[#5b4a7a]",
  "from-[#f8ecee] to-[#f1d8de] text-[#7a3e4e]",
];

function getPaletteClass(key: string) {
  const normalized = key.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return palette[hash % palette.length];
}

function getCategoryIcon(category: string) {
  const normalized = normalizeLabel(category);

  if (normalized.includes("perf") || normalized.includes("frag") || normalized.includes("arom")) {
    return Sparkles;
  }

  if (normalized.includes("maqu") || normalized.includes("make")) {
    return Palette;
  }

  if (normalized.includes("acces") || normalized.includes("joy") || normalized.includes("bijou")) {
    return Gem;
  }

  if (normalized.includes("cuidado") || normalized.includes("piel") || normalized.includes("corporal") || normalized.includes("hidra")) {
    return Droplets;
  }

  if (normalized.includes("promo") || normalized.includes("ofert") || normalized.includes("descuento") || normalized.includes("sale")) {
    return Tag;
  }

  if (normalized.includes("catal") || normalized.includes("pack") || normalized.includes("combo")) {
    return Package;
  }

  return ShoppingBag;
}

function getInitials(text: string) {
  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "AM";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
}

function getSafeImageSrc(images: string[]) {
  return getSafeProductImageSrc(images);
}

function getDiscountPercent(priceBefore: number | null | undefined, price: number) {
  const basePrice = Number(priceBefore || 0);
  const currentPrice = Number(price || 0);

  if (!basePrice || basePrice <= currentPrice) {
    return 0;
  }

  return Math.round(((basePrice - currentPrice) / basePrice) * 100);
}

export const metadata: Metadata = {
  title: { absolute: "AMYSA SHOP | Perfumes, maquillaje y cuidado personal en Perú" },
  description:
    "Tienda online en Perú de perfumes, maquillaje, cuidado personal y accesorios de Ésika, L'Bel, Cyzone y Yanbal. Ofertas, envío a Lima y provincias, pago con Yape, Plin o transferencia.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "AMYSA SHOP | Perfumes, maquillaje y cuidado personal en Perú",
    description: "Perfumes, maquillaje y cuidado personal de las mejores marcas de catálogo. Envío a Lima y provincias.",
    type: "website",
    url: "/",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function Home() {
  const [products, categories, digitalProducts] = await Promise.all([
    getActiveProducts(),
    getRegisteredCategories(),
    getPublicDigitalProducts(),
  ]);
  const featuredProducts = products.slice(0, 15);
  const homeDigitalProducts = [...digitalProducts]
    .sort((a, b) => Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder)
    .slice(0, 4);

  const discountedProducts = products
    .filter((product) => Number(product.priceBefore || 0) > Number(product.price || 0))
    .sort((a, b) => getDiscountPercent(b.priceBefore, b.price) - getDiscountPercent(a.priceBefore, a.price))
    // El carrusel duplica la lista para el efecto infinito: limitar reduce mucho el HTML.
    .slice(0, 12);

  // Collage del hero: productos reales (ofertas primero) en lugar de una ilustración genérica.
  const heroProducts = [...discountedProducts, ...featuredProducts]
    .filter((product, index, list) => list.findIndex((item) => item.id === product.id) === index)
    .filter((product) => getSafeImageSrc(product.images) !== DEFAULT_PRODUCT_IMAGE)
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AMYSA SHOP",
    url: getSiteUrl(),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${getSiteUrl()}/buscar?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <main className="space-y-8 pb-10 pt-2">
      <section className="glass-card animate-in fade-in duration-700 overflow-hidden rounded-3xl p-5 sm:p-8 lg:p-10">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="text-center lg:text-left">
            <Link
              href="/digital"
              className="group mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-primary/20 bg-white/80 py-1 pl-1 pr-3 text-xs font-semibold text-foreground shadow-sm transition hover:border-primary/40 hover:bg-white"
            >
              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">Nuevo</span>
              <span className="truncate">Plantillas, libros y cursos digitales</span>
              <ArrowRight className="size-3.5 shrink-0 text-primary transition group-hover:translate-x-0.5" />
            </Link>

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">Tienda online en Perú</p>

            <h1 className="mt-3 font-[var(--font-display)] text-3xl leading-tight text-foreground sm:text-4xl lg:text-5xl">
              Perfumes, maquillaje y cuidado personal
              <span className="mt-2 block min-h-[1.3em] text-2xl text-primary sm:text-3xl lg:text-4xl">
                <span className="sr-only">AMYSA SHOP, </span>
                <HomeHeroTypingSlogan />
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base lg:mx-0">
              Las marcas de catálogo que te encantan —Ésika, L&apos;Bel, Cyzone, Yanbal y más— con ofertas cada semana y envío a
              todo el Perú. Y para emprender: plantillas, libros y cursos digitales que recibes por correo.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/tienda">
                  Ver catálogo <Store className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link href="/tienda?descuento=true">
                  Ver ofertas <Tag className="ml-2 size-4" />
                </Link>
              </Button>
            </div>

            <ul className="mt-6 grid grid-cols-3 gap-2 text-[11px] leading-tight text-foreground sm:text-sm">
              <li className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/60 px-2 py-2.5 text-center sm:flex-row sm:gap-2 sm:px-3 sm:text-left">
                <Truck className="size-4 shrink-0 text-primary" /> Envío a todo el Perú
              </li>
              <li className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/60 px-2 py-2.5 text-center sm:flex-row sm:gap-2 sm:px-3 sm:text-left">
                <Smartphone className="size-4 shrink-0 text-primary" /> Yape, Plin o transferencia
              </li>
              <li className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/60 px-2 py-2.5 text-center sm:flex-row sm:gap-2 sm:px-3 sm:text-left">
                <MessageCircle className="size-4 shrink-0 text-primary" /> Atención por WhatsApp
              </li>
            </ul>
          </div>

          {heroProducts.length >= 3 ? (
            <div className="hidden grid-cols-2 gap-3 lg:grid" aria-label="Productos destacados">
              {heroProducts.map((product, index) => {
                const src = getSafeImageSrc(product.images);
                const discount = getDiscountPercent(product.priceBefore, product.price);
                return (
                  <Link
                    key={product.id}
                    href={getProductUrl(product)}
                    className={`group relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-white/70 transition hover:shadow-xl ${
                      index === 0 ? "row-span-2 aspect-[3/4] sm:aspect-auto" : "aspect-square"
                    }`}
                  >
                    <Image
                      src={src}
                      alt={product.name}
                      fill
                      priority={index === 0}
                      sizes="(max-width: 768px) 50vw, 25vw"
                      unoptimized={!isOptimizableImageSrc(src)}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2 rounded-2xl bg-white/90 px-3 py-1.5 text-xs shadow-sm backdrop-blur">
                      <span className="line-clamp-1 font-semibold text-foreground">{product.name}</span>
                      <span className="shrink-0 font-bold text-primary">S/ {product.price.toFixed(2)}</span>
                    </span>
                    {discount > 0 ? (
                      <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
                        -{discount}%
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="hidden justify-center lg:flex">
              <Image
                src="/logos/tiendaaperturasinfondo.png"
                alt="Tienda AMYSA"
                width={320}
                height={320}
                className="size-72 object-contain lg:size-80"
                priority
              />
            </div>
          )}
        </div>
      </section>

      <BrandShowcase />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="w-full text-center font-[var(--font-display)] text-2xl md:w-auto md:text-left">Descuentos y ofertas</h2>
          <Link href="/tienda?descuento=true" className="hidden items-center gap-2 text-sm font-semibold text-primary hover:underline md:inline-flex">
            Ver más descuentos <ArrowRight className="size-4" />
          </Link>
        </div>
        <DiscountCarouselClient products={discountedProducts} />
        <div className="flex justify-center md:justify-start">
          <Link
            href="/tienda?descuento=true"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline md:hidden"
          >
            Ver más descuentos <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-center gap-2 md:justify-start">
          <Sparkles className="size-5 text-primary" />
          <h2 className="font-[var(--font-display)] text-2xl">Categorías</h2>
        </div>
        <div className="glass-card rounded-3xl p-4">
          <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:gap-4 lg:grid-cols-5">
            {categories.length > 0 ? (
              categories.map((category) => {
                const CategoryIcon = getCategoryIcon(category);

                return (
                  <Link
                    key={category}
                    href={getCategoryHref(category)}
                    className="group flex w-20 shrink-0 flex-col items-center gap-2 rounded-2xl border border-transparent px-2 py-2 transition hover:border-primary/30 hover:bg-white/50 md:min-w-0 md:px-2 md:py-3"
                  >
                    <span
                      className={`flex size-12 items-center justify-center rounded-full border border-white/70 bg-gradient-to-br shadow-sm transition group-hover:scale-105 md:size-14 ${getPaletteClass(category)}`}
                    >
                      <CategoryIcon className="size-5 md:size-6" />
                    </span>
                    <span className="line-clamp-2 text-center text-[11px] font-semibold leading-tight text-foreground md:text-xs">{category}</span>
                  </Link>
                );
              })
            ) : (
              <div className="col-span-full rounded-2xl border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
                Aún no hay categorías registradas en tienda.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3 px-3 sm:px-0">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-[var(--font-display)] text-2xl">Destacados</h2>
          {products.length > featuredProducts.length ? (
            <Link href="/tienda?destacados=true" className="inline-flex items-center text-sm font-semibold text-primary">
              Ver más productos <ArrowRight className="ml-1 size-4" />
            </Link>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {featuredProducts.map((product) => (
            <article key={product.id} className="glass-card group flex flex-col overflow-hidden rounded-2xl transition duration-300 hover:-translate-y-0.5 hover:shadow-lg">
              {(() => {
                const discountPercent = getDiscountPercent(product.priceBefore, product.price);

                return (
                  <>
              <Link href={getProductUrl(product)}>
                <Image
                  src={getSafeImageSrc(product.images)}
                  alt={product.name}
                  width={600}
                  height={600}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
                  unoptimized={!isOptimizableImageSrc(getSafeImageSrc(product.images))}
                  className="aspect-square w-full object-cover transition-transform duration-300 transform group-hover:scale-105"
                />
              </Link>

              <div className="space-y-2 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.category}</p>
                <Link href={getProductUrl(product)} className="block">
                  <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-foreground hover:text-primary">{product.name}</h3>
                </Link>

                <div className="space-y-0.5">
                  {product.priceBefore && product.priceBefore > product.price ? (
                    <p className="text-xs text-muted-foreground line-through">S/ {Number(product.priceBefore).toFixed(2)}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-bold text-primary">S/ {product.price.toFixed(2)}</p>
                    {discountPercent > 0 ? <Badge className="border border-success/70 bg-success/90 text-success-foreground">{discountPercent}% OFF</Badge> : null}
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <AddToCartButton
                    productId={product.id}
                    name={product.name}
                    price={product.price}
                    priceBefore={product.priceBefore}
                    image={getSafeImageSrc(product.images)}
                    buttonLabel="Agregar"
                  />
                  <ToggleFavoriteButton
                    productId={product.id}
                    name={product.name}
                    price={product.price}
                    image={getSafeImageSrc(product.images)}
                    category={product.category}
                  />
                </div>

              </div>
                  </>
                );
              })()}
            </article>
          ))}
        </div>
      </section>

      {homeDigitalProducts.length > 0 ? (
        <section className="glass-card space-y-5 rounded-3xl p-5 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">Nuevo · Productos digitales</p>
              <h2 className="font-[var(--font-display)] text-2xl sm:text-3xl">Plantillas, libros y cursos para tu negocio</h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Te llegan por correo en cuanto confirmamos tu pago. Ideales para organizar tus ventas por catálogo y emprender.
              </p>
            </div>
            <Link href="/digital" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              Ver todos <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {homeDigitalProducts.map((product) => (
              <DigitalProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}
