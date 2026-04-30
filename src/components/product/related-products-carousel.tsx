"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { ToggleFavoriteButton } from "@/components/product/toggle-favorite-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Product } from "@/lib/types";

type Props = {
  products: Product[];
};

function isSafeImageSrc(value: string) {
  const src = String(value || "").trim();
  return src.startsWith("/") || /^https?:\/\//i.test(src);
}

function getSafeImageSrc(images: string[]) {
  const candidate = (images || []).find((value) => isSafeImageSrc(value) && !/\.(mp4|webm|ogg|mov|m4v)(?:$|\?)/i.test(value));
  return candidate || "/placeholder-product.svg";
}

export function RelatedProductsCarousel({ products }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const loopProducts = [...products, ...products];

  function scrollByAmount(direction: "left" | "right") {
    const container = containerRef.current;
    if (!container) return;

    const amount = Math.max(260, Math.floor(container.clientWidth * 0.75));
    container.scrollBy({
      left: direction === "right" ? amount : -amount,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container || products.length <= 1) {
      return;
    }

    let rafId = 0;
    let lastTime = 0;
    const pxPerSecond = 46;

    const animate = (time: number) => {
      if (!lastTime) {
        lastTime = time;
      }

      const deltaMs = time - lastTime;
      lastTime = time;

      if (!isPaused) {
        const halfWidth = container.scrollWidth / 2;
        const deltaPx = (pxPerSecond * deltaMs) / 1000;
        container.scrollLeft += deltaPx;

        if (container.scrollLeft >= halfWidth) {
          container.scrollLeft -= halfWidth;
        }
      }

      rafId = window.requestAnimationFrame(animate);
    };

    rafId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [isPaused, products.length]);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3 pb-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-[var(--font-display)] text-2xl text-foreground">
          <strong>Productos relacionados y recomendados</strong>
        </h2>
        <div className="hidden items-center gap-2 sm:flex">
          <Button type="button" size="icon" variant="outline" onClick={() => scrollByAmount("left")} aria-label="Anterior">
            <ChevronLeft className="size-4" />
          </Button>
          <Button type="button" size="icon" variant="outline" onClick={() => scrollByAmount("right")} aria-label="Siguiente">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {loopProducts.map((item, index) => (
          <Card key={`${item.id}-${index}`} className="glass-card w-[260px] shrink-0 overflow-hidden">
            <Link href={`/producto/${item.id}`}>
              <Image
                src={getSafeImageSrc(item.images)}
                alt={item.name}
                width={700}
                height={700}
                unoptimized
                className="aspect-square w-full object-cover"
              />
            </Link>
            <CardContent className="space-y-2 p-3">
              <p className="line-clamp-1 text-xs uppercase tracking-wide text-muted-foreground">{item.category}</p>
              <Link href={`/producto/${item.id}`} className="block">
                <h3 className="line-clamp-2 text-sm font-semibold text-foreground hover:text-primary">{item.name}</h3>
              </Link>
              <p className="text-base font-semibold text-primary">S/ {item.price.toFixed(2)}</p>

              <div className="grid grid-cols-[1fr_auto] gap-2">
                <AddToCartButton
                  productId={item.id}
                  name={item.name}
                  price={item.price}
                  priceBefore={item.priceBefore}
                  image={getSafeImageSrc(item.images)}
                  buttonLabel="Agregar"
                />
                <ToggleFavoriteButton
                  productId={item.id}
                  name={item.name}
                  price={item.price}
                  image={getSafeImageSrc(item.images)}
                  category={item.category}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
