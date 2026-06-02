import { NextResponse } from "next/server";
import { DEFAULT_CHECKOUT_SETTINGS, normalizeCheckoutSettings } from "@/lib/checkout-settings";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function GET() {
  const db = createServiceRoleClient();

  if (!db) {
    return NextResponse.json({ settings: DEFAULT_CHECKOUT_SETTINGS });
  }

  const { data, error } = await db.from("app_settings").select("value").eq("key", "checkout_settings").maybeSingle();

  if (error || !data) {
    return NextResponse.json({ settings: DEFAULT_CHECKOUT_SETTINGS });
  }

  return NextResponse.json({ settings: normalizeCheckoutSettings((data as { value?: unknown }).value) });
}
