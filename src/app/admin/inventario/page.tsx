import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { InventoryTable } from "../../../components/admin/inventory-table";
import { InventoryCreateModal } from "../../../components/admin/inventory-create-modal";
import { InventoryImportModal } from "../../../components/admin/inventory-import-modal";
import { requireAdminUser } from "@/lib/admin";
import { canonicalizeBrandName } from "@/lib/brands";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const metadata = {
  title: "Gestión de Inventario | Admin",
  description: "Gestiona los costos y márgenes de ganancia de tu inventario",
};

type InventoryRow = {
  id: string;
  name: string;
  gender?: string;
  brand?: string;
  category: string;
  stock: number;
  cost: number;
  operating_cost: number;
  profit_margin: number;
  price: number;
  priceBefore?: number | null;
  images?: string[];
  active?: boolean;
};

function isMissingColumnError(error: { message?: string } | null | undefined, column: string) {
  const message = String(error?.message || "").toLowerCase();
  const needle = column.toLowerCase();
  return (
    (message.includes("column") && message.includes(needle) && message.includes("does not exist")) ||
    (message.includes("could not find") && message.includes(needle) && message.includes("schema cache"))
  );
}

function normalizeProductGender(value: unknown) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (["hombres", "hombre", "male", "masculino", "man"].includes(normalized)) {
    return "hombre";
  }

  if (["mujeres", "mujer", "female", "femenino", "woman"].includes(normalized)) {
    return "mujer";
  }

  if (normalized.startsWith("niñ") || normalized.startsWith("nin") || normalized.includes("child")) {
    return "ninos";
  }

  return null;
}

function normalizeProductAgeGroup(value: unknown) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized.startsWith("adult")) {
    return "adultos";
  }

  if (normalized.startsWith("niñ") || normalized.startsWith("nin") || normalized.includes("child")) {
    return "ninos";
  }

  if (normalized.startsWith("beb") || normalized.startsWith("inf")) {
    return "bebes";
  }

  if (normalized.startsWith("uni")) {
    return null;
  }

  return null;
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

function isSafeImageSrc(value: string) {
  const src = String(value || "").trim();
  return src.startsWith("/") || /^https?:\/\//i.test(src);
}

function sanitizeImageUrls(values: string[] | null | undefined) {
  return Array.from(new Set((values || []).map((item) => String(item || "").trim()).filter(isSafeImageSrc)));
}

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\uFEFF/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_áéíóúñ]/g, "");
}

function parseCsvLine(line: string, delimiter: string) {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  result.push(current.trim());
  return result;
}

function findCell(row: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const normalized = normalizeKey(key);
    if (row[normalized]) return row[normalized];
  }
  return "";
}

function toBoolean(value: string, fallback = true) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return fallback;
  return ["1", "true", "si", "sí", "yes", "y", "activo", "activa"].includes(normalized);
}

function toNumber(value: FormDataEntryValue | null, fallback = 0) {
  const normalized = String(value || "").trim().replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function resolveCategoryId(
  db: NonNullable<ReturnType<typeof createServiceRoleClient>>,
  categoryName: string
) {
  const cleanName = String(categoryName || "").trim();
  if (!cleanName) {
    return null;
  }

  const { data } = await db.from("categories").select("id").ilike("name", cleanName).maybeSingle();
  return (data as { id?: string } | null)?.id || null;
}

async function updateInventoryAction(formData: FormData) {
  "use server";

  await requireAdminUser("inventory.manage");

  const productId = String(formData.get("productId") || "").trim();
  if (!productId) return;

  const name = String(formData.get("name") || "").trim();
  const gender = normalizeProductGender(formData.get("gender"));
  const ageGroup = normalizeProductAgeGroup(formData.get("ageGroup"));
  const categoryName = String(formData.get("category") || "").trim();
  const active = ["true", "on", "1"].includes(String(formData.get("active") || "").trim().toLowerCase());

  const toNumber = (value: FormDataEntryValue | null, fallback = 0) => {
    const normalized = String(value || "").trim().replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const db = createServiceRoleClient();
  if (!db) {
    throw new Error("Falta configurar SUPABASE_SECRET_KEY o SUPABASE_SERVICE_ROLE_KEY.");
  }

  if (!name || !categoryName) {
    throw new Error("Completa nombre y categoría del producto.");
  }

  const categoryId = await resolveCategoryId(db, categoryName);
  if (!categoryId) {
    throw new Error("No se pudo resolver la categoría seleccionada.");
  }

  const payload = {
    name,
    gender,
    age_group: ageGroup,
    category_id: categoryId,
    active,
    stock: Math.max(0, Math.trunc(toNumber(formData.get("stock"), 0))),
    cost: Math.max(0, toNumber(formData.get("cost"), 0)),
    operating_cost: Math.max(0, toNumber(formData.get("operating_cost"), 0)),
    profit_margin: Math.max(0, toNumber(formData.get("profit_margin"), 0)),
    price_before: (() => {
      const raw = String(formData.get("price_before") || "").trim();
      if (!raw) return null;
      const parsed = Number(raw.replace(",", "."));
      return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
    })(),
  };

  const totalBaseCost = payload.cost + payload.operating_cost;
  const normalizedMargin = payload.profit_margin >= 1 ? payload.profit_margin / 100 : payload.profit_margin;
  const divisor = 1 - normalizedMargin;
  const computedFinalPrice = divisor > 0 && normalizedMargin < 1 ? totalBaseCost / divisor : totalBaseCost;
  const roundedFinalPrice = Number(Math.max(0, computedFinalPrice).toFixed(2));

  let result = await db
    .from("products")
    .update({
      name: payload.name,
      gender: payload.gender,
      age_group: payload.age_group,
      category_id: payload.category_id,
      active: payload.active,
      stock: payload.stock,
      cost: payload.cost,
      operating_cost: payload.operating_cost,
      profit_margin: payload.profit_margin,
      price: roundedFinalPrice,
      price_before: payload.price_before,
    })
    .eq("id", productId);

  if (result.error && isMissingColumnError(result.error, "price_before")) {
    result = await db
      .from("products")
      .update({
        name: payload.name,
        gender: payload.gender,
        age_group: payload.age_group,
        category_id: payload.category_id,
        active: payload.active,
        stock: payload.stock,
        cost: payload.cost,
        operating_cost: payload.operating_cost,
        profit_margin: payload.profit_margin,
        price: roundedFinalPrice,
      })
      .eq("id", productId);
  }

  if (result.error) {
    throw new Error(result.error.message || "No se pudo actualizar inventario.");
  }

  revalidatePath("/admin/inventario");
}

async function cloneInventoryItemAction(formData: FormData) {
  "use server";

  await requireAdminUser("inventory.manage");

  const db = createServiceRoleClient();
  if (!db) {
    throw new Error("Falta configurar SUPABASE_SECRET_KEY o SUPABASE_SERVICE_ROLE_KEY.");
  }

  const productId = String(formData.get("productId") || "").trim();
  if (!productId) {
    throw new Error("Producto inválido para clonar.");
  }

  const { data: source, error: sourceError } = await db
    .from("products")
    .select("name,gender,age_group,category_id,images,designation,cost,operating_cost,profit_margin,price,price_before,stock,active,brand")
    .eq("id", productId)
    .maybeSingle();

  if (sourceError || !source) {
    throw new Error(sourceError?.message || "No se pudo encontrar el producto a clonar.");
  }

  const { count: productCount } = await db
    .from("products")
    .select("id", { count: "exact", head: true });

  const nextSku = `AS${String((productCount || 0) + 1).padStart(6, "0")}`;

  const clonePayload = {
    name: `${String((source as { name?: string | null }).name || "Producto")} (Clon)`,
    gender: (source as { gender?: string | null }).gender || null,
    age_group: (source as { age_group?: string | null }).age_group || null,
    category_id: (source as { category_id?: string | null }).category_id || null,
    brand: canonicalizeBrandName(String((source as { brand?: string | null }).brand || "")) || String((source as { brand?: string | null }).brand || "") || null,
    code: nextSku,
    sku: nextSku,
    images: Array.isArray((source as { images?: string[] | null }).images)
      ? (source as { images?: string[] | null }).images
      : [],
    designation: String((source as { designation?: string | null }).designation || ""),
    cost: Number((source as { cost?: number | null }).cost) || 0,
    operating_cost: Number((source as { operating_cost?: number | null }).operating_cost) || 0,
    profit_margin: Number((source as { profit_margin?: number | null }).profit_margin) || 0,
    price: Number((source as { price?: number | null }).price) || 0,
    price_before: (source as { price_before?: number | null }).price_before || null,
    stock: Number((source as { stock?: number | null }).stock) || 0,
    active: Boolean((source as { active?: boolean | null }).active),
  };

  let result = await db.from("products").insert(clonePayload);

  if (result.error && isMissingColumnError(result.error, "price_before")) {
    const { price_before: _omit, ...withoutPriceBefore } = clonePayload;
    result = await db.from("products").insert(withoutPriceBefore);
  }

  if (result.error) {
    throw new Error(result.error.message || "No se pudo clonar el producto.");
  }

  revalidatePath("/admin/inventario");
}

async function deleteInventoryItemAction(formData: FormData) {
  "use server";

  await requireAdminUser("inventory.manage");

  const db = createServiceRoleClient();
  if (!db) {
    throw new Error("Falta configurar SUPABASE_SECRET_KEY o SUPABASE_SERVICE_ROLE_KEY.");
  }

  const productId = String(formData.get("productId") || "").trim();
  if (!productId) {
    throw new Error("Producto inválido para eliminar.");
  }

  const { error } = await db.from("products").delete().eq("id", productId);
  if (error) {
    throw new Error(error.message || "No se pudo eliminar el producto.");
  }

  revalidatePath("/admin/inventario");
}

async function createProductAction(formData: FormData) {
  "use server";

  await requireAdminUser("inventory.manage");

  const toNumber = (value: FormDataEntryValue | null, fallback = 0) => {
    const normalized = String(value || "").trim().replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const db = createServiceRoleClient();
  if (!db) {
    throw new Error("Falta configurar SUPABASE_SECRET_KEY o SUPABASE_SERVICE_ROLE_KEY.");
  }

  const name = String(formData.get("name") || "").trim();
  const gender = normalizeProductGender(formData.get("gender"));
  const ageGroup = normalizeProductAgeGroup(formData.get("ageGroup"));
  const categoryId = String(formData.get("categoryId") || "").trim();
  const image = String(formData.get("image") || "").trim();
  const number = String(formData.get("number") || "").trim();
  const brandRaw = String(formData.get("brand") || "").trim();
  const brand = canonicalizeBrandName(brandRaw) || brandRaw || null;

  const cost = Math.max(0, toNumber(formData.get("cost"), 0));
  const operating_cost = Math.max(0, toNumber(formData.get("operating_cost"), 0));
  const profit_margin = Math.max(0, toNumber(formData.get("profit_margin"), 0));
  const price_before = (() => {
    const raw = String(formData.get("price_before") || "").trim();
    if (!raw) return null;
    const parsed = Number(raw.replace(",", "."));
    return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
  })();

  if (!name) {
    redirect("/admin/inventario?error=Nombre+de+producto+requerido");
  }

  // Generar SKU automático basado en el orden de registro
  const { count: productCount } = await db
    .from("products")
    .select("id", { count: "exact", head: true });

  const nextSku = `AS${String((productCount || 0) + 1).padStart(6, "0")}`;

  // Calcular precio venta
  const totalBaseCost = cost + operating_cost;
  const normalizedMargin = profit_margin >= 1 ? profit_margin / 100 : profit_margin;
  const divisor = 1 - normalizedMargin;
  const computedFinalPrice = divisor > 0 && normalizedMargin < 1 ? totalBaseCost / divisor : totalBaseCost;
  const price = Number(Math.max(0, computedFinalPrice).toFixed(2));

  const images = image ? [image] : [];

  const { error } = await db.from("products").insert({
    name,
    gender,
    age_group: ageGroup,
    category_id: categoryId || null,
    brand,
    code: nextSku,
    sku: nextSku,
    images,
    designation: number,
    cost,
    operating_cost,
    profit_margin,
    price,
    price_before,
    stock: 0,
    active: true,
  });

  if (error) {
    redirect(`/admin/inventario?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/inventario");
  redirect("/admin/inventario?ok=Producto+creado+correctamente");
}

async function importInventoryAction(formData: FormData) {
  "use server";

  await requireAdminUser("inventory.manage");

  const db = createServiceRoleClient();
  if (!db) {
    throw new Error("Falta configurar SUPABASE_SECRET_KEY o SUPABASE_SERVICE_ROLE_KEY.");
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

  const { count: existingCount } = await db
    .from("products")
    .select("id", { count: "exact", head: true });

  let skuSequence = (existingCount || 0) + 1;
  const errors: string[] = [];
  let imported = 0;

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const values = parseCsvLine(lines[lineIndex], delimiter);
    const row = headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = String(values[index] || "").trim();
      return acc;
    }, {});

    const name = findCell(row, ["nombre", "name"]);
    const gender = normalizeProductGender(findCell(row, ["genero", "género", "gender", "sexo"]));
    const ageGroup = normalizeProductAgeGroup(findCell(row, ["edad", "age", "age_group", "agegroup", "grupo_edad", "grupoedad"]));
    const categoryName = findCell(row, ["categoria", "category"]);
    const brandName = findCell(row, ["marca", "brand"]);
    const stock = toNumber(findCell(row, ["stock"]), 0);
    const cost = toNumber(findCell(row, ["precio_costo", "costo", "cost"]), 0);
    const operatingCost = toNumber(findCell(row, ["costo_operativo", "operating_cost", "operatingcost"]), 0);
    const profitMargin = toNumber(findCell(row, ["margen", "profit_margin", "margen_ganancia"]), 0);
    const priceBeforeRaw = findCell(row, ["precio_sugerido", "precio_anterior", "price_before"]);
    const priceBefore = priceBeforeRaw ? toNumber(priceBeforeRaw, 0) : null;
    const image = findCell(row, ["imagen", "image", "images"]);
    const active = toBoolean(findCell(row, ["activo", "active", "visible"]), true);

    if (!name || !categoryName || stock < 0) {
      errors.push(`Fila ${lineIndex + 1}: faltan campos obligatorios (nombre, categoria, stock).`);
      continue;
    }

    const categoryResult = await db.from("categories").select("id").ilike("name", categoryName).maybeSingle();
    const categoryId = categoryResult.data?.id;

    if (!categoryId) {
      errors.push(`Fila ${lineIndex + 1}: no se pudo resolver la categoria '${categoryName}'.`);
      continue;
    }

    const nextSku = `AS${String(skuSequence).padStart(6, "0")}`;
    skuSequence += 1;

    const totalBaseCost = cost + operatingCost;
    const normalizedMargin = profitMargin >= 1 ? profitMargin / 100 : profitMargin;
    const divisor = 1 - normalizedMargin;
    const salePrice = divisor > 0 && normalizedMargin < 1 ? totalBaseCost / divisor : totalBaseCost;

    const { error } = await db.from("products").insert({
      name,
      gender,
      age_group: ageGroup,
      category_id: categoryId,
      brand: canonicalizeBrandName(String(brandName || "").trim()) || String(brandName || "").trim() || null,
      code: nextSku,
      sku: nextSku,
      stock,
      cost,
      operating_cost: operatingCost,
      profit_margin: profitMargin,
      price: Number(Math.max(0, salePrice).toFixed(2)),
      price_before: priceBefore,
      images: image ? [image] : [],
      active: active && stock > 0,
    });

    if (error) {
      errors.push(`Fila ${lineIndex + 1}: ${error.message}`);
      continue;
    }

    imported += 1;
  }

  revalidatePath("/admin/inventario");

  if (imported === 0 && errors.length > 0) {
    throw new Error(`Se importaron ${imported} productos. Errores: ${errors.slice(0, 5).join(" | ")}`);
  }

  redirect("/admin/inventario?ok=Importaci%C3%B3n+completada+correctamente");
}

export default async function InventarioPage({ searchParams }: { searchParams?: { page?: string } }) {
  // Verificar que el usuario tiene permiso para acceder a inventario
  const { supabase } = await requireAdminUser("inventory.manage");

  const db = createServiceRoleClient() ?? supabase;

  // Cargar categorías
  const categoriesResult = await db
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });

  const categories = (categoriesResult.data || []) as Array<{ id: string; name: string }>;

  const page = Number.parseInt(String(searchParams?.page || "1"), 10) || 1;
  const pageSize = 20;
  const start = Math.max(0, (page - 1) * pageSize);
  const end = start + pageSize - 1;

  let { data: products, error: productsError, count: productsCount } = await db
    .from("products")
    .select("id, name, gender, age_group, brand, stock, cost, operating_cost, profit_margin, price, price_before, images, active, categories(name)", { count: "exact" })
    .order("name", { ascending: true })
    .range(start, end);

  if (productsError && (isMissingColumnError(productsError, "price_before") || isMissingColumnError(productsError, "age_group"))) {
    const fallbackNoPriceBefore = await db
      .from("products")
      .select("id, name, gender, brand, stock, cost, operating_cost, profit_margin, price, images, active, categories(name)", { count: "exact" })
      .order("name", { ascending: true })
      .range(start, end);

    productsError = fallbackNoPriceBefore.error;
    products = (fallbackNoPriceBefore.data || []).map((row) => ({
      ...row,
      age_group: null,
      price_before: null,
    }));
    productsCount = fallbackNoPriceBefore.count ?? productsCount;
  }

  if (
    productsError &&
    (isMissingColumnError(productsError, "cost") ||
      isMissingColumnError(productsError, "operating_cost") ||
      isMissingColumnError(productsError, "profit_margin"))
  ) {
    const fallback = await db
      .from("products")
      .select("id, name, gender, age_group, brand, stock, price, images, active, categories(name)", { count: "exact" })
      .order("name", { ascending: true })
      .range(start, end);

    productsError = fallback.error;
    products = (fallback.data || []).map((row) => ({
      ...row,
      cost: 0,
      operating_cost: 0,
      profit_margin: 0,
      price_before: null,
    }));
    productsCount = fallback.count ?? productsCount;
  }

  const totalCount = Number(productsCount || (products || []).length || 0);

  const rows: InventoryRow[] = (products || []).map((product) => ({
    id: String(product.id || ""),
    name: String(product.name || ""),
    gender: String((product as { gender?: string | null }).gender || "") || undefined,
    ageGroup: String((product as { age_group?: string | null }).age_group || "") || undefined,
    brand: canonicalizeBrandName(String((product as { brand?: string | null }).brand || "")) || String((product as { brand?: string | null }).brand || "") || undefined,
    category: String(
      (product as { categories?: { name?: string | null } | Array<{ name?: string | null }> | null }).categories &&
        Array.isArray((product as { categories?: { name?: string | null } | Array<{ name?: string | null }> | null }).categories)
        ? (product as { categories?: Array<{ name?: string | null }> }).categories?.[0]?.name || "Sin categoría"
        : (product as { categories?: { name?: string | null } | null }).categories?.name || "Sin categoría"
    ),
    stock: Number(product.stock) || 0,
    cost: Number((product as { cost?: number | null }).cost) || 0,
    operating_cost: Number((product as { operating_cost?: number | null }).operating_cost) || 0,
    profit_margin: Number((product as { profit_margin?: number | null }).profit_margin) || 0,
    price: Number(product.price) || 0,
    priceBefore: (product as { price_before?: number | null }).price_before
      ? Number((product as { price_before?: number | null }).price_before)
      : null,
    images: sanitizeImageUrls((product as { images?: string[] | null }).images),
    active: Boolean((product as { active?: boolean | null }).active),
  }));

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-3xl p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-[var(--font-display)] text-3xl">Gestión de Inventario</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Administra costos, márgenes de ganancia y stock de tus productos.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <InventoryImportModal importInventoryAction={importInventoryAction} />
            <InventoryCreateModal categories={categories} createProductAction={createProductAction} />
          </div>
        </div>
      </div>

      <Card>
        <CardContent>
          {productsError ? (
            <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              No se pudo cargar inventario: {productsError.message}
            </p>
          ) : null}

          <InventoryTable
            rows={rows}
            categoryOptions={uniqueLabels(categories.map((category) => category.name).filter(Boolean))}
            updateInventoryAction={updateInventoryAction}
            deleteInventoryItemAction={deleteInventoryItemAction}
            currentPage={page}
            pageSize={pageSize}
            totalCount={totalCount}
          />
        </CardContent>
      </Card>
    </div>
  );
}
