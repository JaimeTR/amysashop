import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json(
      { error: "Missing environment variables: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { userId, email } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: "userId and email required" },
        { status: 400 }
      );
    }

    // Usa el service role client (evita RLS policies)
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Insert o update con bypass de RLS
    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        nombre: "Admin AMYSA",
        is_admin: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
