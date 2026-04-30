"use client";

import Image from "next/image";
import Link from "next/link";
import { getAllBrands } from "@/lib/brands";
import { Button } from "@/components/ui/button";

export function BrandShowcase() {
  const brands = getAllBrands();

  return (
    <section className="w-full py-16">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {brands.map((brand) => (
            <Link key={brand.id} href={`/tienda?marca=${encodeURIComponent(brand.name)}`}>
              <div className="group h-full rounded-2xl border-2 border-border bg-card p-4 transition-all hover:border-primary hover:shadow-lg">
                <div className="mb-4 flex justify-center">
                  <Image src={brand.logo} alt={brand.name} width={96} height={96} className="h-24 w-24 rounded-[10px] object-contain" unoptimized />
                </div>
                <h3 className="mb-2 text-center text-sm font-semibold group-hover:text-primary">{brand.name}</h3>
                {brand.description && (
                  <p className="mb-4 text-center text-xs text-muted-foreground">{brand.description}</p>
                )}
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" variant="default" size="sm">
                  Ver productos
                </Button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
