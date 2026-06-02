import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, CreditCard, ExternalLink, QrCode, Save, Truck, UserCircle2 } from "lucide-react";
import { AdminPageNotifications } from "@/components/feedback/admin-page-notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminUser } from "@/lib/admin";
import { DEFAULT_CHECKOUT_SETTINGS, normalizeCheckoutSettings, type CheckoutSettings } from "@/lib/checkout-settings";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type PageProps = {
  searchParams?: {
    ok?: string;
    error?: string;
  };
};

function getServiceClientOrRedirect() {
  const service = createServiceRoleClient();

  if (!service) {
    redirect("/admin/configuracion?error=Configura+SUPABASE_SERVICE_ROLE_KEY+para+guardar+la+configuracion");
  }

  return service;
}

async function getCheckoutSettings() {
  const supabase = getServiceClientOrRedirect();
  const { data } = await supabase.from("app_settings").select("value").eq("key", "checkout_settings").maybeSingle();
  return normalizeCheckoutSettings((data as { value?: unknown } | null)?.value);
}

function readText(formData: FormData, name: string, fallback = "") {
  const value = String(formData.get(name) || "").trim();
  return value || fallback;
}

function readNumber(formData: FormData, name: string, fallback = 0) {
  const value = String(formData.get(name) || "").trim().replace(",", ".");
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function saveCheckoutSettingsAction(formData: FormData) {
  "use server";

  await requireAdminUser("store.manage");
  const supabase = getServiceClientOrRedirect();

  const nextSettings: CheckoutSettings = {
    paymentMethods: {
      transferencia: {
        label: readText(formData, "transferenciaLabel", DEFAULT_CHECKOUT_SETTINGS.paymentMethods.transferencia.label),
        enabled: true,
      },
      yape: {
        label: readText(formData, "yapeLabel", DEFAULT_CHECKOUT_SETTINGS.paymentMethods.yape.label),
        enabled: String(formData.get("yapeEnabled") || "").trim() !== "off",
      },
      plin: {
        label: readText(formData, "plinLabel", DEFAULT_CHECKOUT_SETTINGS.paymentMethods.plin.label),
        enabled: String(formData.get("plinEnabled") || "").trim() !== "off",
      },
    },
    gateways: {
      yapeQrUrl: readText(formData, "yapeQrUrl", DEFAULT_CHECKOUT_SETTINGS.gateways.yapeQrUrl),
      plinQrUrl: readText(formData, "plinQrUrl", DEFAULT_CHECKOUT_SETTINGS.gateways.plinQrUrl),
    },
    transferBanks: [
      {
        bank: "BCP",
        account: readText(formData, "bcpAccount", DEFAULT_CHECKOUT_SETTINGS.transferBanks[0].account),
        cci: readText(formData, "bcpCci", DEFAULT_CHECKOUT_SETTINGS.transferBanks[0].cci),
        enabled: true,
      },
      {
        bank: "Interbank",
        account: readText(formData, "interbankAccount", DEFAULT_CHECKOUT_SETTINGS.transferBanks[1].account),
        cci: readText(formData, "interbankCci", DEFAULT_CHECKOUT_SETTINGS.transferBanks[1].cci),
        enabled: true,
      },
      {
        bank: "BBVA",
        account: readText(formData, "bbvaAccount", DEFAULT_CHECKOUT_SETTINGS.transferBanks[2].account),
        cci: readText(formData, "bbvaCci", DEFAULT_CHECKOUT_SETTINGS.transferBanks[2].cci),
        enabled: true,
      },
    ],
    shippingMethods: {
      shipping_lima: {
        label: readText(formData, "shippingLimaLabel", DEFAULT_CHECKOUT_SETTINGS.shippingMethods.shipping_lima.label),
        description: readText(formData, "shippingLimaDescription", DEFAULT_CHECKOUT_SETTINGS.shippingMethods.shipping_lima.description),
        fee: readNumber(formData, "shippingLimaFee", DEFAULT_CHECKOUT_SETTINGS.shippingMethods.shipping_lima.fee),
      },
      shipping_provincia: {
        label: readText(formData, "shippingProvinciaLabel", DEFAULT_CHECKOUT_SETTINGS.shippingMethods.shipping_provincia.label),
        description: readText(formData, "shippingProvinciaDescription", DEFAULT_CHECKOUT_SETTINGS.shippingMethods.shipping_provincia.description),
        fee: readNumber(formData, "shippingProvinciaFee", DEFAULT_CHECKOUT_SETTINGS.shippingMethods.shipping_provincia.fee),
      },
      pickup_lima_points: {
        label: readText(formData, "pickupLabel", DEFAULT_CHECKOUT_SETTINGS.shippingMethods.pickup_lima_points.label),
        description: readText(formData, "pickupDescription", DEFAULT_CHECKOUT_SETTINGS.shippingMethods.pickup_lima_points.description),
        fee: readNumber(formData, "pickupFee", DEFAULT_CHECKOUT_SETTINGS.shippingMethods.pickup_lima_points.fee),
      },
    },
  };

  const { error } = await supabase
    .from("app_settings")
    .upsert(
      {
        key: "checkout_settings",
        value: nextSettings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );

  if (error) {
    redirect(`/admin/configuracion?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/configuracion");
  revalidatePath("/checkout");
  redirect("/admin/configuracion?ok=Configuracion+guardada+correctamente");
}

export default async function AdminConfiguracionPage({ searchParams }: PageProps) {
  await requireAdminUser("store.manage");
  const settings = await getCheckoutSettings();

  return (
    <main className="space-y-5 pb-8">
      <AdminPageNotifications ok={searchParams?.ok} error={searchParams?.error} />

      <header className="glass-card rounded-3xl p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Configuracion</p>
        <h1 className="font-[var(--font-display)] text-3xl">Centro de checkout</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Centraliza el perfil, la pasarela de pago, los QR, las cuentas bancarias y los metodos de envio.
        </p>
      </header>

      <section className="grid gap-3 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCircle2 className="size-4 text-primary" />
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              La edicion de datos personales sigue en la vista de perfil del usuario, para mantener el flujo de cuenta separado del checkout.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/perfil">
                Abrir perfil <ArrowUpRight className="ml-2 size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="size-4 text-primary" />
              Medios de pago
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Configura los nombres visibles de transferencia, Yape y Plin.</p>
            <p>Los QR y las cuentas bancarias se editan en los campos del formulario inferior.</p>
          </CardContent>
        </Card>
      </section>

      <form action={saveCheckoutSettingsAction} className="space-y-4">
        <section className="grid gap-3 lg:grid-cols-2">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <QrCode className="size-4 text-primary" />
                Pasarela de pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="yapeLabel">Etiqueta Yape</label>
                <input id="yapeLabel" name="yapeLabel" defaultValue={settings.paymentMethods.yape.label} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="yapeQrUrl">QR Yape</label>
                <input id="yapeQrUrl" name="yapeQrUrl" defaultValue={settings.gateways.yapeQrUrl} placeholder="URL del QR de Yape" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="plinLabel">Etiqueta Plin</label>
                <input id="plinLabel" name="plinLabel" defaultValue={settings.paymentMethods.plin.label} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="plinQrUrl">QR Plin</label>
                <input id="plinQrUrl" name="plinQrUrl" defaultValue={settings.gateways.plinQrUrl} placeholder="URL del QR de Plin" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="size-4 text-primary" />
                Numeros de pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4 rounded-2xl border border-border bg-white/60 p-4">
                <h3 className="text-sm font-semibold">BCP</h3>
                <input name="bcpAccount" defaultValue={settings.transferBanks[0]?.account || ""} placeholder="Numero de cuenta" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
                <input name="bcpCci" defaultValue={settings.transferBanks[0]?.cci || ""} placeholder="CCI" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
              </div>
              <div className="space-y-4 rounded-2xl border border-border bg-white/60 p-4">
                <h3 className="text-sm font-semibold">Interbank</h3>
                <input name="interbankAccount" defaultValue={settings.transferBanks[1]?.account || ""} placeholder="Numero de cuenta" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
                <input name="interbankCci" defaultValue={settings.transferBanks[1]?.cci || ""} placeholder="CCI" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
              </div>
              <div className="space-y-4 rounded-2xl border border-border bg-white/60 p-4">
                <h3 className="text-sm font-semibold">BBVA</h3>
                <input name="bbvaAccount" defaultValue={settings.transferBanks[2]?.account || ""} placeholder="Numero de cuenta" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
                <input name="bbvaCci" defaultValue={settings.transferBanks[2]?.cci || ""} placeholder="CCI" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-3 lg:grid-cols-3">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="size-4 text-primary" />
                Envio Lima
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <input name="shippingLimaLabel" defaultValue={settings.shippingMethods.shipping_lima.label} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
              <textarea name="shippingLimaDescription" defaultValue={settings.shippingMethods.shipping_lima.description} rows={3} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
              <input name="shippingLimaFee" type="number" step="0.01" defaultValue={settings.shippingMethods.shipping_lima.fee} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="size-4 text-primary" />
                Envio provincia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <input name="shippingProvinciaLabel" defaultValue={settings.shippingMethods.shipping_provincia.label} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
              <textarea name="shippingProvinciaDescription" defaultValue={settings.shippingMethods.shipping_provincia.description} rows={3} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
              <input name="shippingProvinciaFee" type="number" step="0.01" defaultValue={settings.shippingMethods.shipping_provincia.fee} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="size-4 text-primary" />
                Punto de entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <input name="pickupLabel" defaultValue={settings.shippingMethods.pickup_lima_points.label} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
              <textarea name="pickupDescription" defaultValue={settings.shippingMethods.pickup_lima_points.description} rows={3} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
              <input name="pickupFee" type="number" step="0.01" defaultValue={settings.shippingMethods.pickup_lima_points.fee} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" />
            </CardContent>
          </Card>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" className="rounded-xl">
            <Save className="mr-2 size-4" /> Guardar configuracion
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/checkout">
              Revisar checkout <ExternalLink className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </form>
    </main>
  );
}
