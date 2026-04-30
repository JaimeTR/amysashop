import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Boxes, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireAdminUser } from "@/lib/admin";

async function safeCount(table: string, supabase: Awaited<ReturnType<typeof requireAdminUser>>["supabase"]) {
  const { count } = await supabase.from(table).select("id", { head: true, count: "exact" });
  return count ?? 0;
}

export default async function DashboardVendedoraPage() {
  const { supabase, role } = await requireAdminUser("dashboard.view");

  if (role !== "vendedora") {
    redirect("/admin");
  }

  const [productsCount, ordersCount] = await Promise.all([
    safeCount("products", supabase),
    safeCount("orders", supabase),
  ]);

  return (
    <main className="space-y-5 pb-8">
      <header className="glass-card rounded-3xl p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Panel de vendedora</p>
        <h1 className="font-[var(--font-display)] text-3xl">AMYSA SHOP</h1>
      </header>

      <section className="grid gap-3 md:grid-cols-2">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-primary">{productsCount}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-primary">{ordersCount}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Boxes className="size-4 text-primary" />
              Gestión de productos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">Administra inventario y disponibilidad de catálogo.</p>
            <Button asChild size="sm">
              <Link href="/admin/productos">
                Abrir módulo <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="size-4 text-primary" />
              Gestión de pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">Da seguimiento de pedidos y estados de atención.</p>
            <Button asChild size="sm">
              <Link href="/admin/pedidos">
                Abrir módulo <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
