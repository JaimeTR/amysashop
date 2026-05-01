"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Trash2, Eye, ShoppingCart } from "lucide-react";
import { ToggleFavoriteButton } from "@/components/product/toggle-favorite-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useFavoritesStore } from "@/store/favorites-store";
import { useCartStore } from "@/store/cart-store";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/product-images";

function getSafeImageSrc(image?: string) {
  return image && String(image || "").trim() ? image : DEFAULT_PRODUCT_IMAGE;
}

export default function FavoritosPage() {
  const items = useFavoritesStore((state) => state.items);
  const clearFavorites = useFavoritesStore((state) => state.clearFavorites);
  const addItem = useCartStore((state) => state.addItem);
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
            <article key={item.productId} className="glass-card overflow-hidden rounded-2xl transition-transform hover:scale-105">
              <div className="relative">
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
                <div className="absolute right-2 top-2 rounded-full bg-white/90 backdrop-blur-sm p-1 shadow-md">
                  <ToggleFavoriteButton
                    productId={item.productId}
                    name={item.name}
                    price={item.price}
                    image={item.image}
                    category={item.category}
                  />
                </div>
              </div>

              <div className="space-y-3 p-3">
                {item.category ? <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.category}</p> : null}
                <Link href={`/producto/${item.productId}`} className="block">
                  <h2 className="line-clamp-2 text-sm font-semibold">{item.name}</h2>
                </Link>
                <p className="text-base font-bold text-primary">S/ {item.price.toFixed(2)}</p>

                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <Link href={`/producto/${item.productId}`}>
                      <Eye className="size-4" />
                      <span>Ver</span>
                    </Link>
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-1.5"
                    onClick={() =>
                      addItem({
                        productId: item.productId,
                        name: item.name,
                        price: item.price,
                        image: item.image,
                      })
                    }
                  >
                    <ShoppingCart className="size-4" />
                    <span>Agregar</span>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
}
