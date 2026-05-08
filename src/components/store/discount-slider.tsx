"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { getSafeProductImageSrc } from "@/lib/product-images";

type ProductShort = {
  id: string;
  name: string;
  images: string[];
  price: number;
  priceBefore?: number | null;
  category?: string;
};

export default function DiscountSlider({ products }: { products: ProductShort[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  function scroll(offset: number) {
    if (!trackRef.current) return;
    trackRef.current.scrollBy({ left: offset, behavior: "smooth" });
  }

  if (!products || products.length === 0) return null;

  return (
    <div className="my-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Productos en oferta</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => scroll(-320)}>-</Button>
          <Button variant="ghost" size="sm" onClick={() => scroll(320)}>+</Button>
        </div>
      </div>

      <div ref={trackRef} className="no-scrollbar flex gap-3 overflow-x-auto px-1">
        {products.map((p) => (
          <div key={p.id} className="w-64 flex-shrink-0">
            <div className="rounded-lg border bg-white/5">
              <Link href={`/producto/${p.id}`} className="block">
                <Image src={getSafeProductImageSrc(p.images)} alt={p.name} width={400} height={400} className="aspect-square w-full object-cover rounded-t-lg" unoptimized />
              </Link>
              <div className="p-3">
                <p className="text-xs text-muted-foreground">{p.category}</p>
                <Link href={`/producto/${p.id}`} className="block">
                  <h4 className="line-clamp-1 truncate font-semibold">{p.name}</h4>
                </Link>
                <div className="mt-2 flex items-center gap-2">
                  {p.priceBefore ? <span className="text-xs line-through text-muted-foreground">S/ {p.priceBefore.toFixed(2)}</span> : null}
                  <span className="text-sm font-bold text-primary">S/ {p.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
