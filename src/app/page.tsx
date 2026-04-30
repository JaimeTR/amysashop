import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShoppingBag, Sparkles, Star, Tag } from "lucide-react";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { BrandShowcase } from "@/components/store/brand-showcase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleFavoriteButton } from "@/components/product/toggle-favorite-button";
import { getActiveProducts } from "@/lib/catalog";

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

function getInitials(text: string) {
  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "AM";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
}

function isSafeImageSrc(value: string) {
  const src = String(value || "").trim();
  return src.startsWith("/") || /^https?:\/\//i.test(src);
}

function getSafeImageSrc(images: string[]) {
  const candidate = (images || []).find((value) => isSafeImageSrc(value) && !/\.(mp4|webm|ogg|mov|m4v)(?:$|\?)/i.test(value));
  return candidate || "/placeholder-product.svg";
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
  const products = await getActiveProducts();
  const featuredProducts = products.slice(0, 10);

  const discountedProducts = products
    .filter((product) => Number(product.priceBefore || 0) > Number(product.price || 0))
    .slice(0, 8);

  const categories = uniqueLabels(products.map((item) => item.category).filter(Boolean));

  return (
    <main className="space-y-8 pb-10 pt-2">
      <section className="glass-card animate-in fade-in duration-700 rounded-3xl p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">AMYSA SHOP</p>
        <h1 className="font-[var(--font-display)] text-4xl leading-tight text-foreground">
          AMYSA SHOP,
          <span className="block text-primary">tu tienda virtual.</span>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Explora el catálogo de productos disponibles y compra por WhatsApp con mensaje personalizado.
        </p>
        <div className="mt-5 flex items-center gap-3">
          <Button asChild>
            <Link href="/tienda">
              Ir a tienda <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/favoritos">
              <Star className="mr-2 size-4" /> Favoritos
            </Link>
          </Button>
        </div>
      </section>

      <BrandShowcase />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-[var(--font-display)] text-2xl">Productos con descuento y oferta</h2>
          <Link href="/tienda" className="text-sm font-semibold text-primary">
            Ver todo
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(discountedProducts.length > 0 ? discountedProducts : products.slice(0, 4)).map((product) => (
            <article key={product.id} className="glass-card overflow-hidden rounded-2xl transition hover:scale-[1.01]">
              <Link href={`/producto/${product.id}`}>
                <Image
                  src={getSafeImageSrc(product.images)}
                  alt={product.name}
                  width={500}
                  height={500}
                  className="h-44 w-full object-cover"
                />
              </Link>
              <div className="space-y-2 p-3">
                {(() => {
                  const discountPercent = getDiscountPercent(product.priceBefore, product.price);

                  return (
                    <>
                      <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                        <Tag className="size-3" /> Oferta {discountPercent > 0 ? `-${discountPercent}%` : ""}
                      </div>
                      <Link href={`/producto/${product.id}`}>
                        <h3 className="line-clamp-2 font-semibold text-foreground">{product.name}</h3>
                      </Link>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                      <div className="space-y-0.5">
                        {product.priceBefore && product.priceBefore > product.price ? (
                          <p className="text-xs text-muted-foreground line-through">S/ {Number(product.priceBefore).toFixed(2)}</p>
                        ) : null}
                        <p className="text-lg font-bold text-primary">S/ {product.price.toFixed(2)}</p>
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
                    </>
                  );
                })()}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <h2 className="font-[var(--font-display)] text-2xl">Categorías</h2>
        </div>
        <div className="glass-card rounded-3xl p-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {categories.slice(0, 15).map((category) => (
              <Link
                key={category}
                href={`/tienda?categoria=${encodeURIComponent(category)}`}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-transparent px-2 py-2 transition hover:border-primary/30 hover:bg-white/50"
              >
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-full border border-white/70 bg-gradient-to-br text-xs font-bold uppercase shadow-sm transition group-hover:scale-105 ${getPaletteClass(
                    category
                  )}`}
                >
                  {getInitials(category)}
                </span>
                <span className="line-clamp-2 text-center text-xs font-semibold text-foreground">{category}</span>
              </Link>
            ))}
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
            <article key={product.id} className="glass-card overflow-hidden rounded-2xl">
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
                  className="h-40 w-full object-cover"
                />
              </Link>

              <div className="space-y-2 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.category}</p>
                <Link href={`/producto/${product.id}`} className="block">
                  <h3 className="line-clamp-2 font-semibold text-foreground hover:text-primary">{product.name}</h3>
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
