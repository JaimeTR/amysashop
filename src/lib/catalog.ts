import { cache } from "react";
import { landingSamples, productSamples } from "@/lib/mock-data";
import { canonicalizeBrandName } from "@/lib/brands";
import { createClient } from "@/lib/supabase/server";
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

const NAV_PRODUCT_LIMIT = 200;
const FULL_PRODUCT_LIMIT = 500;

export const getActiveProducts = cache(async (): Promise<Product[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id,name,description,resumen,contenido,price,price_before,images,stock,active,brand,gender,age_group,categories(name)")
    .eq("active", true)
    .gt("stock", 0)
    .order("created_at", { ascending: false })
    .limit(FULL_PRODUCT_LIMIT);

  if (error || !data || data.length === 0) {
    return productSamples;
  }

  return (data as ProductRow[]).map(mapProductRow);
});

export const getActiveProductsForNav = cache(async (): Promise<NavProduct[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id,name,description,price,images,brand,gender,categories(name)")
    .eq("active", true)
    .gt("stock", 0)
    .order("created_at", { ascending: false })
    .limit(NAV_PRODUCT_LIMIT);

  if (error || !data || data.length === 0) {
    return productSamples.map(mapNavProduct);
  }

  return (data as ProductRow[]).map(mapProductRow).map(mapNavProduct);
});

export const getRegisteredCategories = cache(async (): Promise<string[]> => {
  const supabase = createClient();
  const { data, error } = await supabase.from("categories").select("id,name").order("name", { ascending: true });

  if (!error && data) {
    const categories = uniqueLabels(
      (data as Array<{ id: string; name: string | null }>).flatMap((item) => {
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
  const supabase = createClient();
  const start = Math.max(0, (page - 1) * pageSize);
  const end = start + pageSize - 1;

  const { data, error, count } = await supabase
    .from("products")
    .select("id,name,description,resumen,contenido,price,price_before,images,stock,active,brand,gender,age_group,categories(name)", { count: "exact" })
    .eq("active", true)
    .gt("stock", 0)
    .order("created_at", { ascending: false })
    .range(start, end);

  if (error || !data) {
    const startSample = start;
    const sliced = productSamples.slice(startSample, startSample + pageSize);
    return { products: sliced, total: productSamples.length };
  }

  const products = (data as ProductRow[]).map(mapProductRow);
  return { products, total: typeof count === "number" ? count : products.length };
});

export const getProductById = cache(async (id: string): Promise<Product | null> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id,name,description,resumen,contenido,price,price_before,images,stock,active,brand,gender,age_group,categories(name)")
    .eq("id", id)
    .eq("active", true)
    .gt("stock", 0)
    .maybeSingle();

  if (!error && data) {
    try {
      return mapProductRow(data as ProductRow);
    } catch (err) {
      console.error("Error mapeando producto", { id, error: err, row: data });
      return null;
    }
  }

  return productSamples.find((item) => item.id === id) ?? null;
});

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id,name,description,resumen,contenido,price,price_before,images,stock,active,brand,gender,age_group,categories(name)")
    .eq("active", true)
    .gt("stock", 0)
    .order("created_at", { ascending: false })
    .limit(FULL_PRODUCT_LIMIT);

  if (!error && data) {
    const products = (data as ProductRow[]).map(mapProductRow);
    const normalizedSlug = String(slug || "").trim().toLowerCase();
    const matched = products.find((p) => slugifyProductName(p.name) === normalizedSlug);
    return matched ?? null;
  }

  const normalizedSlug = String(slug || "").trim().toLowerCase();
  return productSamples.find((item) => slugifyProductName(item.name) === normalizedSlug) ?? null;
});

export const getActiveLandingBySlug = cache(async (slug: string): Promise<LandingPage | null> => {
  const supabase = createClient();
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

export async function checkSupabase(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("categories").select("id", { count: "exact", head: true });
    if (error) {
      const msg = String(error.message || "").toLowerCase();
      if (msg.includes("restricted") || msg.includes("quota") || msg.includes("402")) {
        return false;
      }
    }
    return !error;
  } catch {
    return false;
  }
}
