#!/usr/bin/env node
// Copia los pedidos del proyecto Supabase anterior del módulo digital (NEXT_PUBLIC_DIGITAL_SUPABASE_URL)
// a la tabla digital_orders de la base principal, conservando el download_token para que los
// enlaces de descarga ya enviados por correo sigan funcionando.
//
// Requisitos en .env.local:
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY                (base principal, destino)
//   NEXT_PUBLIC_DIGITAL_SUPABASE_URL, DIGITAL_SUPABASE_SECRET_KEY (proyecto anterior, origen)
// Antes: ejecutar supabase/migrations/20260928_digital_store.sql en la base principal.
// Uso: node scripts/migrate-digital-legacy.js            (simulación, no escribe)
//      node scripts/migrate-digital-legacy.js --apply    (escribe)
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env.local") });
const { createClient } = require("@supabase/supabase-js");

const apply = process.argv.includes("--apply");
const target = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "", {
  auth: { persistSession: false },
});
const source = createClient(process.env.NEXT_PUBLIC_DIGITAL_SUPABASE_URL || "", process.env.DIGITAL_SUPABASE_SECRET_KEY || "", {
  auth: { persistSession: false },
});

// Slugs antiguos -> nuevos.
const SLUG_MAP = {
  basico: "mi-catalogo-al-dia",
  intermedio: "gestion-de-ventas-por-catalogo",
  pro: "gestion-de-ventas-pro",
};

async function main() {
  if (!process.env.NEXT_PUBLIC_DIGITAL_SUPABASE_URL || !process.env.DIGITAL_SUPABASE_SECRET_KEY) {
    throw new Error("Faltan NEXT_PUBLIC_DIGITAL_SUPABASE_URL / DIGITAL_SUPABASE_SECRET_KEY del proyecto anterior en .env.local");
  }

  const { data: oldPurchases, error } = await source.from("digital_purchase_view").select("*");
  if (error) throw new Error(`Origen: ${error.message}`);

  const { data: newProducts, error: productsError } = await target.from("digital_products").select("id,slug");
  if (productsError) throw new Error(`Destino: ${productsError.message} (¿ejecutaste la migración?)`);
  const productBySlug = new Map(newProducts.map((product) => [product.slug, product.id]));

  const { data: existing } = await target.from("digital_orders").select("download_token");
  const existingTokens = new Set((existing || []).map((order) => order.download_token));

  const rows = [];
  for (const purchase of oldPurchases || []) {
    const productId = productBySlug.get(SLUG_MAP[purchase.product_slug] || purchase.product_slug);
    if (!productId) {
      console.warn(`Sin producto para "${purchase.product_slug}" (pedido ${purchase.id}), se omite`);
      continue;
    }
    if (purchase.download_token && existingTokens.has(purchase.download_token)) continue;

    rows.push({
      product_id: productId,
      customer_name: purchase.customer_name || "Cliente",
      email: String(purchase.email || "").toLowerCase(),
      payment_method: "otro",
      payment_reference: `Migrado (${purchase.payment_method || "sin método"})`,
      amount: Number(purchase.amount || 0),
      currency: purchase.currency || "PEN",
      status: purchase.status,
      source: "legacy",
      ...(purchase.download_token ? { download_token: purchase.download_token } : {}),
      created_at: purchase.created_at,
      confirmed_at: purchase.confirmed_at,
    });
  }

  console.log(`Pedidos en origen: ${(oldPurchases || []).length}. Por migrar: ${rows.length}.`);
  if (!apply) {
    console.log("Simulación: ejecuta con --apply para escribir.");
    return;
  }
  if (rows.length === 0) return;

  const { error: insertError } = await target.from("digital_orders").insert(rows);
  if (insertError) throw new Error(`Insertando: ${insertError.message}`);
  console.log(`Migrados ${rows.length} pedidos.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
