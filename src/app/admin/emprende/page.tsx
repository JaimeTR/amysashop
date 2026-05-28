import type { Metadata } from "next";
import { BadgeDollarSign, CheckCircle2, Package, ReceiptText, TrendingUp, Users2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireAdminUser } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { registerSaleAction } from "./actions";
import {
  EmprendeSaleForm,
  type EmprendeClientOption,
  type EmprendeProductOption,
  type EmprendeSalespersonOption,
} from "@/components/admin/emprende-sale-form";
import ErrorBoundary from "@/components/error-boundary-client";

export const metadata: Metadata = {
  title: "Emprende",
  description: "Registra ventas por vendedora, descuenta stock y calcula automáticamente la comisión ganada por cada producto.",
  keywords: ["emprende", "ventas", "comisiones", "vendedoras", "stock", "AMYSA SHOP"],
};

type PageProps = {
  searchParams?: {
    salespersonId?: string;
    ok?: string;
    error?: string;
  };
};

type SalespersonRow = {
  id: string;
  user_id?: string | null;
  name: string;
  email?: string | null;
  commission_percentage?: number | null;
  status?: string | null;
};

type ProfileRow = {
  id: string;
  nombre: string;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  img_avatar?: string | null;
  avatar_url?: string | null;
  role?: string | null;
};

type ProductRow = {
  id: string;
  name: string;
  brand?: string | null;
  category?: string | null;
  stock?: number | null;
  price?: number | null;
  price_before?: number | null;
  images?: string[] | null;
};

type SaleCommissionRow = {
  commission_percentage?: number | null;
  commission_amount?: number | null;
  status?: string | null;
};

type SaleRow = {
  id: string;
  created_at: string;
  quantity?: number | null;
  unit_price?: number | null;
  total_amount?: number | null;
  payment_status?: string | null;
  payment_received?: number | null;
  commission_status?: string | null;
  commission_amount?: number | null;
  notes?: string | null;
  salesperson_id?: string | null;
  product_id?: string | null;
  client_id?: string | null;
  external_client_id?: string | null;
  salespeople?: SalespersonRow | SalespersonRow[] | null;
  products?: ProductRow | ProductRow[] | null;
  client_profiles?: ProfileRow | ProfileRow[] | null;
  external_clients?: { name?: string | null; email?: string | null } | { name?: string | null; email?: string | null }[] | null;
  sales_commissions?: SaleCommissionRow | SaleCommissionRow[] | null;
};

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function paymentLabel(value: string | null | undefined) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "completed") return "Completado";
  if (normalized === "partial") return "Parcial";
  return "Pendiente";
}

function paymentBadgeClass(value: string | null | undefined) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "completed") return "border-transparent bg-emerald-500/15 text-emerald-700";
  if (normalized === "partial") return "border-transparent bg-amber-500/15 text-amber-700";
  return "border-transparent bg-slate-500/10 text-slate-700";
}

function commissionBadgeClass(value: string | null | undefined) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "approved" || normalized === "paid") return "border-transparent bg-primary/15 text-primary";
  return "border-transparent bg-slate-500/10 text-slate-700";
}

function commissionPercentageFromSale(sale: SaleRow) {
  const commissionRecord = Array.isArray(sale.sales_commissions) ? sale.sales_commissions[0] : sale.sales_commissions;

  if (commissionRecord?.commission_percentage != null) {
    return Number(commissionRecord.commission_percentage) || 0;
  }

  const salesperson = Array.isArray(sale.salespeople) ? sale.salespeople[0] : sale.salespeople;
  return Number(salesperson?.commission_percentage || 0) || 0;
}

async function ensureSalespeopleFromProfiles(serviceClient: ReturnType<typeof createServiceRoleClient>) {
  if (!serviceClient) {
    return;
  }

  const profilesResult = await serviceClient
    .from("profiles")
    .select("id,nombre,telefono,role")
    .eq("role", "vendedora")
    .order("nombre", { ascending: true });

  if (profilesResult.error || !profilesResult.data?.length) {
    return;
  }

  const salespeopleResult = await serviceClient.from("salespeople").select("user_id");
  if (salespeopleResult.error) {
    return;
  }

  const existingUserIds = new Set((salespeopleResult.data || []).map((item) => item.user_id));
  const missingSalespeople = profilesResult.data
    .filter((profile) => !existingUserIds.has(profile.id))
    .map((profile) => ({
      user_id: profile.id,
      name: profile.nombre || "Vendedora",
      email: null,
      phone: profile.telefono || null,
      commission_percentage: 10,
      status: "active",
    }));

  if (missingSalespeople.length > 0) {
    await serviceClient.from("salespeople").upsert(missingSalespeople, { onConflict: "user_id" });
  }
}

function getSaleCustomerLabel(sale: SaleRow) {
  const clientProfile = Array.isArray(sale.client_profiles) ? sale.client_profiles[0] : sale.client_profiles;
  const externalClient = Array.isArray(sale.external_clients) ? sale.external_clients[0] : sale.external_clients;

  if (clientProfile?.nombre) {
    return clientProfile.nombre;
  }

  if (externalClient?.name) {
    return externalClient.name;
  }

  return "Cliente interno";
}

function getSaleProductLabel(sale: SaleRow) {
  const product = Array.isArray(sale.products) ? sale.products[0] : sale.products;
  return product?.name || "Producto";
}

function getSaleSalespersonLabel(sale: SaleRow) {
  const salesperson = Array.isArray(sale.salespeople) ? sale.salespeople[0] : sale.salespeople;
  return salesperson?.name || "Vendedora";
}

function getPercentageEarned(sale: SaleRow) {
  const totalAmount = Number(sale.total_amount || 0);
  const commissionAmount = Number(sale.commission_amount || 0);

  if (!totalAmount || commissionAmount <= 0) {
    return 0;
  }

  return Math.round((commissionAmount / totalAmount) * 10000) / 100;
}

function safeText(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function parseNumber(value: FormDataEntryValue | null) {
  const parsed = Number(String(value || "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

async function getEmprendeData(salespersonFilterId?: string, ownSalespersonId?: string) {
  const serviceClient = createServiceRoleClient();
  const supabase = serviceClient ?? createServiceRoleClient();

  if (!supabase) {
    return { salespeople: [], products: [], sales: [], queryError: "Configura SUPABASE_SECRET_KEY para cargar el módulo Emprende." };
  }

  await ensureSalespeopleFromProfiles(supabase);

  const salespeopleQuery = supabase
    .from("salespeople")
    .select("id,user_id,name,email,commission_percentage,status")
    .order("name", { ascending: true });

  const clientsQuery = supabase
    .from("profiles")
    .select("id,nombre,telefono,direccion,img_avatar,avatar_url,role")
    .eq("role", "cliente")
    .order("nombre", { ascending: true });

  const productsQuery = supabase
    .from("products")
    .select("id,name,brand,stock,price,price_before,images")
    .order("name", { ascending: true });

  const salesQuery = supabase
    .from("sales")
    .select(
      "id,created_at,quantity,unit_price,total_amount,payment_status,payment_received,commission_status,commission_amount,notes,salesperson_id,product_id,client_id,external_client_id,salespeople:salespeople(id,name,email,commission_percentage,status),products:products(id,name,brand,stock,price,price_before,images),client_profiles:profiles(id,nombre,telefono),external_clients(id,name,email),sales_commissions(commission_percentage,commission_amount,status)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const [salespeopleResult, clientsResult, productsResult, salesResult] = await Promise.all([
    salespeopleQuery,
    clientsQuery,
    productsQuery,
    salesQuery,
  ]);

  const queryError =
    salespeopleResult.error?.message || clientsResult.error?.message || productsResult.error?.message || salesResult.error?.message || null;

  let sales = (salesResult.data || []) as SaleRow[];

  if (ownSalespersonId) {
    sales = sales.filter((sale) => sale.salesperson_id === ownSalespersonId);
  } else if (salespersonFilterId) {
    sales = sales.filter((sale) => sale.salesperson_id === salespersonFilterId);
  }

  return {
    salespeople: (salespeopleResult.data || []) as SalespersonRow[],
    clients: (clientsResult.data || []) as ProfileRow[],
    products: (productsResult.data || []) as ProductRow[],
    sales,
    queryError,
  };
}

export default async function EmprendePage({ searchParams }: PageProps) {
  const { supabase: sessionClient, role, user } = await requireAdminUser("sales.manage");
  const salespersonFilterId = String(searchParams?.salespersonId || "").trim();
  const ownSalespersonResult =
    role === "vendedora"
      ? await sessionClient.from("salespeople").select("id,user_id,name,commission_percentage").eq("user_id", user.id).maybeSingle()
      : { data: null, error: null };

  const ownSalespersonId = role === "vendedora" && ownSalespersonResult.data ? ownSalespersonResult.data.id : undefined;
  const { salespeople, clients, products, sales, queryError } = await getEmprendeData(salespersonFilterId || undefined, ownSalespersonId);

  const selectedSalespersonForForm = role === "vendedora" ? ownSalespersonId || "" : salespersonFilterId || salespeople[0]?.id || "";
  const visibleSales = role === "vendedora" && ownSalespersonId ? sales.filter((sale) => sale.salesperson_id === ownSalespersonId) : sales;

  const totalSalesAmount = visibleSales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
  const totalCommissionAmount = visibleSales.reduce((sum, sale) => sum + Number(sale.commission_amount || 0), 0);
  const totalUnits = visibleSales.reduce((sum, sale) => sum + Number(sale.quantity || 0), 0);
  const completedSales = visibleSales.filter((sale) => String(sale.payment_status || "").toLowerCase() === "completed").length;

  return (
    <main className="space-y-5 pb-8">
      <header className="glass-card rounded-3xl p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Módulo Emprende</p>
            <h1 className="font-[var(--font-display)] text-3xl">Ventas por vendedora</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Registra cada venta, descuenta stock automáticamente y revisa cuánto gana cada vendedora por producto.
            </p>
          </div>
          <Badge className="w-fit bg-primary/15 text-primary" variant="outline">
            {role === "vendedora" ? "Vista de vendedora" : "Vista administrativa"}
          </Badge>
        </div>
      </header>

      {searchParams?.ok ? (
        <Card className="border-emerald-200 bg-emerald-50/60">
          <CardContent className="flex items-center gap-2 py-4 text-sm text-emerald-800">
            <CheckCircle2 className="size-4" />
            {searchParams.ok}
          </CardContent>
        </Card>
      ) : null}

      {searchParams?.error ? (
        <Card className="border-red-200 bg-red-50/70">
          <CardContent className="py-4 text-sm text-red-800">{searchParams.error}</CardContent>
        </Card>
      ) : null}

      {queryError ? (
        <Card className="border-amber-200 bg-amber-50/70">
          <CardContent className="py-4 text-sm text-amber-900">{queryError}</CardContent>
        </Card>
      ) : null}

      {role !== "vendedora" ? (
        <Card className="glass-card rounded-3xl">
          <CardContent className="flex flex-col gap-3 py-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Filtro de vendedora</p>
              <p className="text-xs text-muted-foreground">Úsalo para ver solo las ventas de una vendedora concreta.</p>
            </div>
            <form className="flex w-full gap-2 md:max-w-xl" method="get">
              <select
                name="salespersonId"
                defaultValue={salespersonFilterId}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Todas las ventas</option>
                {salespeople.map((salesperson) => (
                  <option key={salesperson.id} value={salesperson.id}>
                    {salesperson.name}
                  </option>
                ))}
              </select>
              <Button type="submit" variant="outline">
                Filtrar
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ReceiptText className="size-4 text-primary" />
              Ventas registradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-primary">{visibleSales.length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="size-4 text-primary" />
              Total vendido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-primary">{formatMoney(totalSalesAmount)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BadgeDollarSign className="size-4 text-primary" />
              Comisión ganada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-primary">{formatMoney(totalCommissionAmount)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Package className="size-4 text-primary" />
              Unidades vendidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-primary">{totalUnits}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_1.25fr]">
        <ErrorBoundary>
          <EmprendeSaleForm
            role={role}
            salespeople={(salespeople as EmprendeSalespersonOption[]).map((salesperson) => ({
              id: salesperson.id,
              name: salesperson.name,
              email: salesperson.email,
              commission_percentage: salesperson.commission_percentage,
              status: salesperson.status,
            }))}
            clients={(clients as EmprendeClientOption[]).map((client) => ({
              id: client.id,
              nombre: client.nombre,
              email: client.email,
              telefono: client.telefono,
              direccion: client.direccion,
              img_avatar: client.img_avatar,
              avatar_url: client.avatar_url,
            }))}
            products={(products as EmprendeProductOption[]).map((product) => ({
              id: product.id,
              name: product.name,
              brand: product.brand,
              category: product.category,
              stock: product.stock,
              price: product.price,
              price_before: product.price_before,
              images: product.images,
            }))}
            initialSalespersonId={selectedSalespersonForForm}
            action={registerSaleAction}
          />
        </ErrorBoundary>

        <Card className="glass-card rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users2 className="size-4 text-primary" />
              Resumen por venta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm text-foreground">
              La tabla muestra la vendedora, el producto, la comisión ganada y el porcentaje que corresponde a cada venta.
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border/60 bg-white/60">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-primary/5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Vendedora</th>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3">Cantidad</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">% ganado</th>
                    <th className="px-4 py-3">Comisión</th>
                    <th className="px-4 py-3">Pago</th>
                    <th className="px-4 py-3">Cliente</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleSales.length === 0 ? (
                    <tr>
                      <td className="px-4 py-10 text-center text-muted-foreground" colSpan={9}>
                        Todavía no hay ventas registradas con este filtro.
                      </td>
                    </tr>
                  ) : (
                    visibleSales.map((sale) => (
                      <tr key={sale.id} className="border-t border-border/50 align-top">
                        <td className="px-4 py-3 whitespace-nowrap">{formatDate(sale.created_at)}</td>
                        <td className="px-4 py-3">{getSaleSalespersonLabel(sale)}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{getSaleProductLabel(sale)}</div>
                          {sale.notes ? <div className="mt-1 max-w-[16rem] text-xs text-muted-foreground">{sale.notes}</div> : null}
                        </td>
                        <td className="px-4 py-3">{Number(sale.quantity || 0)}</td>
                        <td className="px-4 py-3 font-medium text-primary">{formatMoney(sale.total_amount)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-foreground">{commissionPercentageFromSale(sale)}%</span>
                            <span className="text-xs text-muted-foreground">{Number(sale.commission_amount || 0) > 0 ? formatMoney(sale.commission_amount) : "Sin comisión"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={commissionBadgeClass(sale.commission_status)} variant="outline">
                            {sale.commission_status ? sale.commission_status : "pendiente"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={paymentBadgeClass(sale.payment_status)} variant="outline">
                            {paymentLabel(sale.payment_status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">{getSaleCustomerLabel(sale)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {visibleSales.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {visibleSales.slice(0, 3).map((sale) => (
                  <div key={sale.id} className="rounded-2xl border border-border/60 bg-background/80 p-4 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground">{getSaleProductLabel(sale)}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(sale.created_at)}</span>
                    </div>
                    <div className="mt-2 text-muted-foreground">{getSaleSalespersonLabel(sale)} · {getSaleCustomerLabel(sale)}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="outline">{paymentLabel(sale.payment_status)}</Badge>
                      <Badge variant="outline">{commissionPercentageFromSale(sale)}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}