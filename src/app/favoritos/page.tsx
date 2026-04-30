"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { ToggleFavoriteButton } from "@/components/product/toggle-favorite-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useFavoritesStore } from "@/store/favorites-store";

function isSafeImageSrc(value: string) {
  const src = String(value || "").trim();
  return src.startsWith("/") || /^https?:\/\//i.test(src);
}

function getSafeImageSrc(image?: string) {
  if (image && isSafeImageSrc(image)) {
    return image;
  }
  return "/placeholder-product.svg";
}

export default function FavoritosPage() {
  const items = useFavoritesStore((state) => state.items);
  const clearFavorites = useFavoritesStore((state) => state.clearFavorites);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasItems = mounted && items.length > 0;

  return (
    <main className="space-y-4 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-[var(--font-display)] text-3xl">Favoritos</h1>
        {hasItems ? (
          <Button type="button" variant="outline" onClick={clearFavorites}>
            <Trash2 className="mr-2 size-4" />
            Limpiar lista
          </Button>
        ) : null}
      </div>

      {!mounted ? (
        <Card className="glass-card">
          <CardContent className="p-6 text-sm text-muted-foreground">Cargando favoritos...</CardContent>
        </Card>
      ) : null}

      {mounted && items.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="space-y-3 p-6 text-sm text-muted-foreground">
            <p>Aun no tienes favoritos guardados.</p>
            <Link href="/tienda" className="font-semibold text-primary">
              Ir a tienda
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {hasItems ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <article key={item.productId} className="glass-card overflow-hidden rounded-2xl">
              <Link href={`/producto/${item.productId}`}>
                <Image
                  src={getSafeImageSrc(item.image)}
                  alt={item.name}
                  width={700}
                  height={700}
                  unoptimized
                  className="h-44 w-full object-cover"
                />
              </Link>

              <div className="space-y-2 p-3">
                {item.category ? <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.category}</p> : null}
                <Link href={`/producto/${item.productId}`} className="block">
                  <h2 className="line-clamp-2 text-sm font-semibold">{item.name}</h2>
                </Link>
                <p className="text-base font-semibold text-primary">S/ {item.price.toFixed(2)}</p>

                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/producto/${item.productId}`}>Ver producto</Link>
                  </Button>
                  <ToggleFavoriteButton
                    productId={item.productId}
                    name={item.name}
                    price={item.price}
                    image={item.image}
                    category={item.category}
                  />
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
}
