import "server-only";
import { DEFAULT_CHECKOUT_SETTINGS, normalizeCheckoutSettings, type CheckoutSettings } from "@/lib/checkout-settings";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

// Configuración de pagos/envíos guardada en /admin/configuracion (tabla app_settings).
export async function getCheckoutSettings(): Promise<CheckoutSettings> {
  const db = createServiceRoleClient();
  if (!db) return DEFAULT_CHECKOUT_SETTINGS;

  const { data, error } = await db.from("app_settings").select("value").eq("key", "checkout_settings").maybeSingle();
  if (error || !data) return DEFAULT_CHECKOUT_SETTINGS;

  return normalizeCheckoutSettings((data as { value?: unknown }).value);
}
