import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { FALLBACK_AGE_GROUPS, FALLBACK_GENDERS, normalizeTaxonomyOptions } from "@/lib/taxonomies";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ genders: FALLBACK_GENDERS, ageGroups: FALLBACK_AGE_GROUPS });
  }

  const supabase = createClient(supabaseUrl, anonKey);

  const [gendersResult, ageGroupsResult] = await Promise.all([
    supabase.from("genders").select("name").order("name", { ascending: true }),
    supabase.from("age_groups").select("name").order("name", { ascending: true }),
  ]);

  const genders = normalizeTaxonomyOptions(
    (gendersResult.data || []).map((row) => String(row.name || "")),
    FALLBACK_GENDERS
  );
  const ageGroups = normalizeTaxonomyOptions(
    (ageGroupsResult.data || []).map((row) => String(row.name || "")),
    FALLBACK_AGE_GROUPS
  );

  return NextResponse.json({ genders, ageGroups });
}
