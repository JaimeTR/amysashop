import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { DigitalProductEditor } from "@/components/admin/digital/digital-product-editor";
import { requireAdminUser } from "@/lib/admin";
import { getAdminDigitalProduct, listAdminDigitalProducts } from "@/lib/digital-store";

export const dynamic = "force-dynamic";

export const metadata = { title: "Editar producto digital - Admin" };

export default async function AdminDigitalProductPage({ params }: { params: { id: string } }) {
  await requireAdminUser("digital.manage");

  const isNew = params.id === "nuevo";
  const [product, allProducts] = await Promise.all([
    isNew ? Promise.resolve(null) : getAdminDigitalProduct(params.id),
    listAdminDigitalProducts(),
  ]);

  if (!isNew && !product) notFound();

  return (
    <main className="space-y-5 pb-10">
      <Link href="/admin/digitales" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
        <ChevronLeft className="size-4" /> Productos digitales
      </Link>
      <DigitalProductEditor
        key={product?.id || "nuevo"}
        product={product}
        packCandidates={allProducts
          .filter((item) => item.id !== product?.id && item.productType !== "pack")
          .map((item) => ({ id: item.id, name: item.name }))}
      />
    </main>
  );
}
