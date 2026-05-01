import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Droplets, Gem, Package, Palette, ShoppingBag, Sparkles, Star, Tag, Store } from "lucide-react";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { BrandShowcase } from "@/components/store/brand-showcase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleFavoriteButton } from "@/components/product/toggle-favorite-button";
import { getActiveProducts, getRegisteredCategories } from "@/lib/catalog";
import { DiscountCarouselClient } from "@/components/store/discount-carousel-client";
import { HomeHeroTypingSlogan } from "@/components/store/home-hero-typing-slogan";
import { getSafeProductImageSrc } from "@/lib/product-images";

function extractTagValue(description: string, key: string) {
  const regex = new RegExp(`\\[${key}:\\s*(.*?)\\]`, "i");
  const match = description.match(regex);
  return match?.[1]?.trim() || "";
}

function parseOptions(raw: string) {
  if (!raw) return [] as string[];
  return raw
    .split(/,|\||\//)
    .map((item) => item.trim())
    .filter(Boolean);
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

export default async function Home() {
  const [products, categories] = await Promise.all([getActiveProducts(), getRegisteredCategories()]);
  const featuredProducts = products.slice(0, 10);

  const discountedProducts = products
    .filter((product) => Number(product.priceBefore || 0) > Number(product.price || 0))
    .sort((a, b) => getDiscountPercent(b.priceBefore, b.price) - getDiscountPercent(a.priceBefore, a.price));

  return (
    <main className="space-y-8 pb-10 pt-2">
      <section className="glass-card animate-in fade-in duration-700 rounded-3xl p-6 text-center md:text-left">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">AMYSA SHOP</p>

        {/* Desktop: título grande (visible en md+) */}
        <h1 className="hidden md:block font-[var(--font-display)] text-4xl leading-tight text-foreground">
          AMYSA SHOP,
          <HomeHeroTypingSlogan />
        </h1>

        {/* Mobile: mostrar solo texto en movimiento en tamaño más pequeño */}
        <h1 className="block md:hidden">
          <span className="sr-only">AMYSA SHOP</span>
          <span className="block text-primary text-xl md:text-2xl lg:text-3xl mx-auto font-normal whitespace-normal break-words min-h-[3rem] md:min-h-0 leading-tight">
            <HomeHeroTypingSlogan />
          </span>
        </h1>

        <p className="mt-3 text-sm text-muted-foreground text-center md:text-left mx-auto md:mx-0 max-w-xl">
          Explora el catálogo de productos seleccionados por AMYSA.
        </p>

        <div className="mt-5 flex flex-col md:flex-row items-center md:items-center gap-3">
          <div className="w-full md:w-auto">
            <Button asChild className="w-full">
              <Link href="/tienda" className="inline-flex items-center justify-center w-full uppercase font-light md:font-semibold">
                VER TIENDA <Store className="ml-2 size-4" />
              </Link>
            </Button>
          </div>

          <div className="w-full md:w-auto">
            <Button variant="outline" asChild className="w-full">
              <Link href="/favoritos" className="inline-flex items-center justify-center w-full uppercase font-light md:font-semibold">
                FAVORITOS <Star className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>

      </section>

      {/* Flecha indicadora solo en móvil, fuera del contenedor hero: desplaza hacia la sección de marcas */}
      <div className="-mt-2 flex justify-center md:hidden">
        <a href="#brands" className="inline-flex items-center justify-center rounded-full bg-white/10 p-2 text-primary shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </a>
      </div>

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
                    href={`/tienda?categoria=${encodeURIComponent(category)}`}
                    className="group flex min-w-[4.5rem] shrink-0 flex-col items-center gap-2 rounded-2xl border border-transparent px-2 py-2 transition hover:border-primary/30 hover:bg-white/50 md:min-w-0 md:px-2 md:py-3"
                  >
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/70 bg-gradient-to-br shadow-sm transition group-hover:scale-105 md:h-14 md:w-14 ${getPaletteClass(category)}`}
                    >
                      <CategoryIcon className="size-5 md:size-6" />
                    </span>
                    <span className="hidden line-clamp-2 text-center text-xs font-semibold text-foreground md:block">{category}</span>
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

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-[var(--font-display)] text-2xl">Destacados</h2>
          <Link href="/tienda" className="inline-flex items-center text-sm font-semibold text-primary">
            Explorar más <ArrowRight className="ml-1 size-4" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {featuredProducts.map((product) => (
            <article key={product.id} className="glass-card overflow-hidden rounded-2xl group transition-transform duration-300 hover:scale-102 hover:shadow-lg">
              {(() => {
                const discountPercent = getDiscountPercent(product.priceBefore, product.price);

                return (
                  <>
              <Link href={`/producto/${product.id}`}>
                <Image
                  src={getSafeImageSrc(product.images)}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="h-40 w-full object-cover transition-transform duration-300 transform group-hover:scale-105"
                />
              </Link>

              <div className="space-y-2 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.category}</p>
                <Link href={`/producto/${product.id}`} className="block">
                  <h3 className="line-clamp-1 truncate font-semibold text-foreground hover:text-primary">{product.name}</h3>
                </Link>

                <div className="space-y-0.5">
                  {product.priceBefore && product.priceBefore > product.price ? (
                    <p className="text-xs text-muted-foreground line-through">S/ {Number(product.priceBefore).toFixed(2)}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-bold text-primary">S/ {product.price.toFixed(2)}</p>
                    {discountPercent > 0 ? <Badge className="border border-emerald-300 bg-emerald-100 text-emerald-700">{discountPercent}% OFF</Badge> : null}
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

                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link href={`/producto/${product.id}`}>
                    Ver producto <ShoppingBag className="ml-2 size-4" />
                  </Link>
                </Button>
              </div>
                  </>
                );
              })()}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
