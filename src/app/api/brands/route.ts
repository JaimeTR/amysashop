import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Logos de marcas hardcodeados (estos se pueden mover a BD si es necesario)
const BRAND_LOGOS: Record<string, string> = {
  "AMYSA": "/logos/amysa%20shop.png",
  "CYZONE": "/logos/cyzone.jpg",
  "ESIKA": "/logos/esika.png",
  "LBEL": "/logos/lbel.png",
  "NATURA": "/logos/natura.png",
  "YANBAL": "/logos/yambal.png",
};

const BRAND_COLORS: Record<string, string> = {
  "AMYSA": "#E74C3C",
  "CYZONE": "#FF6B6B",
  "ESIKA": "#4ECDC4",
  "LBEL": "#FFB700",
  "NATURA": "#2ECC71",
  "YANBAL": "#9B59B6",
};

export type BrandResponse = {
  id: string;
  name: string;
  logo?: string;
  color?: string;
};

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ brands: [] });
  }

  const supabase = createClient(supabaseUrl, anonKey);

  const { data, error } = await supabase
    .from("brands")
    .select("id,name")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ brands: [] });
  }

  const brands: BrandResponse[] = (data || []).map((row) => {
    const id = String(row.id || "").trim().toLowerCase();
    const name = String(row.name || "").trim();
    return {
      id,
      name,
      logo: BRAND_LOGOS[name] || undefined,
      color: BRAND_COLORS[name] || undefined,
    };
  });

  return NextResponse.json({ brands });
}
