import { NextResponse } from "next/server";
import { getPurchasesByEmail } from "@/lib/digital-actions";

export async function POST(req: Request) {
  try {
    const { email, token } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    const purchases = await getPurchasesByEmail(email.trim().toLowerCase());

    // Con solo el email se muestra el estado de las compras; el acceso a los archivos
    // requiere el token del enlace enviado por correo al confirmar el pago.
    const safePurchases = purchases.map((p) => {
      const unlocked = typeof token === "string" && token.length > 0 && p.download_token === token;
      const files = unlocked
        ? (p.files || []).map(({ name, description, type }) => ({ name, description, type, url: "" }))
        : undefined;
      return { ...p, download_token: unlocked ? p.download_token : null, files };
    });

    return NextResponse.json({ ok: true, purchases: safePurchases });
  } catch (err) {
    console.error("/api/digital/verify error:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
