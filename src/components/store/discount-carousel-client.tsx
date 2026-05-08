"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { ToggleFavoriteButton } from "@/components/product/toggle-favorite-button";
import { getSafeProductImageSrc, DEFAULT_PRODUCT_IMAGE } from "@/lib/product-images";

type Product = {
  id: string;
  name: string;
  price: number;
  priceBefore?: number | null;
  images: string[];
  category?: string;
  description?: string;
};

function getDiscountPercent(priceBefore: number | null | undefined, price: number) {
  const basePrice = Number(priceBefore || 0);
  const currentPrice = Number(price || 0);
  if (!basePrice || basePrice <= currentPrice) return 0;
  return Math.round(((basePrice - currentPrice) / basePrice) * 100);
}

function getSafeImageSrc(images: string[]) {
  return getSafeProductImageSrc(images);
}

export function DiscountCarouselClient({ products }: { products: Product[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const isAdjustingRef = useRef(false);

  // Duplicar productos para efecto infinito continuo
  const extendedProducts = [...products, ...products];

  function getScrollAmount() {
    if (!trackRef.current) return 292;

    const firstCard = trackRef.current.querySelector("article");
    const cardWidth = firstCard?.getBoundingClientRect().width ?? 280;
    return cardWidth + 12;
  }

  function getLoopBoundary() {
    if (!trackRef.current) return 0;

    return trackRef.current.scrollWidth / 2;
  }

  useEffect(() => {
    if (!trackRef.current || !isAutoplay || products.length === 0) return;

    const interval = setInterval(() => {
      if (!trackRef.current) return;
      const scrollAmount = getScrollAmount();

      trackRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }, 5000); // Cada 5 segundos

    return () => clearInterval(interval);
  }, [isAutoplay, products.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const handleScroll = () => {
      if (isAdjustingRef.current) return;

      const boundary = getLoopBoundary();
      if (!boundary) return;

      if (track.scrollLeft >= boundary) {
        isAdjustingRef.current = true;
        track.scrollLeft -= boundary;
        requestAnimationFrame(() => {
          isAdjustingRef.current = false;
        });
      }

      if (track.scrollLeft < 1) {
        isAdjustingRef.current = true;
        track.scrollLeft += boundary;
        requestAnimationFrame(() => {
          isAdjustingRef.current = false;
        });
      }
    };

    track.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      track.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function scroll(offset: number) {
    if (!trackRef.current) return;

    trackRef.current.scrollBy({ left: offset, behavior: "smooth" });
  }

  if (!products || products.length === 0) {
    return (
      <div className="py-4">
        <p className="text-sm text-muted-foreground">No hay productos con descuento disponibles por ahora.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 relative">
      <div className="relative">
        <button
          onClick={() => scroll(-320)}
          className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-md border border-border/60 bg-background/80 px-2 py-2 text-foreground shadow-sm backdrop-blur-sm transition hover:bg-background md:inline-flex"
          aria-label="Anterior"
        >
          <ChevronLeft className="size-4 md:size-5" />
        </button>

        <div
          className="min-w-0"
          onMouseEnter={() => setIsAutoplay(false)}
          onMouseLeave={() => setIsAutoplay(true)}
        >
          {/* Track (ocultar scrollbar) */}
          <div
            ref={trackRef}
            className="flex gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory px-5 py-1 md:px-12"
          >
          {extendedProducts.map((product, idx) => {
            const discountPercent = getDiscountPercent(product.priceBefore, product.price);
            const imageSrc = getSafeImageSrc(product.images);

            return (
              <article
                key={`${product.id}-${idx}`}
                className="glass-card mx-auto w-[72vw] max-w-[250px] flex-shrink-0 snap-center overflow-hidden rounded-2xl transition hover:scale-[1.01] md:mx-0 md:w-[calc((100%-3.75rem)/6)] md:max-w-none md:snap-start"
              >
                <div className="space-y-2 p-3 h-full flex flex-col">
                  <div className="relative -m-3 mb-0">
                    <Link href={`/producto/${product.id}`}>
                      <div className="relative w-full aspect-square bg-gray-200 overflow-hidden">
                        <Image
                          src={imageSrc}
                          alt={product.name}
                          fill
                          className="object-cover"
                          unoptimized
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                              img.src = DEFAULT_PRODUCT_IMAGE;
                          }}
                        />
                      </div>
                    </Link>
                    <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary/90 px-2 py-1 text-xs font-semibold text-white shadow-sm">
                      <Tag className="size-3" /> Oferta {discountPercent > 0 ? `-${discountPercent}%` : ""}
                    </div>
                  </div>

                  <Link href={`/producto/${product.id}`} className="mt-2 block flex-shrink-0">
                    <h3 className="line-clamp-1 truncate font-semibold text-foreground text-sm">{product.name}</h3>
                  </Link>

                  <p className="text-xs text-muted-foreground flex-shrink-0">{product.category}</p>

                  <div className="space-y-0.5 flex-shrink-0">
                    {product.priceBefore && product.priceBefore > product.price ? (
                      <p className="text-xs text-muted-foreground line-through">
                        S/ {Number(product.priceBefore).toFixed(2)}
                      </p>
                    ) : null}
                    <p className="text-lg font-bold text-primary">S/ {product.price.toFixed(2)}</p>
                  </div>

                  <div className="grid grid-cols-[1fr_auto] gap-2 mt-auto">
                    <AddToCartButton
                      productId={product.id}
                      name={product.name}
                      price={product.price}
                      priceBefore={product.priceBefore ?? null}
                      image={imageSrc}
                      buttonLabel="Agregar"
                    />
                    <ToggleFavoriteButton
                      productId={product.id}
                      name={product.name}
                      price={product.price}
                      image={imageSrc}
                      category={product.category || ""}
                    />
                  </div>
                </div>
              </article>
            );
          })}
          </div>
        </div>

        <button
          onClick={() => scroll(320)}
          className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-md border border-border/60 bg-background/80 px-2 py-2 text-foreground shadow-sm backdrop-blur-sm transition hover:bg-background md:inline-flex"
          aria-label="Siguiente"
        >
          <ChevronRight className="size-4 md:size-5" />
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 md:hidden">
        <button
          onClick={() => scroll(-320)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-background/70 text-foreground shadow-sm backdrop-blur-sm transition hover:bg-background"
          aria-label="Anterior"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={() => scroll(320)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-background/70 text-foreground shadow-sm backdrop-blur-sm transition hover:bg-background"
          aria-label="Siguiente"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
