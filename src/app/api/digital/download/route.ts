import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_DIGITAL_SUPABASE_URL || "";
const serviceRoleKey = process.env.DIGITAL_SUPABASE_SECRET_KEY || "";

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

function isPreviewable(fileName: string): boolean {
  const ext = path.extname(fileName).toLowerCase();
  return [".pdf", ".png", ".jpg", ".jpeg", ".mp4"].includes(ext);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    const fileName = searchParams.get("file");
    const preview = searchParams.get("preview") === "1";

    if (!token || !email) {
      return NextResponse.json({ ok: false, error: "missing_params" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: purchase } = await supabase
      .from("digital_purchases")
      .select("id, status, download_token, product_id")
      .eq("download_token", token)
      .eq("email", email.toLowerCase().trim())
      .eq("status", "completed")
      .single();

    if (!purchase) {
      return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 403 });
    }

    const { data: view } = await supabase
      .from("digital_purchase_view")
      .select("product_slug, product_name")
      .eq("download_token", token)
      .single();

    const productSlug = view?.product_slug || "";

    if (!fileName) {
      const { data: productData } = await supabase
        .from("digital_products")
        .select("file_urls")
        .eq("slug", productSlug)
        .single();

      const files = (productData?.file_urls || []) as { name: string; description: string; type: string }[];
      return NextResponse.json({ ok: true, files });
    }

    const { data: productData } = await supabase
      .from("digital_products")
      .select("file_urls")
      .eq("slug", productSlug)
      .single();

    if (productData?.file_urls) {
      const files = productData.file_urls as { name: string; url: string }[];
      const matchedFile = files.find((f) => f.name === fileName);
      if (matchedFile?.url && matchedFile.url.startsWith("http")) {
        if (preview && isPreviewable(fileName)) {
          return NextResponse.redirect(matchedFile.url);
        }
        return NextResponse.redirect(matchedFile.url);
      }
    }

    const localPath = path.join(process.cwd(), "public", "digital", "files", productSlug, fileName);
    if (fs.existsSync(localPath)) {
      const buffer = fs.readFileSync(localPath);
      const contentType = getMimeType(fileName);
      const disposition = preview && isPreviewable(fileName) ? "inline" : `attachment; filename="${fileName}"`;
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": disposition,
          "Content-Length": String(buffer.length),
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    return NextResponse.json({ ok: false, error: "file_not_found" }, { status: 404 });
  } catch (err) {
    console.error("/api/digital/download error:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
