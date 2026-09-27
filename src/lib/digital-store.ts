import "server-only";
import fs from "fs";
import path from "path";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type {
  DigitalFileInfo,
  DigitalOrder,
  DigitalPaymentMethod,
  DigitalProduct,
  DigitalProductType,
} from "@/lib/digital-types";

export const DIGITAL_TAG = "digital";
export const DIGITAL_FILES_BUCKET = "digital-files";
export const DIGITAL_PUBLIC_BUCKET = "digital-public";
const LOCAL_FILES_DIR = path.join(process.cwd(), "private", "digital", "files");
const PRODUCT_COLUMNS =
  "id,slug,name,subtitle,description,product_type,features,ideal_for,price,price_before,cover_url,preview_images,active,featured,sort_order,updated_at";

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  product_type: string;
  features: unknown;
  ideal_for: string | null;
  price: number | string;
  price_before: number | string | null;
  cover_url: string | null;
  preview_images: unknown;
  active: boolean;
  featured: boolean;
  sort_order: number;
  updated_at: string | null;
};

type FileRow = {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  sort_order: number;
};

type OrderRow = {
  id: string;
  code: string;
  product_id: string;
  customer_name: string;
  email: string;
  phone: string | null;
  payment_method: string;
  payment_reference: string | null;
  amount: number | string;
  status: string;
  source: string;
  download_token: string;
  download_count: number;
  admin_note: string | null;
  created_at: string;
  confirmed_at: string | null;
  digital_products?: { name: string; slug: string } | { name: string; slug: string }[] | null;
};

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item || "").trim()).filter(Boolean) : [];
}

export function mapProduct(row: ProductRow): DigitalProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle,
    description: row.description || "",
    productType: (row.product_type as DigitalProductType) || "otro",
    features: toStringArray(row.features),
    idealFor: row.ideal_for,
    price: Number(row.price || 0),
    priceBefore: row.price_before != null ? Number(row.price_before) : null,
    coverUrl: row.cover_url,
    previewImages: toStringArray(row.preview_images),
    active: row.active,
    featured: row.featured,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
  };
}

function mapFileInfo(row: FileRow): DigitalFileInfo {
  return {
    id: row.id,
    productId: row.product_id,
    name: row.name,
    description: row.description,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    sortOrder: row.sort_order,
  };
}

function mapOrder(row: OrderRow): DigitalOrder {
  const product = Array.isArray(row.digital_products) ? row.digital_products[0] : row.digital_products;
  return {
    id: row.id,
    code: row.code,
    productId: row.product_id,
    productName: product?.name || "Producto digital",
    productSlug: product?.slug || "",
    customerName: row.customer_name,
    email: row.email,
    phone: row.phone,
    paymentMethod: row.payment_method as DigitalPaymentMethod,
    paymentReference: row.payment_reference,
    amount: Number(row.amount || 0),
    status: row.status as DigitalOrder["status"],
    source: row.source,
    downloadToken: row.download_token,
    downloadCount: row.download_count,
    adminNote: row.admin_note,
    createdAt: row.created_at,
    confirmedAt: row.confirmed_at,
  };
}

// Cliente público sin cookies: permite cachear el catálogo entre visitas.
function createPublicClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "", {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getDigitalServiceClient() {
  return createServiceRoleClient();
}

// ============================================================
// Catálogo público (cacheado; el admin invalida con revalidateTag(DIGITAL_TAG))
// ============================================================

type PublicCatalog = {
  products: ProductRow[];
  files: FileRow[];
  packItems: Array<{ pack_id: string; product_id: string }>;
};

const getCachedPublicCatalog = unstable_cache(
  async (): Promise<PublicCatalog> => {
    const client = createPublicClient();
    const [products, files, packItems] = await Promise.all([
      client.from("digital_products").select(PRODUCT_COLUMNS).eq("active", true).order("sort_order").order("created_at"),
      client.from("digital_product_files").select("id,product_id,name,description,storage_path,mime_type,size_bytes,sort_order").order("sort_order"),
      client.from("digital_pack_items").select("pack_id,product_id"),
    ]);

    if (products.error) {
      throw new Error(products.error.message);
    }

    return {
      products: (products.data || []) as ProductRow[],
      files: (files.data || []) as FileRow[],
      packItems: (packItems.data || []) as PublicCatalog["packItems"],
    };
  },
  ["digital-public-catalog"],
  { revalidate: 300, tags: [DIGITAL_TAG] }
);

const loadPublicCatalog = cache(async () => {
  try {
    return await getCachedPublicCatalog();
  } catch (error) {
    console.error("digital catalog:", error);
    return { products: [], files: [], packItems: [] } as PublicCatalog;
  }
});

export async function getPublicDigitalProducts(): Promise<DigitalProduct[]> {
  const catalog = await loadPublicCatalog();
  return catalog.products.map(mapProduct);
}

export type DigitalProductDetail = {
  product: DigitalProduct;
  files: DigitalFileInfo[];
  // Para packs: productos incluidos con sus archivos.
  includedProducts: Array<{ product: DigitalProduct; files: DigitalFileInfo[] }>;
};

export async function getPublicDigitalProductDetail(slug: string): Promise<DigitalProductDetail | null> {
  const catalog = await loadPublicCatalog();
  const row = catalog.products.find((item) => item.slug === slug);
  if (!row) return null;

  const filesOf = (productId: string) => catalog.files.filter((file) => file.product_id === productId).map(mapFileInfo);
  const includedIds = catalog.packItems.filter((item) => item.pack_id === row.id).map((item) => item.product_id);
  const includedProducts = includedIds
    .map((id) => catalog.products.find((item) => item.id === id))
    .filter((item): item is ProductRow => Boolean(item))
    .map((item) => ({ product: mapProduct(item), files: filesOf(item.id) }));

  return { product: mapProduct(row), files: filesOf(row.id), includedProducts };
}

// ============================================================
// Pedidos
// ============================================================

export async function createDigitalOrder(input: {
  productId: string;
  customerName: string;
  email: string;
  phone?: string | null;
  paymentMethod: DigitalPaymentMethod;
  paymentReference?: string | null;
  source?: string;
  status?: "pending" | "completed";
  adminNote?: string | null;
}): Promise<{ ok: true; order: DigitalOrder } | { ok: false; error: string }> {
  const db = getDigitalServiceClient();
  if (!db) return { ok: false, error: "Falta SUPABASE_SECRET_KEY en el servidor" };

  // El precio siempre sale de la BD, nunca del navegador.
  const { data: product, error: productError } = await db
    .from("digital_products")
    .select("id,price,active")
    .eq("id", input.productId)
    .maybeSingle();

  if (productError || !product) return { ok: false, error: "Producto no encontrado" };
  if (!product.active && input.source !== "manual") return { ok: false, error: "Producto no disponible" };

  const completed = input.status === "completed";
  const { data, error } = await db
    .from("digital_orders")
    .insert({
      product_id: input.productId,
      customer_name: input.customerName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() || null,
      payment_method: input.paymentMethod,
      payment_reference: input.paymentReference?.trim() || null,
      amount: Number(product.price),
      source: input.source || "web",
      status: completed ? "completed" : "pending",
      confirmed_at: completed ? new Date().toISOString() : null,
      admin_note: input.adminNote?.trim() || null,
    })
    .select("*, digital_products(name,slug)")
    .single();

  if (error || !data) return { ok: false, error: error?.message || "No se pudo registrar el pedido" };
  return { ok: true, order: mapOrder(data as OrderRow) };
}

export async function getDigitalOrderById(id: string): Promise<DigitalOrder | null> {
  const db = getDigitalServiceClient();
  if (!db || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await db.from("digital_orders").select("*, digital_products(name,slug)").eq("id", id).maybeSingle();
  return data ? mapOrder(data as OrderRow) : null;
}

export async function listDigitalOrders(filter: { status?: string; limit?: number } = {}): Promise<DigitalOrder[]> {
  const db = getDigitalServiceClient();
  if (!db) return [];
  let query = db.from("digital_orders").select("*, digital_products(name,slug)").order("created_at", { ascending: false });
  if (filter.status && ["pending", "completed", "cancelled"].includes(filter.status)) {
    query = query.eq("status", filter.status);
  }
  const { data } = await query.limit(filter.limit || 200);
  return ((data || []) as OrderRow[]).map(mapOrder);
}

// Pedidos de un email: solo estado (sin token), para la página "Mis descargas".
export async function listOrdersByEmail(email: string): Promise<DigitalOrder[]> {
  const db = getDigitalServiceClient();
  if (!db) return [];
  const { data } = await db
    .from("digital_orders")
    .select("*, digital_products(name,slug)")
    .eq("email", email.trim().toLowerCase())
    .order("created_at", { ascending: false })
    .limit(50);
  return ((data || []) as OrderRow[]).map(mapOrder);
}

export async function getOrderByToken(token: string, email: string): Promise<DigitalOrder | null> {
  const db = getDigitalServiceClient();
  if (!db || !/^[0-9a-f-]{36}$/i.test(token)) return null;
  const { data } = await db
    .from("digital_orders")
    .select("*, digital_products(name,slug)")
    .eq("download_token", token)
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  return data ? mapOrder(data as OrderRow) : null;
}

// ============================================================
// Archivos entregables y descarga
// ============================================================

// Archivos que recibe un pedido: los del producto y, si es pack, los de cada producto incluido.
export async function getDeliverableFiles(productId: string): Promise<Array<DigitalFileInfo & { productName: string }>> {
  const db = getDigitalServiceClient();
  if (!db) return [];

  const { data: packItems } = await db.from("digital_pack_items").select("product_id").eq("pack_id", productId);
  const productIds = [productId, ...((packItems || []) as Array<{ product_id: string }>).map((item) => item.product_id)];

  const [{ data: files }, { data: products }] = await Promise.all([
    db
      .from("digital_product_files")
      .select("id,product_id,name,description,storage_path,mime_type,size_bytes,sort_order")
      .in("product_id", productIds)
      .order("sort_order"),
    db.from("digital_products").select("id,name").in("id", productIds),
  ]);

  const names = new Map(((products || []) as Array<{ id: string; name: string }>).map((item) => [item.id, item.name]));
  return ((files || []) as FileRow[])
    .sort((a, b) => productIds.indexOf(a.product_id) - productIds.indexOf(b.product_id) || a.sort_order - b.sort_order)
    .map((row) => ({ ...mapFileInfo(row), productName: names.get(row.product_id) || "" }));
}

export type FileDelivery =
  | { kind: "signed"; url: string }
  | { kind: "local"; absolutePath: string; name: string; mimeType: string | null };

export async function getFileDelivery(order: DigitalOrder, fileId: string, preview: boolean): Promise<FileDelivery | null> {
  const db = getDigitalServiceClient();
  if (!db) return null;

  const allowed = await getDeliverableFiles(order.productId);
  if (!allowed.some((file) => file.id === fileId)) return null;

  const { data } = await db.from("digital_product_files").select("name,storage_path,mime_type").eq("id", fileId).maybeSingle();
  if (!data) return null;
  const file = data as Pick<FileRow, "name" | "storage_path" | "mime_type">;

  if (file.storage_path.startsWith("local:")) {
    const relative = file.storage_path.slice("local:".length);
    const absolutePath = path.resolve(LOCAL_FILES_DIR, relative);
    if (!absolutePath.startsWith(LOCAL_FILES_DIR + path.sep) || !fs.existsSync(absolutePath)) return null;
    await incrementDownloadCount(order);
    return { kind: "local", absolutePath, name: file.name, mimeType: file.mime_type };
  }

  const { data: signed } = await db.storage
    .from(DIGITAL_FILES_BUCKET)
    .createSignedUrl(file.storage_path, 120, preview ? undefined : { download: file.name });
  if (!signed?.signedUrl) return null;

  await incrementDownloadCount(order);
  return { kind: "signed", url: signed.signedUrl };
}

async function incrementDownloadCount(order: DigitalOrder) {
  const db = getDigitalServiceClient();
  if (db) await db.from("digital_orders").update({ download_count: order.downloadCount + 1 }).eq("id", order.id);
}

// ============================================================
// Admin
// ============================================================

export type AdminDigitalProduct = DigitalProduct & {
  files: Array<DigitalFileInfo & { storagePath: string }>;
  packProductIds: string[];
  salesCount: number;
};

export async function listAdminDigitalProducts(): Promise<AdminDigitalProduct[]> {
  const db = getDigitalServiceClient();
  if (!db) return [];

  const [{ data: products }, { data: files }, { data: packItems }, { data: orders }] = await Promise.all([
    db.from("digital_products").select(PRODUCT_COLUMNS).order("sort_order").order("created_at"),
    db.from("digital_product_files").select("id,product_id,name,description,storage_path,mime_type,size_bytes,sort_order").order("sort_order"),
    db.from("digital_pack_items").select("pack_id,product_id"),
    db.from("digital_orders").select("product_id").eq("status", "completed"),
  ]);

  const fileRows = (files || []) as FileRow[];
  const packRows = (packItems || []) as Array<{ pack_id: string; product_id: string }>;
  const orderRows = (orders || []) as Array<{ product_id: string }>;

  return ((products || []) as ProductRow[]).map((row) => ({
    ...mapProduct(row),
    files: fileRows.filter((file) => file.product_id === row.id).map((file) => ({ ...mapFileInfo(file), storagePath: file.storage_path })),
    packProductIds: packRows.filter((item) => item.pack_id === row.id).map((item) => item.product_id),
    salesCount: orderRows.filter((order) => order.product_id === row.id).length,
  }));
}

export async function getAdminDigitalProduct(id: string): Promise<AdminDigitalProduct | null> {
  const products = await listAdminDigitalProducts();
  return products.find((item) => item.id === id) ?? null;
}
