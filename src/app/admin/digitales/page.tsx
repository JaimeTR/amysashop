import Image from "next/image";
import Link from "next/link";
import { ExternalLink, FileDown, Plus } from "lucide-react";
import { DigitalOrdersPanel } from "@/components/admin/digital/digital-orders-panel";
import { requireAdminUser } from "@/lib/admin";
import { getDigitalServiceClient, listAdminDigitalProducts, listDigitalOrders } from "@/lib/digital-store";
import { DIGITAL_PRODUCT_TYPES, formatSoles } from "@/lib/digital-types";
import { isOptimizableImageSrc } from "@/lib/product-images";

export const dynamic = "force-dynamic";

export const metadata = { title: "Productos digitales - Admin" };

type Props = { searchParams?: { tab?: string; estado?: string } };

export default async function AdminDigitalesPage({ searchParams }: Props) {
  await requireAdminUser("digital.manage");

  if (!getDigitalServiceClient()) {
    return (
      <main className="glass-card rounded-3xl p-6">
        <h1 className="font-[var(--font-display)] text-3xl">Productos digitales</h1>
        <p className="mt-2 text-sm text-destructive-strong">Falta configurar SUPABASE_SECRET_KEY para este módulo.</p>
      </main>
    );
  }

  const tab = searchParams?.tab === "pedidos" ? "pedidos" : "productos";
  const status = searchParams?.estado || "";
  const [products, orders, pendingOrders] = await Promise.all([
    listAdminDigitalProducts(),
    tab === "pedidos" ? listDigitalOrders({ status }) : Promise.resolve([]),
    listDigitalOrders({ status: "pending", limit: 100 }),
  ]);

  const tabClass = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition ${active ? "bg-primary text-primary-foreground" : "bg-white/70 text-foreground hover:bg-primary/10"}`;

  return (
    <main className="space-y-5 pb-8">
      <header className="glass-card flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[var(--font-display)] text-3xl">Productos digitales</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plantillas, libros, cursos y packs: archivos, precios, vista previa y pedidos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/digital"
            target="_blank"
            className="inline-flex h-10 items-center gap-1.5 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
          >
            <ExternalLink className="size-4" /> Ver tienda digital
          </Link>
          <Link
            href="/admin/digitales/nuevo"
            className="inline-flex h-10 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" /> Nuevo producto
          </Link>
        </div>
      </header>

      <nav className="flex gap-2">
        <Link href="/admin/digitales" className={tabClass(tab === "productos")}>
          Productos ({products.length})
        </Link>
        <Link href="/admin/digitales?tab=pedidos" className={tabClass(tab === "pedidos")}>
          Pedidos
          {pendingOrders.length > 0 ? (
            <span className="ml-1.5 rounded-full bg-warning px-2 py-0.5 text-[11px] font-bold text-white">{pendingOrders.length}</span>
          ) : null}
        </Link>
      </nav>

      {tab === "productos" ? (
        <section className="glass-card overflow-hidden rounded-3xl">
          {products.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              <FileDown className="mx-auto mb-2 size-8" />
              Aún no hay productos digitales. ¿Ejecutaste la migración <code>20260928_digital_store.sql</code>?
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-white/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Precio</th>
                    <th className="px-4 py-3">Archivos</th>
                    <th className="px-4 py-3">Ventas</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-t border-border/50 hover:bg-white/50">
                      <td className="px-4 py-3">
                        <Link href={`/admin/digitales/${product.id}`} className="flex items-center gap-3">
                          <span className="relative block h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                            {product.coverUrl ? (
                              <Image
                                src={product.coverUrl}
                                alt=""
                                fill
                                sizes="44px"
                                unoptimized={!isOptimizableImageSrc(product.coverUrl)}
                                className="object-cover"
                              />
                            ) : null}
                          </span>
                          <span className="min-w-0">
                            <span className="block font-semibold text-foreground hover:text-primary">{product.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">/digital/{product.slug}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">{DIGITAL_PRODUCT_TYPES[product.productType]?.label}</td>
                      <td className="px-4 py-3 font-semibold">{formatSoles(product.price)}</td>
                      <td className="px-4 py-3">
                        {product.productType === "pack" ? `${product.packProductIds.length} productos` : product.files.length}
                      </td>
                      <td className="px-4 py-3">{product.salesCount}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            product.active ? "bg-success/10 text-success-strong" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {product.active ? "Publicado" : "Oculto"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <DigitalOrdersPanel
          orders={orders}
          status={status}
          products={products.map((product) => ({ id: product.id, name: product.name, price: product.price }))}
        />
      )}
    </main>
  );
}
