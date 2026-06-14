import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 300;

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ categories: [] });
  }

  const supabase = createClient(supabaseUrl, anonKey);

  const { data, error } = await supabase
    .from("categories")
    .select("id,name")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ categories: [] });
  }

  const categories = (data || []).map((row) => String(row.name || "").trim()).filter(Boolean);

  return NextResponse.json(
    { categories },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
