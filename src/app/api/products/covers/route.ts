import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_PRODUCT_IMAGE, getSafeProductImageSrc } from "@/lib/product-images";

type ProductCoverRow = {
  id: string;
  images: unknown;
};

function normalizeImages(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export async function GET(request: NextRequest) {
  const idsParam = String(request.nextUrl.searchParams.get("ids") || "").trim();
  if (!idsParam) {
    return NextResponse.json({ covers: {} });
  }

  const ids = Array.from(new Set(idsParam.split(",").flatMap((value) => {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  })));
  if (ids.length === 0) {
    return NextResponse.json({ covers: {} });
  }

  const supabase = createClient();
  const { data, error } = await supabase.from("products").select("id,images").in("id", ids);

  if (error) {
    return NextResponse.json({ covers: {} }, { status: 200 });
  }

  const covers: Record<string, string> = {};

  for (const row of ((data || []) as ProductCoverRow[])) {
    covers[row.id] = getSafeProductImageSrc(normalizeImages(row.images)) || DEFAULT_PRODUCT_IMAGE;
  }

  return NextResponse.json({ covers }, {
    headers: {
      "cache-control": "no-store",
    },
  });
}
