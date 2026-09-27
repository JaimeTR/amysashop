import { NextResponse } from "next/server";
import { getDeliverableFiles, listOrdersByEmail } from "@/lib/digital-store";

// "Mis descargas": con solo el email se ve el estado de los pedidos; los archivos
// se desbloquean únicamente con el token del enlace enviado por correo.
export async function POST(req: Request) {
  try {
    const { email, token } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    const orders = await listOrdersByEmail(email);

    const purchases = await Promise.all(
      orders.map(async (order) => {
        const unlocked = typeof token === "string" && token.length > 0 && order.downloadToken === token && order.status === "completed";
        const files = unlocked ? await getDeliverableFiles(order.productId) : undefined;
        return {
          id: order.id,
          code: order.code,
          productName: order.productName,
          productSlug: order.productSlug,
          status: order.status,
          createdAt: order.createdAt,
          confirmedAt: order.confirmedAt,
          downloadToken: unlocked ? order.downloadToken : null,
          files: files?.map(({ id, name, description, mimeType, sizeBytes, productName }) => ({
            id,
            name,
            description,
            mimeType,
            sizeBytes,
            productName,
          })),
        };
      })
    );

    return NextResponse.json({ ok: true, purchases });
  } catch (error) {
    console.error("/api/digital/verify:", error);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
