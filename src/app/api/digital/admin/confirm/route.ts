import { NextResponse } from "next/server";
import { checkDigitalAdmin } from "@/lib/digital-admin";
import { confirmPurchase } from "@/lib/digital-actions";
import { sendPurchaseConfirmationEmail } from "@/lib/email";
import { createDigitalServiceRoleClient } from "@/lib/supabase/digital-service-role";

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

    let emailSent = false;

    if (purchase.download_token) {
      const supabase = createDigitalServiceRoleClient();
      if (!supabase) { console.error("Service role client not available"); return NextResponse.json({ ok: true, purchase, email_sent: false }); }
      const { data: product } = await supabase
        .from("digital_products")
        .select("file_urls")
        .eq("slug", purchase.product_slug)
        .single();

      const files = (product?.file_urls as { name: string; description: string }[] | undefined)?.map((f) => ({
        name: f.name,
        description: f.description,
      })) || [];

      const emailResult = await sendPurchaseConfirmationEmail({
        to: purchase.email,
        customerName: purchase.customer_name,
        productName: purchase.product_name || "Producto Digital",
        productSlug: purchase.product_slug || undefined,
        downloadToken: purchase.download_token,
        files,
      });

      emailSent = emailResult.ok;
      console.log("Email result:", emailResult);
    }

    return NextResponse.json({ ok: true, purchase, email_sent: emailSent });
  } catch (err) {
    console.error("/api/digital/admin/confirm error:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
