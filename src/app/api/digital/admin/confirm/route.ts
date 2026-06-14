import { NextResponse } from "next/server";
import { checkDigitalAdmin } from "@/lib/digital-admin";
import { confirmPurchase } from "@/lib/digital-actions";
import { sendPurchaseConfirmationEmail } from "@/lib/email";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_DIGITAL_SUPABASE_URL || "";
const serviceRoleKey = process.env.DIGITAL_SUPABASE_SECRET_KEY || "";

export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const isAdmin = await checkDigitalAdmin(token);
    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const { purchase_id } = await req.json();

    if (!purchase_id) {
      return NextResponse.json({ ok: false, error: "missing_purchase_id" }, { status: 400 });
    }

    const result = await confirmPurchase(purchase_id);

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    const purchase = result.purchase;

    if (purchase.download_token) {
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      const { data: product } = await supabase
        .from("digital_products")
        .select("file_urls")
        .eq("slug", purchase.product_slug)
        .single();

      const files = (product?.file_urls as { name: string; description: string }[] | undefined)?.map((f) => ({
        name: f.name,
        description: f.description,
      })) || [];

      await sendPurchaseConfirmationEmail({
        to: purchase.email,
        customerName: purchase.customer_name,
        productName: purchase.product_name || "Producto Digital",
        productSlug: purchase.product_slug || undefined,
        downloadToken: purchase.download_token,
        files,
      });
    }

    return NextResponse.json({ ok: true, purchase });
  } catch (err) {
    console.error("/api/digital/admin/confirm error:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
