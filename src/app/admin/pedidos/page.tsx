import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageNotifications } from "@/components/feedback/admin-page-notifications";
import { OrdersInventoryTable } from "@/components/admin/orders-inventory-table";
import { requireAdminUser } from "@/lib/admin";

type PageProps = {
  searchParams?: {
    ok?: string;
    error?: string;
  };
};

const statuses = ["pendiente", "confirmado", "en_proceso", "enviado", "entregado", "cancelado"];
const paymentStatuses = ["pendiente", "adelanto", "cuotas", "completo"];

type OrderRow = {
  id: string;
  status?: string | null;
  payment_status?: string | null;
  total?: number | null;
  total_amount?: number | null;
  user_id?: string | null;
  created_at?: string | null;
  channel?: string | null;
  payment_method?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  customer_note?: string | null;
  customer_document_type?: string | null;
  customer_document_number?: string | null;
  payment_reference?: string | null;
  delivery_method?: string | null;
  shipping_amount?: number | null;
  discount_amount?: number | null;
  coupon_code?: string | null;
  items_json?: unknown;
};

async function getProfileNameMap(userIds: string[]) {
  const ids = Array.from(new Set(userIds.filter(Boolean)));
  if (ids.length === 0) {
    return new Map<string, string>();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !serviceRoleKey) {
    return new Map<string, string>();
  }

  const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await adminClient.from("profiles").select("id,nombre").in("id", ids);
  if (error || !data) {
    return new Map<string, string>();
  }

  const map = new Map<string, string>();
  for (const row of data as Array<{ id: string; nombre: string | null }>) {
    map.set(row.id, String(row.nombre || "").trim());
  }

  return map;
}

async function updateStatusAction(formData: FormData) {
  "use server";

  const { supabase } = await requireAdminUser("orders.manage");

  const orderId = String(formData.get("orderId") || "");
  const status = String(formData.get("status") || "");
  const paymentStatus = String(formData.get("paymentStatus") || "");

  if (!orderId) {
    redirect("/admin/pedidos?error=Pedido+inválido");
  }

  const updatePayload: Record<string, string> = {};
  if (status) {
    updatePayload.status = status;
  }
  if (paymentStatus) {
    updatePayload.payment_status = paymentStatus;
  }

  if (!updatePayload.status && !updatePayload.payment_status) {
    redirect("/admin/pedidos?error=Selecciona+un+valor+para+actualizar");
  }

  const { error } = await supabase.from("orders").update(updatePayload).eq("id", orderId);

  if (error) {
    // Fallback si la columna payment_status aún no existe en la tabla.
    if (updatePayload.payment_status && /column .* does not exist|could not find the '.*' column of '.*' in the schema cache/i.test(error.message)) {
      if (updatePayload.status) {
        const retry = await supabase.from("orders").update({ status: updatePayload.status }).eq("id", orderId);
        if (!retry.error) {
          revalidatePath("/admin/pedidos");
          redirect("/admin/pedidos?ok=Estado+de+pedido+actualizado");
        }
      }
      redirect("/admin/pedidos?error=Falta+columna+payment_status+en+orders");
    }

    redirect(`/admin/pedidos?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/pedidos");
  redirect("/admin/pedidos?ok=Pedido+actualizado");
}

export default async function AdminPedidosPage({ searchParams }: PageProps) {
  const { supabase } = await requireAdminUser("orders.manage");

  const queryCandidates = [
    // Requiere la migración 20261001_orders_contact_items.sql; si falta, se usan las consultas siguientes.
    "id,status,payment_status,total,total_amount,user_id,created_at,channel,payment_method,customer_name,customer_email,customer_phone,customer_address,customer_note,customer_document_type,customer_document_number,payment_reference,delivery_method,shipping_amount,discount_amount,coupon_code,items_json",
    "id,status,payment_status,total,total_amount,user_id,created_at,channel,payment_method,customer_name",
    "id,status,total,total_amount,user_id,created_at,channel,payment_method,customer_name",
    "id,status,total,total_amount,user_id,created_at,payment_method,customer_name",
    "id,status,total,total_amount,user_id,created_at,customer_name",
    "id,status,total,total_amount,user_id,created_at",
  ];

  let orders: OrderRow[] = [];
  for (const querySelect of queryCandidates) {
    const result = await supabase.from("orders").select(querySelect).order("created_at", { ascending: false }).limit(100);
    if (!result.error) {
      orders = ((result.data || []) as unknown) as OrderRow[];
      break;
    }
  }
  const profileNameMap = await getProfileNameMap(orders.map((order) => String(order.user_id || "")));

  const rows = orders.map((order) => ({
    id: order.id,
    status: order.status || "pendiente",
    paymentStatus: order.payment_status || "pendiente",
    total: Number(order.total ?? order.total_amount ?? 0),
    userId: order.user_id || "",
    createdAt: order.created_at || "",
    channel: order.channel || "web",
    paymentMethod: order.payment_method || "no definido",
    customerName: String(order.customer_name || "").trim() || profileNameMap.get(String(order.user_id || "")) || "",
    customerEmail: order.customer_email || "",
    customerPhone: order.customer_phone || "",
    customerAddress: order.customer_address || "",
    customerNote: order.customer_note || "",
    customerDocument: [order.customer_document_type, order.customer_document_number].filter(Boolean).join(" ").toUpperCase(),
    paymentReference: order.payment_reference || "",
    deliveryMethod: order.delivery_method || "",
    shippingAmount: order.shipping_amount ?? null,
    discountAmount: order.discount_amount ?? null,
    couponCode: order.coupon_code || "",
    items: Array.isArray(order.items_json) ? (order.items_json as NonNullable<Parameters<typeof OrdersInventoryTable>[0]["rows"][number]["items"]>) : [],
  }));

  const counters = statuses.reduce<Record<string, number>>((acc, status) => {
    acc[status] = orders.filter((order) => (order.status || "pendiente") === status).length;
    return acc;
  }, {});

  return (
    <main className="space-y-5 pb-8">
      <AdminPageNotifications ok={searchParams?.ok} error={searchParams?.error} />

      <header className="glass-card rounded-3xl p-5">
        <h1 className="font-[var(--font-display)] text-3xl">Gestión de pedidos</h1>
        <p className="mt-2 text-sm text-muted-foreground">Consulta pedidos y actualiza estados operativos.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {statuses.map((status) => (
          <Card key={status} className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm capitalize">{status.replace("_", " ")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-primary">{counters[status] || 0}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="glass-card">
        <CardContent className="space-y-2 pt-6">
          <OrdersInventoryTable
            rows={rows}
            statuses={statuses}
            paymentStatuses={paymentStatuses}
            updateStatusAction={updateStatusAction}
          />
        </CardContent>
      </Card>
    </main>
  );
}
