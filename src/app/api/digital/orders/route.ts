import { NextResponse } from "next/server";
import { createDigitalOrder } from "@/lib/digital-store";
import type { DigitalPaymentMethod } from "@/lib/digital-types";

const PUBLIC_METHODS: DigitalPaymentMethod[] = ["yape", "plin", "transferencia", "whatsapp"];

// Crea un pedido pendiente. El pago se confirma manualmente desde /admin/digitales.
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Campo trampa para bots: los humanos no lo ven ni lo llenan.
    if (body.website) {
      return NextResponse.json({ ok: true, orderId: null });
    }

    const productId = String(body.productId || "").trim();
    const customerName = String(body.customerName || "").trim().slice(0, 120);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 160);
    const phone = String(body.phone || "").trim().slice(0, 30);
    const paymentMethod = String(body.paymentMethod || "") as DigitalPaymentMethod;
    const paymentReference = String(body.paymentReference || "").trim().slice(0, 120);

    if (!/^[0-9a-f-]{36}$/i.test(productId)) {
      return NextResponse.json({ ok: false, error: "Producto inválido" }, { status: 400 });
    }
    if (customerName.length < 2) {
      return NextResponse.json({ ok: false, error: "Ingresa tu nombre" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Ingresa un correo válido: ahí te enviaremos la descarga" }, { status: 400 });
    }
    if (!PUBLIC_METHODS.includes(paymentMethod)) {
      return NextResponse.json({ ok: false, error: "Elige un método de pago" }, { status: 400 });
    }

    const result = await createDigitalOrder({
      productId,
      customerName,
      email,
      phone,
      paymentMethod,
      paymentReference,
      source: paymentMethod === "whatsapp" ? "whatsapp" : "web",
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, orderId: result.order.id, code: result.order.code });
  } catch (error) {
    console.error("/api/digital/orders:", error);
    return NextResponse.json({ ok: false, error: "No se pudo registrar el pedido" }, { status: 500 });
  }
}
