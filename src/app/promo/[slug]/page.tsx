import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { Button } from "@/components/ui/button";
import { getActiveLandingBySlug, getProductById } from "@/lib/catalog";
import { getSafeProductImageSrc } from "@/lib/product-images";

type Props = {
  params: { slug: string };
};

function getSafeImageSrc(images: string[]) {
  return getSafeProductImageSrc(images);
}

export default async function PromoLandingPage({ params }: Props) {
  const landing = await getActiveLandingBySlug(params.slug);

  if (!landing) {
    notFound();
  }

  const product = await getProductById(landing.productId);
  if (!product) {
    notFound();
  }

  return (
    <main className="space-y-5 pb-8">
      <section className="glass-card rounded-3xl p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Promo exclusiva</p>
        <h1 className="font-[var(--font-display)] text-4xl leading-tight">{landing.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{product.description}</p>
        <p className="mt-2 text-xl font-semibold text-primary">S/ {product.price.toFixed(2)}</p>
      </section>

      <AddToCartButton
        productId={product.id}
        name={product.name}
        price={product.price}
        priceBefore={product.priceBefore}
        image={getSafeImageSrc(product.images)}
      />

      <Button asChild variant="outline" className="w-full">
        <Link href={`/producto/${product.id}`}>Ver producto completo</Link>
      </Button>
    </main>
  );
}
