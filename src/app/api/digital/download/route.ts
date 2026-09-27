import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getFileDelivery, getOrderByToken } from "@/lib/digital-store";

export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".zip": "application/zip",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

// Descarga de un archivo comprado: exige token + email de un pedido confirmado,
// y que el archivo pertenezca al producto (o pack) de ese pedido.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token") || "";
    const email = searchParams.get("email") || "";
    const fileId = searchParams.get("file") || "";
    const preview = searchParams.get("preview") === "1";

    if (!token || !email || !fileId) {
      return NextResponse.json({ ok: false, error: "missing_params" }, { status: 400 });
    }

    const order = await getOrderByToken(token, email);
    if (!order || order.status !== "completed") {
      return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 403 });
    }

    const delivery = await getFileDelivery(order, fileId, preview);
    if (!delivery) {
      return NextResponse.json({ ok: false, error: "file_not_found" }, { status: 404 });
    }

    if (delivery.kind === "signed") {
      return NextResponse.redirect(delivery.url);
    }

    const buffer = fs.readFileSync(delivery.absolutePath);
    const ext = path.extname(delivery.name).toLowerCase();
    const contentType = delivery.mimeType || MIME_TYPES[ext] || "application/octet-stream";
    const inline = preview && [".pdf", ".png", ".jpg", ".jpeg", ".mp4"].includes(ext);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": inline ? "inline" : `attachment; filename*=UTF-8''${encodeURIComponent(delivery.name)}`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("/api/digital/download:", error);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
