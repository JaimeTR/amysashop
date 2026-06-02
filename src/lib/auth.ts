import { createClient } from "@/lib/supabase/server";

export async function auth() {
  const supabase = createClient();
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session ?? null;
  } catch {
    return null;
  }
}
