import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_DIGITAL_SUPABASE_URL || "";
const serviceRoleKey = process.env.DIGITAL_SUPABASE_SECRET_KEY || "";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    const fileName = searchParams.get("file");

    if (!token || !email) {
      return NextResponse.json({ ok: false, error: "missing_params" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: purchases } = await supabase
      .from("digital_purchases")
      .select("id, status, download_token")
      .eq("download_token", token)
      .eq("email", email.toLowerCase().trim())
      .eq("status", "completed")
      .single();

    if (!purchases) {
      return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 403 });
    }

    if (fileName) {
      const { data: product } = await supabase
        .from("digital_purchase_view")
        .select("product_slug")
        .eq("download_token", token)
        .single();

      if (product?.product_slug) {
        const { data: productData } = await supabase
          .from("digital_products")
          .select("file_urls")
          .eq("slug", product.product_slug)
          .single();

        if (productData?.file_urls) {
          const files = productData.file_urls as { name: string; url: string }[];
          const matchedFile = files.find((f) => f.name === fileName);
          if (matchedFile?.url) {
            return NextResponse.redirect(matchedFile.url);
          }

          const localPath = path.join(process.cwd(), "public", "digital", "files", product.product_slug, fileName);
          if (fs.existsSync(localPath)) {
            const buffer = fs.readFileSync(localPath);
            return new NextResponse(buffer, {
              headers: {
                "Content-Type": "application/octet-stream",
                "Content-Disposition": `attachment; filename="${fileName}"`,
              },
            });
          }
        }
      }
    }

    return NextResponse.json({ ok: true, message: "valid_token" });
  } catch (err) {
    console.error("/api/digital/download error:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
