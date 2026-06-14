import "server-only";
import { createDigitalServiceRoleClient } from "@/lib/supabase/digital-service-role";
import type { DigitalProduct, DigitalPurchase, DigitalFile } from "@/lib/digital";
import { FALLBACK_PRODUCTS } from "@/lib/digital";

const PRODUCT_SELECT = "id,name,slug,subtitle,description,features,ideal_for,price_usd,price_pen,paypal_link,culqi_link,file_urls,sort_order";

export async function getDigitalProducts(): Promise<DigitalProduct[]> {
  const client = createDigitalServiceRoleClient();
  if (!client) {
    return FALLBACK_PRODUCTS;
  }

  const { data, error } = await client
    .from("digital_products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    return FALLBACK_PRODUCTS;
  }

  return data.map(mapRowToProduct);
}

export async function getDigitalProductBySlug(slug: string): Promise<DigitalProduct | null> {
  const client = createDigitalServiceRoleClient();
  if (!client) {
    return FALLBACK_PRODUCTS.find((p) => p.slug === slug) || null;
  }

  const { data, error } = await client
    .from("digital_products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return FALLBACK_PRODUCTS.find((p) => p.slug === slug) || null;
  }

  return mapRowToProduct(data);
}

function mapRowToProduct(row: Record<string, unknown>): DigitalProduct {
  const rawFiles = row.file_urls;
  let files: DigitalFile[] = [];
  if (Array.isArray(rawFiles)) {
    files = rawFiles.map((f: unknown) => {
      const file = f as Record<string, unknown>;
      return {
        name: String(file.name || ""),
        description: String(file.description || ""),
        url: String(file.url || ""),
        type: (file.type as DigitalFile["type"]) || "other",
      };
    });
  }

  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    subtitle: row.subtitle ? String(row.subtitle) : null,
    description: String(row.description),
    features: Array.isArray(row.features) ? row.features.map((f: unknown) => String(f)) : [],
    ideal_for: row.ideal_for ? String(row.ideal_for) : null,
    price_usd: Number(row.price_usd),
    price_pen: Number(row.price_pen),
    paypal_link: String(row.paypal_link),
    culqi_link: String(row.culqi_link),
    files,
    sort_order: Number(row.sort_order),
  };
}

export async function createPurchase(input: {
  email: string;
  customer_name: string;
  product_id: string;
  payment_method: "paypal" | "culqi";
  amount: number;
  currency: "USD" | "PEN";
}): Promise<{ id: string } | { error: string }> {
  const client = createDigitalServiceRoleClient();
  if (!client) {
    return { error: "Database not available" };
  }

  const { data, error } = await client
    .from("digital_purchases")
    .insert({
      email: input.email.toLowerCase().trim(),
      customer_name: input.customer_name.trim(),
      product_id: input.product_id,
      payment_method: input.payment_method,
      amount: input.amount,
      currency: input.currency,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  return { id: String(data.id) };
}

export async function getPurchasesByEmail(email: string): Promise<DigitalPurchase[]> {
  const client = createDigitalServiceRoleClient();
  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from("digital_purchase_view")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  const purchases = data as DigitalPurchase[];

  const enriched = await Promise.all(
    purchases.map(async (p) => {
      if (p.status === "completed") {
        const product = await getDigitalProductBySlug(p.product_slug || "");
        return { ...p, files: product?.files || [] };
      }
      return p;
    })
  );

  return enriched;
}

export async function getAllPurchases(): Promise<DigitalPurchase[]> {
  const client = createDigitalServiceRoleClient();
  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from("digital_purchase_view")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as DigitalPurchase[];
}

export async function confirmPurchase(
  purchaseId: string
): Promise<{ ok: true; purchase: DigitalPurchase } | { ok: false; error: string }> {
  const client = createDigitalServiceRoleClient();
  if (!client) {
    return { ok: false, error: "Database not available" };
  }

  const { error: updateError } = await client
    .from("digital_purchases")
    .update({ status: "completed", confirmed_at: new Date().toISOString() })
    .eq("id", purchaseId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  const { data, error: fetchError } = await client
    .from("digital_purchase_view")
    .select("*")
    .eq("id", purchaseId)
    .single();

  if (fetchError || !data) {
    return { ok: false, error: "Purchase confirmed but failed to fetch details" };
  }

  return { ok: true, purchase: data as DigitalPurchase };
}
