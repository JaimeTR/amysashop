import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminPageNotifications } from "@/components/feedback/admin-page-notifications";
import { ProductCreateModal } from "@/components/admin/product-create-modal";
import { ProductImportModal } from "@/components/admin/product-import-modal";
import { ProductsInventoryTable } from "@/components/admin/products-inventory-table";
import { requireAdminUser } from "@/lib/admin";
import { canonicalizeBrandName } from "@/lib/brands";

const DEFAULT_PRODUCT_IMAGE = "/logos/amysa%20shop.png";

type PageProps = {
  searchParams?: {
    ok?: string;
    error?: string;
    page?: string;
    q?: string;
  };
};

function getAdminDataClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!url || !secret) {
    return null;
  }

  return createServiceClient(url, secret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function extractValue(description: string, key: "Código" | "Marca" | "Submarca" | "Subcategoría" | "Subcategoria") {
  const regex = new RegExp(`\\[${key}:\\s*(.*?)\\]`, "i");
  const match = description.match(regex);
  return match?.[1]?.trim() || "";
}

function stripMeta(description: string) {
  return description
    .replace(/\[Código:\s*.*?\]/gi, "")
    .replace(/\[Marca:\s*.*?\]/gi, "")
    .replace(/\[Submarca:\s*.*?\]/gi, "")
    .replace(/\[Subcategor[ií]a:\s*.*?\]/gi, "")
    .trim();
}

function appendMetaTags(baseDescription: string, meta: { code: string; brand: string; subBrand: string; subCategory: string }) {
  const tags = [
    `[Código: ${meta.code}]`,
    `[Marca: ${meta.brand}]`,
    meta.subBrand ? `[Submarca: ${meta.subBrand}]` : "",
    meta.subCategory ? `[Subcategoría: ${meta.subCategory}]` : "",
  ].filter(Boolean);

  return [baseDescription, ...tags].filter(Boolean).join("\n\n").trim();
}

function parseCsvLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function normalizeKey(value: string) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function toNumber(value: string, fallback = 0) {
  const normalized = String(value || "").trim().replace(/\s+/g, "").replace(",", ".");
  if (!normalized) return fallback;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value: string, fallback = true) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return fallback;
  return ["1", "true", "si", "sí", "yes", "activo", "activa"].includes(normalized);
}

function isValidImageUrl(value: string) {
  const clean = String(value || "").trim();
  if (!clean) return false;
  return clean.startsWith("/") || /^https?:\/\//i.test(clean);
}

function sanitizeImageUrls(values: string[]) {
  return Array.from(new Set(values.map((item) => String(item || "").trim()).filter(isValidImageUrl)));
}

function isVideoMediaUrl(value: string) {
  return /\.(mp4|webm|ogg|mov|m4v)(?:$|\?)/i.test(String(value || "").trim());
}

function sortGalleryMedia(values: string[]) {
  return [...values].sort((left, right) => {
    const leftIsVideo = isVideoMediaUrl(left);
    const rightIsVideo = isVideoMediaUrl(right);

    if (leftIsVideo === rightIsVideo) {
      return 0;
    }

    return leftIsVideo ? 1 : -1;
  });
}

function sanitizeMainMediaUrls(values: string[]) {
  return sanitizeImageUrls(values).filter((value) => !isVideoMediaUrl(value));
}

function parseGalleryMedia(value: string) {
  return String(value || "")
    .split(/\||,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseImageUrls(value: string, csvDelimiter: string) {
  const raw = String(value || "").trim();
  if (!raw) return [] as string[];

  const separator = raw.includes("|") ? "|" : csvDelimiter === ";" ? "," : "|";
  return sanitizeImageUrls(raw.split(separator));
}

function findCell(row: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const normalized = normalizeKey(key);
    if (normalized in row) {
      return row[normalized] || "";
    }
  }
  return "";
}

async function resolveOrCreateCategoryId(
  supabase: NonNullable<ReturnType<typeof getAdminDataClient>>,
  categoryName: string
) {
  const cleanName = String(categoryName || "").trim();
  if (!cleanName) {
    return null;
  }

  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .ilike("name", cleanName)
    .maybeSingle();

  if (existing?.id) {
    return existing.id as string;
  }

  const created = await supabase
    .from("categories")
    .upsert({ name: cleanName }, { onConflict: "name", ignoreDuplicates: true })
    .select("id")
    .maybeSingle();

  if (created.data?.id) {
    return created.data.id as string;
  }

  const { data: fallback } = await supabase
    .from("categories")
    .select("id")
    .ilike("name", cleanName)
    .maybeSingle();

  return (fallback?.id as string | undefined) ?? null;
}

function isMissingColumnError(error: { message?: string } | null | undefined, column: string) {
  const message = String(error?.message || "").toLowerCase();
  const needle = column.toLowerCase();
  return (
    (message.includes("column") && message.includes(needle) && message.includes("does not exist")) ||
    (message.includes("could not find") && message.includes(needle) && message.includes("schema cache"))
  );
}

function normalizeProductGender(value: unknown) {
  const raw = String(value || "").trim();
  const normalized = raw.toLowerCase();

  if (!normalized) {
    return null;
  }

  if (["hombres", "hombre", "male", "masculino", "man"].includes(normalized)) {
    return "Hombre";
  }

  if (["mujeres", "mujer", "female", "femenino", "woman"].includes(normalized)) {
    return "Mujer";
  }

  if (normalized.startsWith("niñ") || normalized.startsWith("nin") || normalized.includes("child")) {
    return "Unisex";
  }

  if (normalized.startsWith("uni")) {
    return "Unisex";
  }

  return raw;
}

function normalizeProductAgeGroup(value: unknown) {
  const raw = String(value || "").trim();
  const normalized = raw.toLowerCase();

  if (!normalized) {
    return null;
  }

  if (normalized.startsWith("adult")) {
    return "Adultos";
  }

  if (normalized.startsWith("niñ") || normalized.startsWith("nin") || normalized.includes("child")) {
    return "Niños";
  }

  if (normalized.startsWith("beb") || normalized.startsWith("inf")) {
    return "Bebés";
  }

  if (normalized.startsWith("jov") || normalized.includes("teen") || normalized.includes("adole")) {
    return "Jóvenes";
  }

  if (normalized.startsWith("uni")) {
    return "Unisex";
  }

  return raw;
}

function normalizeLabel(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function uniqueLabels(values: string[]) {
  const seen = new Map<string, string>();

  for (const value of values) {
    const label = String(value || "").trim();
    if (!label) continue;

    const key = normalizeLabel(label);
    if (!seen.has(key)) {
      seen.set(key, label);
    }
  }

  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b, "es"));
}

function normalizeProductPayload(payload: Record<string, unknown>): Record<string, unknown> {
  return {
    ...payload,
    gender: normalizeProductGender(payload.gender),
    age_group: normalizeProductAgeGroup(payload.age_group),
  };
}

async function safeInsertProduct(
  supabase: NonNullable<ReturnType<typeof getAdminDataClient>>,
  payload: Record<string, unknown>
) {
  const normalizedPayload = normalizeProductPayload(payload) as Record<string, unknown>;
  let result = await supabase.from("products").insert(normalizedPayload);

  if (result.error && isMissingColumnError(result.error, "price_before")) {
    const { price_before: _omit, ...withoutPriceBefore } = normalizedPayload;
    result = await supabase.from("products").insert(withoutPriceBefore);
  }

  if (result.error && isMissingColumnError(result.error, "gender")) {
    const { gender: _omit, ...withoutGender } = normalizedPayload;
    result = await supabase.from("products").insert(withoutGender);
  }

  if (result.error && isMissingColumnError(result.error, "age_group")) {
    const { age_group: _omit, ...withoutAgeGroup } = normalizedPayload;
    result = await supabase.from("products").insert(withoutAgeGroup);
  }

  return result;
}

async function safeUpdateProduct(
  supabase: NonNullable<ReturnType<typeof getAdminDataClient>>,
  productId: string,
  payload: Record<string, unknown>
) {
  const normalizedPayload = normalizeProductPayload(payload);
  let result = await supabase.from("products").update(normalizedPayload).eq("id", productId);

  if (result.error && isMissingColumnError(result.error, "price_before")) {
    const { price_before: _omit, ...withoutPriceBefore } = normalizedPayload;
    result = await supabase.from("products").update(withoutPriceBefore).eq("id", productId);
  }

  if (result.error && isMissingColumnError(result.error, "gender")) {
    const { gender: _omit, ...withoutGender } = normalizedPayload;
    result = await supabase.from("products").update(withoutGender).eq("id", productId);
  }

  if (result.error && isMissingColumnError(result.error, "age_group")) {
    const { age_group: _omit, ...withoutAgeGroup } = normalizedPayload;
    result = await supabase.from("products").update(withoutAgeGroup).eq("id", productId);
  }

  return result;
}

async function uploadProductImagesFromFormData(
  formData: FormData,
  supabase: NonNullable<ReturnType<typeof getAdminDataClient>>,
  fieldName = "files"
) {
  const files = formData
    .getAll(fieldName)
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (files.length === 0) {
    return [] as string[];
  }

  const bucketName =
    process.env.SUPABASE_PRODUCTS_BUCKET || process.env.NEXT_PUBLIC_SUPABASE_PRODUCTS_BUCKET || "products";

  const uploadedUrls: string[] = [];

  for (const file of files) {
    const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() || "jpg" : "jpg";
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;

    const uploadResult = await supabase.storage.from(bucketName).upload(path, file, {
      upsert: false,
      contentType: file.type || undefined,
      cacheControl: "3600",
    });

    if (uploadResult.error) {
      throw new Error(
        `No se pudo subir la imagen ${file.name}. Verifica bucket '${bucketName}' en Supabase Storage.`
      );
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
    if (data?.publicUrl) {
      uploadedUrls.push(data.publicUrl);
    }
  }

  return uploadedUrls;
}

function parseMediaUrls(raw: string) {
  return String(raw || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

async function buildProductMediaUrls(params: {
  formData: FormData;
  supabase: NonNullable<ReturnType<typeof getAdminDataClient>>;
  mainUrlsField: string;
  galleryUrlsField: string;
  mainFilesField: string;
  galleryFilesField: string;
}) {
  const { formData, supabase, mainUrlsField, galleryUrlsField, mainFilesField, galleryFilesField } = params;

  const mainUrls = sanitizeMainMediaUrls(parseMediaUrls(String(formData.get(mainUrlsField) || "")));
  const galleryUrls = sanitizeImageUrls(parseMediaUrls(String(formData.get(galleryUrlsField) || "")));

  const [mainUploads, galleryUploads] = await Promise.all([
    uploadProductImagesFromFormData(formData, supabase, mainFilesField),
    uploadProductImagesFromFormData(formData, supabase, galleryFilesField),
  ]);

  const mainMedia = sanitizeMainMediaUrls([...mainUploads, ...mainUrls]);
  const galleryMedia = sortGalleryMedia(sanitizeImageUrls([...galleryUploads, ...galleryUrls]));

  const primary = mainMedia[0] || galleryMedia[0] || DEFAULT_PRODUCT_IMAGE;
  const rest = [...mainMedia.slice(1), ...galleryMedia].filter((value) => value !== primary);

  return [primary, ...rest];
}

async function syncTaxonomies(params: {
  supabase: ReturnType<typeof getAdminDataClient>;
  brand: string;
  subBrand: string;
  categoryId: string;
  subCategory: string;
}) {
  const { supabase, brand, subBrand, categoryId, subCategory } = params;

  if (!supabase) {
    return;
  }

  if (brand) {
    const brandInsert = await supabase
      .from("brands")
      .upsert({ name: brand }, { onConflict: "name", ignoreDuplicates: true })
      .select("id")
      .maybeSingle();

    const brandId = brandInsert.data?.id;

    if (brandId && subBrand) {
      await supabase
        .from("sub_brands")
        .upsert({ brand_id: brandId, name: subBrand }, { onConflict: "brand_id,name", ignoreDuplicates: true });
    }
  }

  if (categoryId && subCategory) {
    await supabase
      .from("sub_categories")
      .upsert({ category_id: categoryId, name: subCategory }, { onConflict: "category_id,name", ignoreDuplicates: true });
  }
}

async function createProductAction(formData: FormData) {
  "use server";

  await requireAdminUser("products.manage");
  const supabase = getAdminDataClient();

  if (!supabase) {
    throw new Error("Falta SUPABASE_SECRET_KEY en el entorno");
  }

  const name = String(formData.get("name") || "").trim();
  const gender = String(formData.get("gender") || "").trim() || null;
  const ageGroup = normalizeProductAgeGroup(formData.get("ageGroup"));
  const brand = String(formData.get("brand") || "").trim();
  const subBrand = String(formData.get("subBrand") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const categoryName = String(formData.get("category") || "").trim();
  const subCategory = String(formData.get("subCategory") || "").trim();
  const price = Number(formData.get("price") || 0);
  const priceBefore = String(formData.get("priceBefore") || "").trim() ? Number(formData.get("priceBefore")) : null;
  const stock = Number(formData.get("stock") || 0);
  const visibleInStore = formData.get("active") === "on";

  if (!name || !brand || !categoryName || price <= 0 || stock < 0) {
    throw new Error("Completa nombre, marca, categoria, precio y stock");
  }

  const finalImages = await buildProductMediaUrls({
    formData,
    supabase,
    mainUrlsField: "mainImageUrls",
    galleryUrlsField: "galleryImageUrls",
    mainFilesField: "mainFiles",
    galleryFilesField: "galleryFiles",
  });

  const { data: existingCategory } = await supabase
    .from("categories")
    .select("id")
    .ilike("name", categoryName)
    .maybeSingle();

  const categoryId = existingCategory?.id;

  if (!categoryId) {
    throw new Error("La categoría no existe. Créala primero en el módulo Tienda.");
  }

  const canonicalBrand = canonicalizeBrandName(brand) || brand;

  await syncTaxonomies({
    supabase,
    brand: canonicalBrand,
    subBrand,
    categoryId,
    subCategory,
  });

  const { count: productCount } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true });

  const autoCode = `AS${String((productCount || 0) + 1).padStart(6, "0")}`;

  const productPayload = {
    name,
    code: autoCode,
    sku: autoCode,
    brand: canonicalBrand,
    gender,
    age_group: ageGroup,
    description,
    price,
    price_before: priceBefore,
    stock,
    images: finalImages,
    category_id: categoryId,
    sub_brand: subBrand,
    sub_category: subCategory,
    active: visibleInStore && stock > 0,
  };

  const withCodeAndBrand = await safeInsertProduct(supabase, productPayload);

  if (withCodeAndBrand.error) {
    const withCode = await safeInsertProduct(supabase, {
      name,
      code: autoCode,
      sku: autoCode,
      description: appendMetaTags(description, {
        code: autoCode,
        brand,
        subBrand,
        subCategory,
      }),
      price,
      price_before: priceBefore,
      stock,
      images: finalImages,
      category_id: categoryId,
      gender,
        age_group: ageGroup,
      active: visibleInStore && stock > 0,
    });

    if (withCode.error) {
      const withoutCode = await safeInsertProduct(supabase, {
        name,
        description: appendMetaTags(description, {
          code: autoCode,
          brand,
          subBrand,
          subCategory,
        }),
        price,
        price_before: priceBefore,
        stock,
        images: finalImages,
        category_id: categoryId,
        code: autoCode,
        sku: autoCode,
        gender,
        age_group: ageGroup,
        active: visibleInStore && stock > 0,
      });

      if (withoutCode.error) {
        throw new Error(withoutCode.error.message);
      }
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  revalidatePath("/");
}

async function importProductsAction(formData: FormData) {
  "use server";

  await requireAdminUser("products.manage");
  const supabase = getAdminDataClient();

  if (!supabase) {
    throw new Error("Falta SUPABASE_SECRET_KEY en el entorno");
  }

  const csvFile = formData.get("csvFile");
  if (!(csvFile instanceof File) || csvFile.size === 0) {
    throw new Error("Selecciona un archivo CSV válido");
  }

  const content = (await csvFile.text()).replace(/^\uFEFF/, "");
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("El CSV debe tener encabezados y al menos una fila");
  }

  const delimiter = (lines[0].match(/;/g) || []).length > (lines[0].match(/,/g) || []).length ? ";" : ",";
  const headers = parseCsvLine(lines[0], delimiter).map((header) => normalizeKey(header));

  const errors: string[] = [];
  let imported = 0;
  const { count: existingCount } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true });
  let skuSequence = (existingCount || 0) + 1;

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const values = parseCsvLine(lines[lineIndex], delimiter);
    const row = headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = String(values[index] || "").trim();
      return acc;
    }, {});

    const name = findCell(row, ["nombre", "name"]);
    const gender = findCell(row, ["genero", "género", "gender", "sexo"]);
    const ageGroup = normalizeProductAgeGroup(findCell(row, ["edad", "age", "age_group", "agegroup", "grupo_edad", "grupoedad"]));
    const brand = findCell(row, ["marca", "brand"]);
    const subBrand = findCell(row, ["submarca", "sub_brand", "subbrand"]);
    const categoryName = findCell(row, ["categoria", "category"]);
    const subCategory = findCell(row, ["subcategoria", "sub_category", "subcategory"]);
    const description = findCell(row, ["descripcion", "description"]);
    const price = toNumber(findCell(row, ["precio", "price"]), 0);
    const priceBeforeRaw = findCell(row, ["precio_anterior", "price_before", "pricebefore", "preciobefore"]);
    const priceBefore = priceBeforeRaw ? toNumber(priceBeforeRaw, 0) : null;
    const stock = toNumber(findCell(row, ["stock"]), 0);
    const mainImage = sanitizeMainMediaUrls(
      parseGalleryMedia(findCell(row, ["foto_principal", "main_image", "mainimage", "portada", "cover", "imagen_principal", "main"]))
    );
    const galleryImages = sanitizeImageUrls(
      parseGalleryMedia(findCell(row, ["galeria", "gallery", "galeria_medios", "gallery_media", "imagenes", "images", "imagen", "image"]))
    );
    const finalImages = [
      ...(mainImage.length > 0 ? [mainImage[0]] : []),
      ...sortGalleryMedia(galleryImages.filter((item) => item !== mainImage[0])),
    ];

    if (finalImages.length === 0) {
      finalImages.push(DEFAULT_PRODUCT_IMAGE);
    }
    const visibleInStore = toBoolean(findCell(row, ["activo", "active", "visible"]), true);

    if (!name || !brand || !categoryName || price <= 0 || stock < 0) {
      errors.push(`Fila ${lineIndex + 1}: faltan campos obligatorios (nombre, marca, categoria, precio, stock).`);
      continue;
    }

    const autoCode = `AS${String(skuSequence).padStart(6, "0")}`;
    skuSequence += 1;

    const categoryId = await resolveOrCreateCategoryId(supabase, categoryName);

    if (!categoryId) {
      errors.push(`Fila ${lineIndex + 1}: no se pudo resolver la categoria '${categoryName}'.`);
      continue;
    }

    const canonicalBrand = canonicalizeBrandName(brand) || brand;

    await syncTaxonomies({
      supabase,
      brand: canonicalBrand,
      subBrand,
      categoryId,
      subCategory,
    });

    const payload = {
      name,
      code: autoCode,
      sku: autoCode,
      gender: gender || null,
      age_group: ageGroup,
      brand: canonicalizeBrandName(brand) || brand,
      description,
      price,
      price_before: priceBefore,
      stock,
      images: finalImages,
      category_id: categoryId,
      sub_brand: subBrand,
      sub_category: subCategory,
      active: visibleInStore && stock > 0,
    };

    const result = await safeInsertProduct(supabase, payload);

    if (result.error) {
      errors.push(`Fila ${lineIndex + 1}: ${result.error.message}`);
      continue;
    }

    imported += 1;
  }

  revalidatePath("/admin");
  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  revalidatePath("/");

  if (imported === 0 && errors.length > 0) {
    throw new Error(`Se importaron ${imported} productos. Errores: ${errors.slice(0, 5).join(" | ")}`);
  }
}

async function updateProductAction(formData: FormData) {
  "use server";

  await requireAdminUser("products.manage");
  const supabase = getAdminDataClient();

  if (!supabase) {
    throw new Error("Falta SUPABASE_SECRET_KEY en el entorno");
  }

  const productId = String(formData.get("productId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const code = String(formData.get("code") || "").trim();
  const gender = String(formData.get("gender") || "").trim() || null;
  const ageGroup = normalizeProductAgeGroup(formData.get("ageGroup"));
  const categoryName = String(formData.get("category") || "").trim();
  const brand = String(formData.get("brand") || "").trim();
  const subBrand = String(formData.get("subBrand") || "").trim();
  const subCategory = String(formData.get("subCategory") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = Number(formData.get("price") || 0);
  const priceBefore = String(formData.get("priceBefore") || "").trim() ? Number(formData.get("priceBefore")) : null;
  const stock = Number(formData.get("stock") || 0);
  const visibleInStore = formData.get("active") === "on";
  const finalImages = await buildProductMediaUrls({
    formData,
    supabase,
    mainUrlsField: "mainImageUrls",
    galleryUrlsField: "galleryImageUrls",
    mainFilesField: "mainFiles",
    galleryFilesField: "galleryFiles",
  });

  if (!productId || !name || !code || !brand || !categoryName || price <= 0 || stock < 0) {
    throw new Error("Completa nombre, codigo, marca, categoria, precio y stock valido");
  }

  const { data: existingCategory } = await supabase
    .from("categories")
    .select("id")
    .ilike("name", categoryName)
    .maybeSingle();

  const categoryId = existingCategory?.id;

  if (!categoryId) {
    throw new Error("La categoria no existe. Creala primero en Tienda");
  }

  const autoCode = code || `AS${String((Number(productId.replace(/\D/g, "")) || 0) % 1000000).padStart(6, "0")}`;

  const current = await supabase
    .from("products")
    .select("description")
    .eq("id", productId)
    .maybeSingle();

  const baseDescription = stripMeta(String((current.data as { description?: string } | null)?.description || ""));

  const withColumns = await safeUpdateProduct(supabase, productId, {
      name,
      code: autoCode,
      sku: autoCode,
      gender,
      age_group: ageGroup,
      brand: canonicalizeBrandName(brand) || brand,
      description,
      price,
      price_before: priceBefore,
      images: finalImages,
      category_id: categoryId,
      sub_brand: subBrand,
      sub_category: subCategory,
      stock,
      active: visibleInStore && stock > 0,
    });

  if (withColumns.error) {
    const fallback = await safeUpdateProduct(supabase, productId, {
        name,
      code: autoCode,
      sku: autoCode,
      gender,
        price,
        price_before: priceBefore,
        stock,
        images: finalImages,
        category_id: categoryId,
        active: visibleInStore && stock > 0,
        description: appendMetaTags(baseDescription, {
          code,
          brand,
          subBrand,
          subCategory,
        }),
      });

    if (fallback.error) {
      throw new Error(fallback.error.message);
    }
  }

  await syncTaxonomies({
    supabase,
    brand,
    subBrand,
    categoryId: categoryId || "",
    subCategory,
  });

  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  revalidatePath("/");
}

async function cloneProductAction(formData: FormData) {
  "use server";

  await requireAdminUser("products.manage");
  const supabase = getAdminDataClient();

  if (!supabase) {
    throw new Error("Falta SUPABASE_SECRET_KEY en el entorno");
  }

  const originProductId = String(formData.get("originProductId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const code = String(formData.get("code") || "").trim();
  const gender = String(formData.get("gender") || "").trim() || null;
  const ageGroup = normalizeProductAgeGroup(formData.get("ageGroup"));
  const brand = String(formData.get("brand") || "").trim();
  const subBrand = String(formData.get("subBrand") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const categoryName = String(formData.get("category") || "").trim();
  const subCategory = String(formData.get("subCategory") || "").trim();
  const price = Number(formData.get("price") || 0);
  const priceBefore = String(formData.get("priceBefore") || "").trim() ? Number(formData.get("priceBefore")) : null;
  const stock = Number(formData.get("stock") || 0);
  const visibleInStore = formData.get("active") === "on" || formData.get("active") === "true";

  if (!name || !brand || !categoryName || price <= 0 || stock < 0) {
    throw new Error("Completa nombre, marca, categoria, precio y stock");
  }

  const { count: existingCount } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true });
  const autoCode = code || `AS${String((existingCount || 0) + 1).padStart(6, "0")}`;

  const finalImages = await buildProductMediaUrls({
    formData,
    supabase,
    mainUrlsField: "mainImageUrls",
    galleryUrlsField: "galleryImageUrls",
    mainFilesField: "mainFiles",
    galleryFilesField: "galleryFiles",
  });

  const { data: existingCategory } = await supabase
    .from("categories")
    .select("id")
    .ilike("name", categoryName)
    .maybeSingle();

  const categoryId = existingCategory?.id;

  if (!categoryId) {
    throw new Error("La categoría no existe. Créala primero en el módulo Tienda.");
  }

  await syncTaxonomies({
    supabase,
    brand,
    subBrand,
    categoryId,
    subCategory,
  });

  const productPayload = {
    name,
    code: autoCode,
    sku: autoCode,
    gender,
    age_group: ageGroup,
    brand,
    description,
    price,
    price_before: priceBefore,
    stock,
    images: finalImages,
    category_id: categoryId,
    sub_brand: subBrand,
    sub_category: subCategory,
    active: visibleInStore && stock > 0,
  };

  const withCodeAndBrand = await safeInsertProduct(supabase, productPayload);

  if (withCodeAndBrand.error) {
    const withCode = await safeInsertProduct(supabase, {
      name,
      code: autoCode,
      sku: autoCode,
      description: appendMetaTags(description, {
        code: autoCode,
        brand,
        subBrand,
        subCategory,
      }),
      price,
      price_before: priceBefore,
      stock,
      images: finalImages,
      category_id: categoryId,
      gender,
      active: visibleInStore && stock > 0,
    });

    if (withCode.error) {
      const withoutCode = await safeInsertProduct(supabase, {
        name,
        description: appendMetaTags(description, {
          code: autoCode,
          brand,
          subBrand,
          subCategory,
        }),
        price,
        price_before: priceBefore,
        stock,
        images: finalImages,
        category_id: categoryId,
        code: autoCode,
        sku: autoCode,
        gender,
        active: visibleInStore && stock > 0,
      });

      if (withoutCode.error) {
        throw new Error(withoutCode.error.message);
      }
    }
  }

  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  revalidatePath("/");
}

async function deleteProductAction(formData: FormData) {
  "use server";

  await requireAdminUser("products.manage");
  const supabase = getAdminDataClient();

  if (!supabase) {
    redirect("/admin/productos?error=Falta+SUPABASE_SECRET_KEY+en+el+entorno");
  }

  const productId = String(formData.get("productId") || "").trim();

  if (!productId) {
    redirect("/admin/productos?error=Producto+inválido");
  }

  const { error } = await supabase.from("products").delete().eq("id", productId);

  if (error) {
    redirect(`/admin/productos?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  revalidatePath("/");
  redirect("/admin/productos?ok=Producto+eliminado");
}

export default async function AdminProductosPage({ searchParams }: PageProps) {
  await requireAdminUser("products.manage");
  const supabase = getAdminDataClient();

  if (!supabase) {
    return (
      <main className="space-y-5 pb-8">
        <header className="glass-card rounded-3xl p-5">
          <h1 className="font-[var(--font-display)] text-3xl">Gestión de productos</h1>
          <p className="mt-2 text-sm text-rose-700">Falta configurar SUPABASE_SECRET_KEY para el módulo admin.</p>
        </header>
      </main>
    );
  }

  const [categoriesResult, brandsResult, subBrandsResult, subCategoriesResult] = await Promise.all([
    supabase.from("categories").select("id,name").order("name", { ascending: true }),
    supabase.from("brands").select("id,name").order("name", { ascending: true }),
    supabase.from("sub_brands").select("name,brands(name)").order("name", { ascending: true }),
    supabase.from("sub_categories").select("name,categories(name)").order("name", { ascending: true }),
  ]);

  const page = Number.parseInt(String(searchParams?.page || "1"), 10) || 1;
  const searchQuery = String(searchParams?.q || "").trim().toLowerCase();
  const pageSize = 20;
  const start = Math.max(0, (page - 1) * pageSize);
  const end = start + pageSize - 1;

  let productsQuery = supabase
    .from("products")
    .select("id,name,code,brand,gender,age_group,sub_brand,sub_category,description,images,price,price_before,stock,active,created_at,categories(name)", { count: "exact" });

  // Aplicar búsqueda en servidor si existe
  if (searchQuery) {
    productsQuery = productsQuery.or(
      `name.ilike.%${searchQuery}%,code.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
    );
  }

  let productsResult: {
    data: Array<Record<string, unknown>> | null;
    error: { message?: string } | null;
    count?: number | null;
  } = await productsQuery
    .order("created_at", { ascending: false })
    .range(start, end);

  if (productsResult.error && (isMissingColumnError(productsResult.error, "price_before") || isMissingColumnError(productsResult.error, "age_group"))) {
    productsResult = await supabase
      .from("products")
      .select("id,name,code,brand,gender,sub_brand,sub_category,description,images,price,stock,active,created_at,categories(name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(start, end);
  }

  const categories = categoriesResult.data ?? [];
  const products = productsResult.data ?? [];
  const productsError = productsResult.error;
  const totalCount = Number(productsResult.count || products.length || 0);

  // Usar datos de BD para todas las opciones
  const brandOptions = uniqueLabels(
    (brandsResult.error ? [] : brandsResult.data ?? []).map((item: any) => item.name || "")
  );

  const categoryOptions = uniqueLabels((categoriesResult.error ? [] : (categoriesResult.data ?? [])).map((item: any) => item.name || ""));

  const subBrandOptions = uniqueLabels([
    ...(subBrandsResult.error ? [] : (subBrandsResult.data ?? [])).map((item) => item.name),
    ...products
      .map((product) => String((product as { sub_brand?: string | null }).sub_brand || "").trim())
      .filter(Boolean),
    ...products
      .map((product) => extractValue(String(product.description || ""), "Submarca").trim())
      .filter(Boolean),
  ]);

  const subCategoryOptions = uniqueLabels([
    ...(subCategoriesResult.error ? [] : (subCategoriesResult.data ?? [])).map((item) => item.name),
    ...products
      .map((product) => String((product as { sub_category?: string | null }).sub_category || "").trim())
      .filter(Boolean),
    ...products
      .map((product) => {
        const description = String(product.description || "");
        return (extractValue(description, "Subcategoría") || extractValue(description, "Subcategoria")).trim();
      })
      .filter(Boolean),
  ]);

  const inventoryRows = (products ?? []).map((product) => {
    const relation = product.categories as { name: string }[] | { name: string } | null;
    const categoryName = Array.isArray(relation) ? relation[0]?.name : relation?.name;
    const fullDescription = String(product.description || "");
    const fallbackCode = String((product as { code?: string | null }).code || extractValue(fullDescription, "Código"));
    const fallbackBrand = String((product as { brand?: string | null }).brand || extractValue(fullDescription, "Marca"));
    const fallbackGender = String((product as { gender?: string | null }).gender || "").trim() || null;
    const fallbackAgeGroup = String((product as { age_group?: string | null }).age_group || "").trim() || null;
    const fallbackSubBrand = String((product as { sub_brand?: string | null }).sub_brand || extractValue(fullDescription, "Submarca")).trim();
    const fallbackSubCategory = String(
      (product as { sub_category?: string | null }).sub_category ||
        extractValue(fullDescription, "Subcategoría") ||
        extractValue(fullDescription, "Subcategoria")
    ).trim();

    return {
      id: String(product.id || ""),
      sku: fallbackCode || "",
      name: String(product.name || ""),
      brand: canonicalizeBrandName(fallbackBrand) || fallbackBrand || "",
      subBrand: fallbackSubBrand || undefined,
      gender: fallbackGender || undefined,
      ageGroup: fallbackAgeGroup || undefined,

      category: categoryName ?? "Sin categoría",
      subCategory: fallbackSubCategory || undefined,

      description: stripMeta(fullDescription),
      rawDescription: fullDescription,
      images: Array.isArray((product as { images?: string[] | null }).images)
        ? sanitizeImageUrls((product as { images?: string[] | null }).images ?? [])
        : [],
      price: Number(product.price) || 0,
      priceBefore: (product as { price_before?: number | null }).price_before ? Number((product as { price_before?: number | null }).price_before) : null,
      stock: Number(product.stock) || 0,
      active: Boolean(product.active),
    };
  });

  return (
    <main className="space-y-5 pb-8">
      <AdminPageNotifications ok={searchParams?.ok} error={searchParams?.error} />

      <header className="glass-card rounded-3xl p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-[var(--font-display)] text-3xl">Gestión de productos</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Administra catálogo con acciones rápidas de edición, stock y disponibilidad.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ProductImportModal importProductsAction={importProductsAction} />
            <ProductCreateModal
              categories={categories ?? []}
              brands={brandOptions}
              subBrands={
                subBrandsResult.error
                  ? []
                  : (subBrandsResult.data ?? []).map((item) => {
                      const relation = item.brands as { name?: string }[] | { name?: string } | null;
                      const brandName = Array.isArray(relation) ? String(relation[0]?.name || "") : String(relation?.name || "");
                      return {
                        name: String(item.name || "").trim(),
                        brand: canonicalizeBrandName(brandName) || brandName,
                      };
                    }).filter((item) => item.name && item.brand)
              }
              subCategories={
                subCategoriesResult.error
                  ? []
                  : (subCategoriesResult.data ?? []).map((item) => {
                      const relation = item.categories as { name?: string }[] | { name?: string } | null;
                      const categoryName = Array.isArray(relation) ? String(relation[0]?.name || "") : String(relation?.name || "");
                      return {
                        name: String(item.name || "").trim(),
                        category: categoryName,
                      };
                    }).filter((item) => item.name && item.category)
              }
              createProductAction={createProductAction}
            />
          </div>
        </div>
      </header>

      <Card className="glass-card">
        <CardContent className="pt-6">
          {productsError ? (
            <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              No se pudo cargar inventario: {productsError.message}
            </p>
          ) : null}

          {inventoryRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay productos registrados.</p>
          ) : (
            <ProductsInventoryTable
              rows={inventoryRows}
              categoryOptions={categoryOptions}
              brandOptions={brandOptions}
              subBrands={
                subBrandsResult.error
                  ? []
                  : (subBrandsResult.data ?? [])
                      .map((item) => {
                        const relation = item.brands as { name?: string }[] | { name?: string } | null;
                        const brandName = Array.isArray(relation)
                          ? String(relation[0]?.name || "")
                          : String(relation?.name || "");
                        return {
                          name: String(item.name || "").trim(),
                          brand: canonicalizeBrandName(brandName) || brandName,
                        };
                      })
                      .filter((item) => item.name && item.brand)
              }
              subCategories={
                subCategoriesResult.error
                  ? []
                  : (subCategoriesResult.data ?? [])
                      .map((item) => {
                        const relation = item.categories as { name?: string }[] | { name?: string } | null;
                        const categoryName = Array.isArray(relation)
                          ? String(relation[0]?.name || "")
                          : String(relation?.name || "");
                        return {
                          name: String(item.name || "").trim(),
                          category: categoryName,
                        };
                      })
                      .filter((item) => item.name && item.category)
              }
              updateProductAction={updateProductAction}
              cloneProductAction={cloneProductAction}
              deleteProductAction={deleteProductAction}
              currentPage={page}
              pageSize={pageSize}
              totalCount={totalCount}
              initialSearchTerm={searchQuery}
            />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
