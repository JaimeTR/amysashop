"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdminUser } from "@/lib/admin";
import {
  DIGITAL_FILES_BUCKET,
  DIGITAL_PUBLIC_BUCKET,
  DIGITAL_TAG,
  createDigitalOrder,
  getDeliverableFiles,
  getDigitalOrderById,
  getDigitalServiceClient,
} from "@/lib/digital-store";
import { DIGITAL_PRODUCT_TYPES, slugifyDigital, type DigitalPaymentMethod, type DigitalProductType } from "@/lib/digital-types";
import { sendPurchaseConfirmationEmail } from "@/lib/email";

type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

// Rutas públicas de /digital que no pueden usarse como slug de producto.
const RESERVED_SLUGS = new Set(["admin", "descargas", "gracias", "pedido", "ambarcastro"]);

async function requireDigitalAdmin() {
  await requireAdminUser("digital.manage");
  const db = getDigitalServiceClient();
  if (!db) throw new Error("Falta SUPABASE_SECRET_KEY en el servidor");
  return db;
}

function refreshDigital(productSlug?: string) {
  revalidateTag(DIGITAL_TAG);
  revalidatePath("/admin/digitales");
  revalidatePath("/digital");
  if (productSlug) revalidatePath(`/digital/${productSlug}`);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado";
}

// ============================================================
// Productos
// ============================================================

export type DigitalProductInput = {
  id?: string;
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  productType: DigitalProductType;
  features: string[];
  idealFor: string;
  price: number;
  priceBefore: number | null;
  coverUrl: string | null;
  previewImages: string[];
  active: boolean;
  featured: boolean;
  sortOrder: number;
  packProductIds: string[];
};

export async function saveDigitalProductAction(input: DigitalProductInput): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const db = await requireDigitalAdmin();

    const name = input.name.trim();
    const slug = slugifyDigital(input.slug || name);
    if (name.length < 2) return { ok: false, error: "Escribe el nombre del producto" };
    if (!slug || RESERVED_SLUGS.has(slug)) return { ok: false, error: "El enlace (slug) no es válido, usa otro" };
    if (!(input.productType in DIGITAL_PRODUCT_TYPES)) return { ok: false, error: "Tipo de producto inválido" };
    if (!Number.isFinite(input.price) || input.price < 0) return { ok: false, error: "Precio inválido" };

    const payload = {
      name,
      slug,
      subtitle: input.subtitle.trim() || null,
      description: input.description.trim(),
      product_type: input.productType,
      features: input.features.map((item) => item.trim()).filter(Boolean),
      ideal_for: input.idealFor.trim() || null,
      price: Math.round(input.price * 100) / 100,
      price_before: input.priceBefore != null && input.priceBefore > 0 ? Math.round(input.priceBefore * 100) / 100 : null,
      cover_url: input.coverUrl || null,
      preview_images: input.previewImages.filter(Boolean),
      active: input.active,
      featured: input.featured,
      sort_order: Math.round(input.sortOrder || 0),
    };

    const result = input.id
      ? await db.from("digital_products").update(payload).eq("id", input.id).select("id,slug").single()
      : await db.from("digital_products").insert(payload).select("id,slug").single();

    if (result.error || !result.data) {
      const duplicate = String(result.error?.message || "").includes("duplicate");
      return { ok: false, error: duplicate ? "Ya existe un producto con ese enlace (slug)" : result.error?.message || "No se pudo guardar" };
    }

    const productId = String(result.data.id);

    // Packs: reemplazar los productos incluidos.
    await db.from("digital_pack_items").delete().eq("pack_id", productId);
    const packIds = input.productType === "pack" ? Array.from(new Set(input.packProductIds.filter((id) => id !== productId))) : [];
    if (packIds.length > 0) {
      const packResult = await db.from("digital_pack_items").insert(packIds.map((id) => ({ pack_id: productId, product_id: id })));
      if (packResult.error) return { ok: false, error: packResult.error.message };
    }

    refreshDigital(slug);
    return { ok: true, data: { id: productId, slug } };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function deleteDigitalProductAction(productId: string): Promise<ActionResult<{ deactivated: boolean }>> {
  try {
    const db = await requireDigitalAdmin();

    // Si ya tiene pedidos no se borra (los compradores deben poder seguir descargando): se oculta.
    const { count } = await db.from("digital_orders").select("id", { count: "exact", head: true }).eq("product_id", productId);
    if ((count || 0) > 0) {
      await db.from("digital_products").update({ active: false }).eq("id", productId);
      refreshDigital();
      return { ok: true, data: { deactivated: true } };
    }

    const { data: files } = await db.from("digital_product_files").select("storage_path").eq("product_id", productId);
    const storagePaths = ((files || []) as Array<{ storage_path: string }>)
      .map((file) => file.storage_path)
      .filter((value) => !value.startsWith("local:"));
    if (storagePaths.length > 0) await db.storage.from(DIGITAL_FILES_BUCKET).remove(storagePaths);

    const { data: publicFiles } = await db.storage.from(DIGITAL_PUBLIC_BUCKET).list(productId);
    if (publicFiles && publicFiles.length > 0) {
      await db.storage.from(DIGITAL_PUBLIC_BUCKET).remove(publicFiles.map((file) => `${productId}/${file.name}`));
    }

    const { error } = await db.from("digital_products").delete().eq("id", productId);
    if (error) return { ok: false, error: error.message };

    refreshDigital();
    return { ok: true, data: { deactivated: false } };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

// ============================================================
// Subidas: el navegador sube directo a Supabase con una URL firmada
// (evita el límite de tamaño de las server actions y no pasa por el servidor).
// ============================================================

function safeFileName(name: string) {
  const ext = (name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
  const base = slugifyDigital(name.replace(/\.[^.]+$/, "")).slice(0, 60) || "archivo";
  return ext ? `${base}.${ext}` : base;
}

export async function createDigitalUploadUrlAction(input: {
  productId: string;
  bucket: "files" | "public";
  fileName: string;
}): Promise<ActionResult<{ bucket: string; path: string; token: string; publicUrl: string | null }>> {
  try {
    const db = await requireDigitalAdmin();
    if (!/^[0-9a-f-]{36}$/i.test(input.productId)) return { ok: false, error: "Guarda el producto antes de subir archivos" };

    const bucket = input.bucket === "public" ? DIGITAL_PUBLIC_BUCKET : DIGITAL_FILES_BUCKET;
    const path = `${input.productId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safeFileName(input.fileName)}`;
    const { data, error } = await db.storage.from(bucket).createSignedUploadUrl(path);
    if (error || !data) {
      return { ok: false, error: `No se pudo preparar la subida (${error?.message || "bucket"}). ¿Ejecutaste la migración de productos digitales?` };
    }

    const publicUrl = bucket === DIGITAL_PUBLIC_BUCKET ? db.storage.from(bucket).getPublicUrl(path).data.publicUrl : null;
    return { ok: true, data: { bucket, path: data.path, token: data.token, publicUrl } };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function registerDigitalFileAction(input: {
  productId: string;
  name: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const db = await requireDigitalAdmin();
    if (!input.storagePath.startsWith(`${input.productId}/`)) return { ok: false, error: "Ruta de archivo inválida" };

    const { count } = await db.from("digital_product_files").select("id", { count: "exact", head: true }).eq("product_id", input.productId);
    const { data, error } = await db
      .from("digital_product_files")
      .insert({
        product_id: input.productId,
        name: input.name.trim().slice(0, 200) || "Archivo",
        storage_path: input.storagePath,
        mime_type: input.mimeType || null,
        size_bytes: Math.round(input.sizeBytes || 0),
        sort_order: (count || 0) + 1,
      })
      .select("id")
      .single();

    if (error || !data) return { ok: false, error: error?.message || "No se pudo registrar el archivo" };
    refreshDigital();
    return { ok: true, data: { id: String(data.id) } };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function updateDigitalFileAction(input: { id: string; name: string; description: string; sortOrder: number }): Promise<ActionResult> {
  try {
    const db = await requireDigitalAdmin();
    const { error } = await db
      .from("digital_product_files")
      .update({ name: input.name.trim() || "Archivo", description: input.description.trim() || null, sort_order: Math.round(input.sortOrder) })
      .eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    refreshDigital();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function deleteDigitalFileAction(fileId: string): Promise<ActionResult> {
  try {
    const db = await requireDigitalAdmin();
    const { data } = await db.from("digital_product_files").select("storage_path").eq("id", fileId).maybeSingle();
    const storagePath = (data as { storage_path?: string } | null)?.storage_path || "";
    if (storagePath && !storagePath.startsWith("local:")) {
      await db.storage.from(DIGITAL_FILES_BUCKET).remove([storagePath]);
    }
    const { error } = await db.from("digital_product_files").delete().eq("id", fileId);
    if (error) return { ok: false, error: error.message };
    refreshDigital();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function deletePublicImageAction(url: string): Promise<ActionResult> {
  try {
    const db = await requireDigitalAdmin();
    const marker = `/storage/v1/object/public/${DIGITAL_PUBLIC_BUCKET}/`;
    const index = url.indexOf(marker);
    if (index >= 0) {
      await db.storage.from(DIGITAL_PUBLIC_BUCKET).remove([decodeURIComponent(url.slice(index + marker.length))]);
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

// ============================================================
// Pedidos
// ============================================================

async function sendOrderEmail(orderId: string): Promise<{ ok: boolean; error?: string }> {
  const order = await getDigitalOrderById(orderId);
  if (!order) return { ok: false, error: "Pedido no encontrado" };
  const files = await getDeliverableFiles(order.productId);
  return sendPurchaseConfirmationEmail({
    to: order.email,
    customerName: order.customerName,
    productName: order.productName,
    orderCode: order.code,
    downloadToken: order.downloadToken,
    files: files.map((file) => ({ name: file.name, description: file.description || file.productName || "" })),
  });
}

export async function confirmDigitalOrderAction(orderId: string): Promise<ActionResult<{ emailSent: boolean; emailError?: string }>> {
  try {
    const db = await requireDigitalAdmin();
    const { error } = await db
      .from("digital_orders")
      .update({ status: "completed", confirmed_at: new Date().toISOString() })
      .eq("id", orderId)
      .neq("status", "completed");
    if (error) return { ok: false, error: error.message };

    const email = await sendOrderEmail(orderId);
    revalidatePath("/admin/digitales");
    return { ok: true, data: { emailSent: email.ok, emailError: email.error } };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function cancelDigitalOrderAction(orderId: string): Promise<ActionResult> {
  try {
    const db = await requireDigitalAdmin();
    const { error } = await db.from("digital_orders").update({ status: "cancelled" }).eq("id", orderId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/digitales");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function resendDigitalOrderEmailAction(orderId: string): Promise<ActionResult<{ emailSent: boolean; emailError?: string }>> {
  try {
    await requireDigitalAdmin();
    const email = await sendOrderEmail(orderId);
    return { ok: true, data: { emailSent: email.ok, emailError: email.error } };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

// Venta cerrada fuera de la web (p. ej. directo por WhatsApp): se registra ya pagada.
export async function createManualDigitalOrderAction(input: {
  productId: string;
  customerName: string;
  email: string;
  phone: string;
  paymentMethod: DigitalPaymentMethod;
  paymentReference: string;
  sendEmail: boolean;
}): Promise<ActionResult<{ emailSent: boolean; emailError?: string }>> {
  try {
    await requireDigitalAdmin();
    if (input.customerName.trim().length < 2) return { ok: false, error: "Escribe el nombre del cliente" };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) return { ok: false, error: "Correo inválido" };

    const result = await createDigitalOrder({
      productId: input.productId,
      customerName: input.customerName,
      email: input.email,
      phone: input.phone,
      paymentMethod: input.paymentMethod,
      paymentReference: input.paymentReference,
      source: "manual",
      status: "completed",
    });
    if (!result.ok) return { ok: false, error: result.error };

    const email = input.sendEmail ? await sendOrderEmail(result.order.id) : { ok: false, error: "No solicitado" };
    revalidatePath("/admin/digitales");
    return { ok: true, data: { emailSent: email.ok, emailError: email.error } };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}
