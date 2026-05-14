"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@/lib/auth";

export async function signOutAction() {
  const session = await auth();
  if (!session) redirect("/login");

  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}
