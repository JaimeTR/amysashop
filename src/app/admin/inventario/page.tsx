import { revalidatePath } from "next/cache";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { InventoryTable } from "../../../components/admin/inventory-table";
import { requireAdminUser } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const metadata = {
  title: "Gestión de Inventario | Admin",
  description: "Gestiona stock y precios de tus productos",
};

type InventoryRow = {
  id: string;
  name: string;
  sku?: string;
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
  createdAt?: string;
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
    return "Hombre";
  }

  if (["mujeres", "mujer", "female", "femenino", "woman"].includes(normalized)) {
    return "Mujer";
  }

  if (normalized.startsWith("uni")) {
    return "Unisex";
  }

  if (normalized.startsWith("niñ") || normalized.startsWith("nin") || normalized.includes("child")) {
    return "Unisex";
  }

  return String(value || "").trim();
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

  const active = ["true", "on", "1"].includes(String(formData.get("active") || "").trim().toLowerCase());
  const stock = Math.max(0, Math.trunc(toNumber(formData.get("stock"), 0)));
  const cost = Math.max(0, toNumber(formData.get("cost"), 0));
  const operatingCost = Math.max(0, toNumber(formData.get("operating_cost"), 0));
  const profitMargin = Math.max(0, toNumber(formData.get("profit_margin"), 0));

  const db = createServiceRoleClient();
  if (!db) {
    throw new Error("Falta configurar SUPABASE_SECRET_KEY o SUPABASE_SERVICE_ROLE_KEY.");
  }

  const payload = {
    active,
    stock,
    cost,
    operating_cost: operatingCost,
    profit_margin: profitMargin,
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

export default async function InventarioPage({ searchParams }: { searchParams?: { page?: string; q?: string } }) {
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
  const searchQuery = String(searchParams?.q || "").trim().toLowerCase();
  const pageSize = 20;
  const start = Math.max(0, (page - 1) * pageSize);
  const end = start + pageSize - 1;

  let productsQuery = db
    .from("products")
    .select("id, name, sku, gender, age_group, brand, stock, cost, operating_cost, profit_margin, price, price_before, images, active, created_at, categories(name)", { count: "exact" });

  // Aplicar búsqueda en servidor si existe
  if (searchQuery) {
    productsQuery = productsQuery.or(
      `name.ilike.%${searchQuery}%,code.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`
    );
  }

  let { data: products, error: productsError, count: productsCount } = await productsQuery
    .order("created_at", { ascending: false })
    .range(start, end);

  if (productsError && (isMissingColumnError(productsError, "price_before") || isMissingColumnError(productsError, "age_group"))) {
    const fallbackNoPriceBefore = await db
      .from("products")
      .select("id, name, sku, gender, brand, stock, cost, operating_cost, profit_margin, price, images, active, created_at, categories(name)", { count: "exact" })
      .order("created_at", { ascending: false })
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
      .select("id, name, sku, gender, age_group, brand, stock, price, images, active, created_at, categories(name)", { count: "exact" })
      .order("created_at", { ascending: false })
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
    sku: String((product as { sku?: string | null }).sku || "") || undefined,
    gender: String((product as { gender?: string | null }).gender || "") || undefined,
    ageGroup: String((product as { age_group?: string | null }).age_group || "") || undefined,
    brand: String((product as { brand?: string | null }).brand || "") || undefined,
    createdAt: String((product as { created_at?: string | null }).created_at || "") || undefined,
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
              Administra stock, costos y precios de tus productos.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/productos"
              className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground"
            >
              Agregar nuevo producto
            </Link>
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
            currentPage={page}
            pageSize={pageSize}
            totalCount={totalCount}
            initialSearchTerm={searchQuery}
          />
        </CardContent>
      </Card>
    </div>
  );
}
