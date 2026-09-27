import Link from "next/link";
import { DigitalProductCard } from "@/components/digital/digital-product-card";
import { DIGITAL_PRODUCT_TYPES, type DigitalProduct, type DigitalProductType } from "@/lib/digital-types";

type Props = {
  products: DigitalProduct[];
  basePath: string;
  activeType?: DigitalProductType;
  showFilters?: boolean;
};

export function DigitalCatalog({ products, basePath, activeType, showFilters = true }: Props) {
  const types = Array.from(new Set(products.map((product) => product.productType)));
  const visible = activeType ? products.filter((product) => product.productType === activeType) : products;
  const sorted = [...visible].sort((a, b) => Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder);

  const chipClass = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
      active ? "border-primary bg-primary text-primary-foreground" : "border-primary/20 bg-white/80 text-primary hover:bg-primary/10"
    }`;

  return (
    <div className="space-y-5">
      {showFilters && types.length > 1 ? (
        <nav className="flex flex-wrap gap-2" aria-label="Tipos de producto">
          <Link href={basePath} className={chipClass(!activeType)}>
            Todos
          </Link>
          {types.map((type) => (
            <Link key={type} href={`${basePath}?tipo=${type}`} className={chipClass(activeType === type)}>
              {DIGITAL_PRODUCT_TYPES[type]?.plural || type}
            </Link>
          ))}
        </nav>
      ) : null}

      {sorted.length === 0 ? (
        <p className="rounded-3xl border border-white/60 bg-white/70 p-8 text-center text-sm text-muted-foreground">
          Pronto publicaremos nuevos productos digitales.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {sorted.map((product) => (
            <DigitalProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
