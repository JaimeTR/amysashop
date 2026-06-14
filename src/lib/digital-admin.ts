import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_DIGITAL_SUPABASE_URL || "";
const serviceRoleKey = process.env.DIGITAL_SUPABASE_SECRET_KEY || "";

export async function checkDigitalAdmin(token?: string): Promise<boolean> {
  try {
    if (!token) return false;

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) return false;

    const allowedEmail = (process.env.ADMIN_ALLOWED_EMAIL || "").trim().toLowerCase();
    const userEmail = (user.email || "").trim().toLowerCase();

    return allowedEmail ? userEmail === allowedEmail : false;
  } catch {
    return false;
  }
}
