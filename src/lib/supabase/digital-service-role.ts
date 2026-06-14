import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createDigitalServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_DIGITAL_SUPABASE_URL || "";
  const serviceRoleKey = process.env.DIGITAL_SUPABASE_SECRET_KEY || "";

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
