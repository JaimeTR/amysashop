import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { landingSamples, productSamples } from "@/lib/mock-data";
import { canonicalizeBrandName } from "@/lib/brands";
import { LandingPage, NavProduct, Product } from "@/lib/types";
import { slugifyProductName } from "@/lib/product-url";

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  resumen?: string | null;
  contenido?: string | null;
  price: number;
  price_before?: number | null;
  images: unknown;
  stock: number;
  active: boolean;
  brand?: string | null;
  gender?: string | null;
  age_group?: string | null;
  sub_brand?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  categories: { name: string }[] | { name: string } | null;
};

function resolveCategoryName(value: ProductRow["categories"]) {
  if (Array.isArray(value)) {
    return value[0]?.name ?? "Sin categoria";
  }

  if (value && typeof value === "object") {
    return value.name ?? "Sin categoria";
  }

  return "Sin categoria";
}

function normalizeImages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

function mapProductRow(row: ProductRow): Product {
  const brand = canonicalizeBrandName(row.brand ?? "");

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    summary: row.resumen ?? undefined,
    content: row.contenido ?? undefined,
    price: Number(row.price),
    priceBefore: row.price_before != null ? Number(row.price_before) : null,
    images: normalizeImages(row.images),
    category: resolveCategoryName(row.categories),
    brand: brand || (row.brand ?? undefined),
    gender: row.gender ?? undefined,
    ageGroup: row.age_group ?? undefined,
    updatedAt: row.updated_at || row.created_at || undefined,

    stock: row.stock,
    active: row.active,
  };
}

function mapNavProduct(product: Product): NavProduct {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    images: product.images,
    category: product.category,
    brand: product.brand,
    gender: product.gender,

  };
}

function normalizeLabel(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
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

const NAV_PRODUCT_LIMIT = 200;
const FULL_PRODUCT_LIMIT = 500;
const PRODUCT_SELECT =
  "id,name,description,resumen,contenido,price,price_before,images,stock,active,brand,gender,age_group,created_at,updated_at,categories(name)";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Tag de caché del catálogo público. Las acciones del admin llaman a revalidateTag(CATALOG_TAG)
// para que los cambios se vean al instante; si no, se refresca solo cada CATALOG_REVALIDATE segundos.
export const CATALOG_TAG = "catalog";
const CATALOG_REVALIDATE = 300;

// El catálogo es público: se consulta con la clave anónima y SIN cookies,
// así Next puede cachearlo entre visitas (antes se consultaba Supabase en cada request).
function createPublicClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "", {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Si la consulta falla se lanza el error para que NO quede cacheado; el fallback se aplica afuera.
const getCachedActiveProductRows = unstable_cache(
  async (): Promise<ProductRow[]> => {
    const { data, error } = await createPublicClient()
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("active", true)
      .gt("stock", 0)
      .order("created_at", { ascending: false })
      .limit(FULL_PRODUCT_LIMIT);

    if (error || !data) {
      throw new Error(error?.message || "No se pudieron cargar los productos");
    }

    return data as ProductRow[];
  },
  ["catalog-active-products"],
  { revalidate: CATALOG_REVALIDATE, tags: [CATALOG_TAG] }
);

const getCachedCategoryRows = unstable_cache(
  async () => {
    const { data, error } = await createPublicClient().from("categories").select("id,name").order("name", { ascending: true });
    if (error || !data) {
      throw new Error(error?.message || "No se pudieron cargar las categorías");
    }
    return data as Array<{ id: string; name: string | null }>;
  },
  ["catalog-categories"],
  { revalidate: CATALOG_REVALIDATE, tags: [CATALOG_TAG] }
);

const loadActiveProducts = cache(async (): Promise<Product[] | null> => {
  try {
    const rows = await getCachedActiveProductRows();
    return rows.map(mapProductRow);
  } catch {
    return null;
  }
});

export const getActiveProducts = cache(async (): Promise<Product[]> => {
  const products = await loadActiveProducts();
  return products && products.length > 0 ? products : productSamples;
});

export const getActiveProductsForNav = cache(async (): Promise<NavProduct[]> => {
  const products = await getActiveProducts();
  return products.slice(0, NAV_PRODUCT_LIMIT).map(mapNavProduct);
});

export const getRegisteredCategories = cache(async (): Promise<string[]> => {
  const data = await getCachedCategoryRows().catch(() => null);

  if (data) {
    const categories = uniqueLabels(
      data.flatMap((item) => {
        const name = String(item.name || "").trim();
        return name ? [name] : [];
      })
    );

    if (categories.length > 0) {
      return categories;
    }
  }

  return uniqueLabels(productSamples.flatMap((item) => item.category ? [item.category] : []));
});

export const getProductsPage = cache(async (
  page = 1,
  pageSize = 20
): Promise<{ products: Product[]; total: number }> => {
  const start = Math.max(0, (page - 1) * pageSize);
  const products = await loadActiveProducts();

  if (!products) {
    const sliced = productSamples.slice(start, start + pageSize);
    return { products: sliced, total: productSamples.length };
  }

  return { products: products.slice(start, start + pageSize), total: products.length };
});

export const getProductById = cache(async (id: string): Promise<Product | null> => {
  // Evita una consulta inútil cuando llega un slug (p. ej. /producto/mini-chic-desenredante).
  if (!UUID_REGEX.test(id)) {
    return productSamples.find((item) => item.id === id) ?? null;
  }

  const products = await loadActiveProducts();
  if (products) {
    return products.find((item) => item.id === id) ?? null;
  }

  return productSamples.find((item) => item.id === id) ?? null;
});

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const normalizedSlug = String(slug || "").trim().toLowerCase();
  const products = await loadActiveProducts();

  if (products) {
    return products.find((p) => slugifyProductName(p.name) === normalizedSlug) ?? null;
  }

  return productSamples.find((item) => slugifyProductName(item.name) === normalizedSlug) ?? null;
});

export const getActiveLandingBySlug = cache(async (slug: string): Promise<LandingPage | null> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("landing_pages")
    .select("id,slug,title,image,product_id,active")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (!error && data) {
    return {
      id: data.id,
      slug: data.slug,
      title: data.title,
      image: data.image,
      productId: data.product_id,
      active: data.active,
    };
  }

  return landingSamples.find((item) => item.slug === slug && item.active) ?? null;
});

// Chequeo de disponibilidad cacheado 60 s (antes era una consulta extra en cada visita).
// Solo un error de cuota/restricción de Supabase activa la pantalla de mantenimiento.
const getCachedSupabaseStatus = unstable_cache(
  async () => {
    const { error } = await createPublicClient().from("categories").select("id", { count: "exact", head: true });
    if (error) {
      const msg = String(error.message || "").toLowerCase();
      if (msg.includes("restricted") || msg.includes("quota") || msg.includes("402")) {
        return false;
      }
      throw new Error(error.message);
    }
    return true;
  },
  ["supabase-status"],
  { revalidate: 60 }
);

export async function checkSupabase(): Promise<boolean> {
  try {
    return await getCachedSupabaseStatus();
  } catch {
    return false;
  }
}
