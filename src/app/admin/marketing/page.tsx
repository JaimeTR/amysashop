import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminPageNotifications } from "@/components/feedback/admin-page-notifications";
import { PreheaderMessagesList } from "@/components/admin/preheader-messages-list";
import { requireAdminUser } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type PageProps = {
  searchParams?: {
    ok?: string;
    error?: string;
    editCoupon?: string;
  };
};

type CouponRow = {
  id: number;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_subtotal: number;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

type MessageRow = {
  id: number;
  message: string;
  sort_order: number;
  active: boolean;
};

function getServiceClientOrRedirect() {
  const service = createServiceRoleClient();

  if (!service) {
    redirect("/admin/marketing?error=Configura+SUPABASE_SERVICE_ROLE_KEY+para+gestionar+marketing");
  }

  return service;
}

async function createCouponAction(formData: FormData) {
  "use server";

  await requireAdminUser("store.manage");
  const supabase = getServiceClientOrRedirect();

  const code = String(formData.get("code") || "").trim().toUpperCase();
  const discountType = String(formData.get("discountType") || "percent").trim() as "percent" | "fixed";
  const discountValue = Number(formData.get("discountValue") || 0);
  const minSubtotal = Number(formData.get("minSubtotal") || 0);
  const startsAt = String(formData.get("startsAt") || "").trim() || null;
  const endsAt = String(formData.get("endsAt") || "").trim() || null;

  if (!code || !(discountType === "percent" || discountType === "fixed") || discountValue <= 0) {
    redirect("/admin/marketing?error=Completa+codigo+tipo+y+valor+de+descuento");
  }

  const { error } = await supabase.from("marketing_coupons").insert({
    code,
    discount_type: discountType,
    discount_value: discountValue,
    min_subtotal: Number.isFinite(minSubtotal) ? minSubtotal : 0,
    active: true,
    starts_at: startsAt,
    ends_at: endsAt,
  });

  if (error) {
    redirect(`/admin/marketing?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/carrito");
  revalidatePath("/checkout");
  revalidatePath("/admin/marketing");
  redirect("/admin/marketing?ok=Cupon+creado+correctamente");
}

async function updateCouponAction(formData: FormData) {
  "use server";

  await requireAdminUser("store.manage");
  const supabase = getServiceClientOrRedirect();

  const id = Number(formData.get("id") || 0);
  const code = String(formData.get("code") || "").trim().toUpperCase();
  const discountType = String(formData.get("discountType") || "percent").trim() as "percent" | "fixed";
  const discountValue = Number(formData.get("discountValue") || 0);
  const minSubtotal = Number(formData.get("minSubtotal") || 0);
  const startsAt = String(formData.get("startsAt") || "").trim() || null;
  const endsAt = String(formData.get("endsAt") || "").trim() || null;
  const active = String(formData.get("active") || "").trim() === "on";

  if (!id || !code || !(discountType === "percent" || discountType === "fixed") || discountValue <= 0) {
    redirect("/admin/marketing?error=Datos+invalidos+del+cupon");
  }

  const { error } = await supabase
    .from("marketing_coupons")
    .update({
      code,
      discount_type: discountType,
      discount_value: discountValue,
      min_subtotal: Number.isFinite(minSubtotal) ? minSubtotal : 0,
      starts_at: startsAt,
      ends_at: endsAt,
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(`/admin/marketing?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/carrito");
  revalidatePath("/checkout");
  revalidatePath("/admin/marketing");
  redirect("/admin/marketing?ok=Cupon+actualizado");
}

async function deleteCouponAction(formData: FormData) {
  "use server";

  await requireAdminUser("store.manage");
  const supabase = getServiceClientOrRedirect();

  const id = Number(formData.get("id") || 0);

  if (!id) {
    redirect("/admin/marketing?error=Cupon+invalido");
  }

  const { error } = await supabase.from("marketing_coupons").delete().eq("id", id);

  if (error) {
    redirect(`/admin/marketing?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/carrito");
  revalidatePath("/checkout");
  revalidatePath("/admin/marketing");
  redirect("/admin/marketing?ok=Cupon+eliminado");
}

async function createMessageAction(formData: FormData) {
  "use server";

  await requireAdminUser("store.manage");
  const supabase = getServiceClientOrRedirect();

  const message = String(formData.get("message") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);

  if (!message) {
    redirect("/admin/marketing?error=Ingresa+un+mensaje+para+el+preencabezado");
  }

  const { error } = await supabase.from("marketing_preheader_messages").insert({
    message,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    active: true,
  });

  if (error) {
    redirect(`/admin/marketing?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/marketing");
  redirect("/admin/marketing?ok=Mensaje+creado+correctamente");
}

async function updateMessageAction(formData: FormData) {
  "use server";

  await requireAdminUser("store.manage");
  const supabase = getServiceClientOrRedirect();

  const id = Number(formData.get("id") || 0);
  const message = String(formData.get("message") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const active = String(formData.get("active") || "").trim() === "on";

  if (!id || !message) {
    redirect("/admin/marketing?error=Datos+invalidos+del+mensaje");
  }

  const { error } = await supabase
    .from("marketing_preheader_messages")
    .update({
      message,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(`/admin/marketing?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/marketing");
  redirect("/admin/marketing?ok=Mensaje+actualizado");
}

async function deleteMessageAction(formData: FormData) {
  "use server";

  await requireAdminUser("store.manage");
  const supabase = getServiceClientOrRedirect();

  const id = Number(formData.get("id") || 0);

  if (!id) {
    redirect("/admin/marketing?error=Mensaje+invalido");
  }

  const { error } = await supabase.from("marketing_preheader_messages").delete().eq("id", id);

  if (error) {
    redirect(`/admin/marketing?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/marketing");
  redirect("/admin/marketing?ok=Mensaje+eliminado");
}

export default async function AdminMarketingPage({ searchParams }: PageProps) {
  await requireAdminUser("store.manage");

  const supabase = getServiceClientOrRedirect();
  const editingCouponId = Number(searchParams?.editCoupon || 0);

  const [couponsResult, messagesResult] = await Promise.all([
    supabase
      .from("marketing_coupons")
      .select("id,code,discount_type,discount_value,min_subtotal,active,starts_at,ends_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("marketing_preheader_messages")
      .select("id,message,sort_order,active")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true }),
  ]);

  const coupons = (couponsResult.data || []) as CouponRow[];
  const messages = (messagesResult.data || []) as MessageRow[];

  return (
    <main className="space-y-5 pb-8">
      <header className="glass-card rounded-3xl p-5">
        <h1 className="font-[var(--font-display)] text-3xl">Marketing y campañas</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Administra cupones de descuento y los mensajes que aparecen en el preencabezado.
        </p>
      </header>

      <AdminPageNotifications ok={searchParams?.ok} error={searchParams?.error} />

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Crear cupón</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createCouponAction} className="grid gap-3 text-sm md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Código</label>
                <input name="code" placeholder="Ej: AMYSA2026" className="h-10 w-full rounded-xl border border-input bg-white px-3" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Subtotal mínimo (S/)</label>
                <input name="minSubtotal" type="number" min="0" step="0.1" placeholder="0" className="h-10 w-full rounded-xl border border-input bg-white px-3" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Tipo de descuento</label>
                <select name="discountType" className="h-10 w-full rounded-xl border border-input bg-white px-3">
                  <option value="percent">Porcentaje (%)</option>
                  <option value="fixed">Moneda (S/)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Valor descuento</label>
                <input name="discountValue" type="number" min="0.1" step="0.1" placeholder="Ej: 10 o 15" className="h-10 w-full rounded-xl border border-input bg-white px-3" required />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Fecha inicio</label>
                <input name="startsAt" type="datetime-local" className="h-10 w-full rounded-xl border border-input bg-white px-3" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Fecha fin</label>
                <input name="endsAt" type="datetime-local" className="h-10 w-full rounded-xl border border-input bg-white px-3" />
              </div>

              <div className="md:col-span-2">
                <Button type="submit" className="w-full">Crear cupón</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Crear mensaje de preencabezado</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createMessageAction} className="grid gap-2 text-sm">
              <textarea
                name="message"
                rows={3}
                placeholder="Mensaje comercial que saldra en el preencabezado"
                className="rounded-xl border border-input bg-white px-3 py-2"
                required
              />
              <input name="sortOrder" type="number" min="0" placeholder="Orden (0, 10, 20...)" className="h-10 rounded-xl border border-input bg-white px-3" />
              <Button type="submit">Crear mensaje</Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Cupones registrados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {coupons.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay cupones creados.</p>
            ) : (
              coupons.map((coupon) => {
                const isEditing = editingCouponId === coupon.id;

                if (!isEditing) {
                  return (
                    <article key={coupon.id} className="space-y-3 rounded-2xl border bg-white/75 p-4 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-lg font-bold text-foreground">{coupon.code}</p>
                        </div>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                            coupon.active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {coupon.active ? "Activo" : "Inactivo"}
                        </span>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground">Tipo</p>
                          <p className="font-medium">
                            {coupon.discount_type === "percent" ? "Porcentaje (%)" : "Moneda (S/)"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground">Descuento</p>
                          <p className="font-medium">{Number(coupon.discount_value).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground">Subtotal mínimo</p>
                          <p className="font-medium">S/ {Number(coupon.min_subtotal).toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground">Vigencia</p>
                          <p className="text-foreground">
                            {coupon.starts_at
                              ? new Date(coupon.starts_at).toLocaleDateString("es-PE")
                              : "Sin fecha"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground">Hasta</p>
                          <p className="text-foreground">
                            {coupon.ends_at
                              ? new Date(coupon.ends_at).toLocaleDateString("es-PE")
                              : "Sin fecha"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-3">
                        <Button type="button" size="sm" asChild>
                          <Link href={`/admin/marketing?editCoupon=${coupon.id}`}>
                            <Pencil className="mr-2 size-4" /> Modificar
                          </Link>
                        </Button>
                        <form action={deleteCouponAction}>
                          <input type="hidden" name="id" value={coupon.id} />
                          <button
                            type="submit"
                            className="inline-flex h-9 items-center rounded-md border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700"
                          >
                            <Trash2 className="mr-2 size-4" /> Eliminar
                          </button>
                        </form>
                      </div>
                    </article>
                  );
                }

                return (
                  <form key={coupon.id} action={updateCouponAction} className="space-y-2 rounded-2xl border border-primary/30 bg-primary/5 p-3 text-sm">
                    <input type="hidden" name="id" value={coupon.id} />
                    <div>
                      <input name="code" defaultValue={coupon.code} className="h-9 rounded-lg border border-input bg-white px-3" required />
                    </div>
                    <div className="grid gap-2 md:grid-cols-3">
                      <select name="discountType" defaultValue={coupon.discount_type} className="h-9 rounded-lg border border-input bg-white px-3">
                        <option value="percent">Porcentaje (%)</option>
                        <option value="fixed">Moneda (S/)</option>
                      </select>
                      <input name="discountValue" type="number" min="0.1" step="0.1" defaultValue={Number(coupon.discount_value)} className="h-9 rounded-lg border border-input bg-white px-3" required />
                      <input name="minSubtotal" type="number" min="0" step="0.1" defaultValue={Number(coupon.min_subtotal)} className="h-9 rounded-lg border border-input bg-white px-3" />
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      <input
                        name="startsAt"
                        type="datetime-local"
                        defaultValue={coupon.starts_at ? coupon.starts_at.slice(0, 16) : ""}
                        className="h-9 rounded-lg border border-input bg-white px-3"
                      />
                      <input
                        name="endsAt"
                        type="datetime-local"
                        defaultValue={coupon.ends_at ? coupon.ends_at.slice(0, 16) : ""}
                        className="h-9 rounded-lg border border-input bg-white px-3"
                      />
                    </div>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" name="active" defaultChecked={coupon.active} />
                      Activo
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" size="sm">
                        <Pencil className="mr-2 size-4" /> Guardar cambios
                      </Button>
                      <Button type="button" size="sm" variant="outline" asChild>
                        <Link href="/admin/marketing">Cancelar edición</Link>
                      </Button>
                    </div>
                  </form>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Mensajes de preencabezado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <PreheaderMessagesList
              messages={messages}
              updateMessageAction={updateMessageAction}
              deleteMessageAction={deleteMessageAction}
            />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
