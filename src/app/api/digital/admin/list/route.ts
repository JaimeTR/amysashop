import { NextResponse } from "next/server";
import { checkDigitalAdmin } from "@/lib/digital-admin";
import { getAllPurchases } from "@/lib/digital-actions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const isAdmin = await checkDigitalAdmin(token);
    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const purchases = await getAllPurchases();
    return NextResponse.json({ ok: true, purchases });
  } catch (err) {
    console.error("/api/digital/admin/list error:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
