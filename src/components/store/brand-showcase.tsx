"use client";

import Image from "next/image";
import Link from "next/link";
import { getAllBrands } from "@/lib/brands";
import { Button } from "@/components/ui/button";

export function BrandShowcase() {
  const brands = getAllBrands();

  return (
    <section
      id="brands"
      className="w-full overflow-hidden rounded-3xl border border-white/50 bg-gradient-to-b from-white/55 via-white/35 to-transparent py-5 shadow-sm backdrop-blur-md sm:py-8"
    >
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 xl:grid-cols-6">
          {brands.map((brand) => (
            <Link key={brand.id} href={`/tienda?marca=${encodeURIComponent(brand.name)}`}>
              <div className="group flex h-full flex-col items-center rounded-none border-0 bg-transparent p-0 shadow-none transition-all sm:rounded-2xl sm:border-2 sm:border-border sm:bg-card sm:p-4 sm:hover:border-primary sm:hover:shadow-lg">
                <div className="flex justify-center sm:mb-4">
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    width={96}
                    height={96}
                    className="h-20 w-20 rounded-2xl object-contain sm:h-24 sm:w-24"
                    unoptimized
                  />
                </div>
                <h3 className="mt-2 text-center text-[11px] font-semibold leading-tight group-hover:text-primary sm:mb-2 sm:mt-0 sm:text-sm">{brand.name}</h3>
                {brand.description && (
                  <p className="mb-4 hidden text-center text-xs text-muted-foreground sm:block">{brand.description}</p>
                )}
                <Button className="hidden w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:inline-flex" variant="default" size="sm">
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
