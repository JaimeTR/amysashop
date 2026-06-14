import { NextResponse } from "next/server";
import { createPurchase } from "@/lib/digital-actions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, customer_name, product_id, payment_method, amount, currency } = body;

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    if (!customer_name || typeof customer_name !== "string" || customer_name.trim().length < 2) {
      return NextResponse.json({ ok: false, error: "invalid_name" }, { status: 400 });
    }

    if (!product_id || !payment_method || !amount || !currency) {
      return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
    }

    if (!["paypal", "culqi"].includes(payment_method)) {
      return NextResponse.json({ ok: false, error: "invalid_payment_method" }, { status: 400 });
    }

    const result = await createPurchase({
      email: email.trim().toLowerCase(),
      customer_name: customer_name.trim(),
      product_id,
      payment_method,
      amount: Number(amount),
      currency: currency === "PEN" ? "PEN" : "USD",
    });

    if ("error" in result) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, purchase_id: result.id });
  } catch (err) {
    console.error("/api/digital/purchase error:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
