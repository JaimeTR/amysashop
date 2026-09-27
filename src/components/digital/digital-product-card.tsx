import Image from "next/image";
import Link from "next/link";
import { BookOpen, FileSpreadsheet, GraduationCap, Layers, NotebookText, Sparkles } from "lucide-react";
import { DIGITAL_PRODUCT_TYPES, formatSoles, type DigitalProduct, type DigitalProductType } from "@/lib/digital-types";
import { isOptimizableImageSrc } from "@/lib/product-images";

const TYPE_ICONS: Record<DigitalProductType, typeof BookOpen> = {
  plantilla: FileSpreadsheet,
  libro: BookOpen,
  curso: GraduationCap,
  guia: NotebookText,
  pack: Layers,
  otro: Sparkles,
};

export function DigitalTypeIcon({ type, className }: { type: DigitalProductType; className?: string }) {
  const Icon = TYPE_ICONS[type] || Sparkles;
  return <Icon className={className} />;
}

export function DigitalCover({ product, sizes, priority }: { product: DigitalProduct; sizes: string; priority?: boolean }) {
  if (product.coverUrl) {
    return (
      <Image
        src={product.coverUrl}
        alt={product.name}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={!isOptimizableImageSrc(product.coverUrl)}
        className="object-cover"
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#f5ece6] via-[#ead9ce] to-[#d9bfae] p-6 text-center text-[#6b4a39]">
      <DigitalTypeIcon type={product.productType} className="size-12" />
      <p className="line-clamp-3 font-[var(--font-display)] text-xl leading-tight">{product.name}</p>
    </div>
  );
}

export function DigitalProductCard({ product }: { product: DigitalProduct }) {
  const hasDiscount = product.priceBefore != null && product.priceBefore > product.price;

  return (
    <Link
      href={`/digital/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
        <DigitalCover product={product} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-primary shadow-sm">
          <DigitalTypeIcon type={product.productType} className="size-3.5" />
          {DIGITAL_PRODUCT_TYPES[product.productType]?.label || "Digital"}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-2 font-semibold text-foreground group-hover:text-primary">{product.name}</h3>
        {product.subtitle ? <p className="line-clamp-1 text-xs text-muted-foreground">{product.subtitle}</p> : null}
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-lg font-bold text-primary">{formatSoles(product.price)}</span>
          {hasDiscount ? <span className="text-xs text-muted-foreground line-through">{formatSoles(product.priceBefore!)}</span> : null}
        </div>
      </div>
    </Link>
  );
}
