import { NextResponse } from "next/server";
import { getPurchasesByEmail } from "@/lib/digital-actions";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    const purchases = await getPurchasesByEmail(email.trim().toLowerCase());

    return NextResponse.json({ ok: true, purchases });
  } catch (err) {
    console.error("/api/digital/verify error:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
