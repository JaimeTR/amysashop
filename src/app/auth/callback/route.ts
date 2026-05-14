import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextPath = searchParams.get("next") || "/perfil";

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  const safeNextPath = nextPath.startsWith("/") ? nextPath : "/perfil";
  return NextResponse.redirect(`${origin}${safeNextPath}`);
}
