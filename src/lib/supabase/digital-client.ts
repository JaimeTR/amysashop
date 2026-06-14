"use client";

import { createClient } from "@supabase/supabase-js";

export function createDigitalClient() {
  return createClient(
    process.env.NEXT_PUBLIC_DIGITAL_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_DIGITAL_SUPABASE_ANON_KEY!
  );
}
