import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");
  const brandId = searchParams.get("brandId");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ subcategories: [], subbrands: [] });
  }

  const supabase = createClient(supabaseUrl, anonKey);
  const results: { subcategories: any[]; subbrands: any[] } = {
    subcategories: [],
    subbrands: [],
  };

  // Obtener subcategorías si se pasa categoryId
  if (categoryId) {
    const { data } = await supabase
      .from("sub_categories")
      .select("id,name")
      .eq("category_id", categoryId)
      .order("name", { ascending: true });
    results.subcategories = data || [];
  }

  // Obtener submarcas si se pasa brandId
  if (brandId) {
    const { data } = await supabase
      .from("sub_brands")
      .select("id,name")
      .eq("brand_id", brandId)
      .order("name", { ascending: true });
    results.subbrands = data || [];
  }

  return NextResponse.json(results);
}
