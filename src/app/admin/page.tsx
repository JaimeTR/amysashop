import Link from "next/link";
import { ArrowRight, Boxes, ClipboardList, HandCoins, Megaphone, MessageCircleMore, Settings2, Users2, TrendingUp, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireAdminUser } from "@/lib/admin";
import { AdminPermission, hasPermission } from "@/lib/access-control";

type QuickLink = {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: AdminPermission;
};

const quickLinks: QuickLink[] = [
  {
    href: "/admin/productos",
    title: "Gestión de productos",
    description: "Crea, edita y organiza productos con sus atributos comerciales.",
    icon: Boxes,
    permission: "products.manage",
  },
  {
    href: "/admin/inventario",
    title: "Gestión de inventario",
    description: "Administra costos, márgenes de ganancia y stock de tus productos.",
    icon: TrendingUp,
    permission: "inventory.manage",
  },
  {
    href: "/admin/caja-amysa",
    title: "Caja AMYSA",
    description: "Registra ingresos y egresos diarios con control de ventas y gastos.",
    icon: HandCoins,
    permission: "inventory.manage",
  },
  {
    href: "/admin/clientes",
    title: "Gestión de clientes",
    description: "Visualiza clientes y registra nuevas cuentas para atención directa.",
    icon: Users2,
    permission: "clients.manage",
  },
  {
    href: "/admin/pedidos",
    title: "Gestión de pedidos",
    description: "Administra pedidos por estado y mantén control de cumplimiento.",
    icon: ClipboardList,
    permission: "orders.manage",
  },
  {
    href: "/admin/chats",
    title: "Chats y leads",
    description: "Revisa conversaciones de AMYSA AI y da seguimiento comercial.",
    icon: MessageCircleMore,
    permission: "chat.manage",
  },
  {
    href: "/admin/tienda",
    title: "Gestión de tienda",
    description: "Administra categorías y configuraciones base de tu catálogo.",
    icon: Settings2,
    permission: "store.manage",
  },
  {
    href: "/admin/marcas",
    title: "Gestión de marcas",
    description: "Visualiza y administra los logos de las marcas disponibles.",
    icon: Tag,
    permission: "store.manage",
  },
  {
    href: "/admin/marketing",
    title: "Marketing y campañas",
    description: "Gestiona cupones de descuento y mensajes del preencabezado.",
    icon: Megaphone,
    permission: "store.manage",
  },
  {
    href: "/admin/usuarios",
    title: "Gestión de usuarios",
    description: "Administra cuentas de usuarios y permisos de acceso al sistema.",
    icon: Users2,
    permission: "store.manage",
  },
];

async function safeCount(table: string, supabase: Awaited<ReturnType<typeof requireAdminUser>>["supabase"]) {
  const { count } = await supabase.from(table).select("id", { head: true, count: "exact" });
  return count ?? 0;
}

export default async function AdminDashboardPage() {
  const { supabase, role } = await requireAdminUser("dashboard.view");

  const [productsCount, clientsCount, ordersCount] = await Promise.all([
    safeCount("products", supabase),
    safeCount("profiles", supabase),
    safeCount("orders", supabase),
  ]);

  return (
    <main className="space-y-5 pb-8">
      <header className="glass-card rounded-3xl p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Panel administrativo</p>
        <h1 className="font-[var(--font-display)] text-3xl">AMYSA SHOP</h1>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
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
            <CardTitle className="text-sm">Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-primary">{clientsCount}</p>
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
        {quickLinks.filter((link) => hasPermission(role, link.permission)).map((link) => {
          const Icon = link.icon;
          return (
            <Card key={link.href} className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="size-4 text-primary" />
                  {link.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-muted-foreground">{link.description}</p>
                <Button asChild size="sm">
                  <Link href={link.href}>
                    Abrir módulo <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>

    </main>
  );
}
