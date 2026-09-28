import { NextResponse } from "next/server";
import { sendComplaintEmails } from "@/lib/email";
import { LEGAL_INFO } from "@/lib/legal-info";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

function text(value: unknown, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

// Registra una hoja del Libro de Reclamaciones y envía la copia al consumidor por correo.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.website) return NextResponse.json({ ok: true, code: null }); // trampa para bots

    const data = {
      consumer_name: text(body.consumerName, 150),
      document_type: text(body.documentType, 20) || "DNI",
      document_number: text(body.documentNumber, 20),
      address: text(body.address, 250),
      phone: text(body.phone, 30) || null,
      email: text(body.email, 160).toLowerCase(),
      is_minor: Boolean(body.isMinor),
      guardian_name: text(body.guardianName, 150) || null,
      item_type: body.itemType === "servicio" ? "servicio" : "producto",
      item_description: text(body.itemDescription, 500),
      amount: Number.isFinite(Number(body.amount)) && Number(body.amount) > 0 ? Math.round(Number(body.amount) * 100) / 100 : null,
      order_reference: text(body.orderReference, 60) || null,
      complaint_type: body.complaintType === "queja" ? "queja" : "reclamo",
      detail: text(body.detail, 3000),
      consumer_request: text(body.consumerRequest, 1500),
    };

    const missing =
      data.consumer_name.length < 3 ||
      data.document_number.length < 6 ||
      data.address.length < 5 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
      data.item_description.length < 3 ||
      data.detail.length < 10 ||
      data.consumer_request.length < 3 ||
      (data.is_minor && !data.guardian_name) ||
      body.accepted !== true;
    if (missing) {
      return NextResponse.json({ ok: false, error: "Completa todos los campos obligatorios." }, { status: 400 });
    }

    const db = createServiceRoleClient();
    if (!db) {
      return NextResponse.json({ ok: false, error: "Servicio no disponible. Escríbenos por WhatsApp." }, { status: 503 });
    }

    const { data: saved, error } = await db.from("complaints").insert(data).select("code,created_at").single();
    if (error || !saved) {
      console.error("libro-reclamaciones:", error);
      return NextResponse.json({ ok: false, error: "No se pudo registrar tu reclamo. Intenta nuevamente." }, { status: 500 });
    }

    const createdAt = new Date(saved.created_at).toLocaleString("es-PE", { timeZone: "America/Lima" });
    const email = await sendComplaintEmails({
      consumerEmail: data.email,
      businessEmail: LEGAL_INFO.email || undefined,
      code: saved.code,
      rows: [
        ["Hoja N.°", saved.code],
        ["Fecha", createdAt],
        ["Proveedor", `${LEGAL_INFO.legalName || LEGAL_INFO.tradeName}${LEGAL_INFO.ruc ? ` · RUC ${LEGAL_INFO.ruc}` : ""}`],
        ["Consumidor", data.consumer_name],
        ["Documento", `${data.document_type} ${data.document_number}`],
        ["Domicilio", data.address],
        ["Teléfono", data.phone || "-"],
        ["Correo", data.email],
        ...(data.is_minor ? ([["Padre, madre o apoderado", data.guardian_name || "-"]] as Array<[string, string]>) : []),
        ["Bien contratado", `${data.item_type === "servicio" ? "Servicio" : "Producto"}: ${data.item_description}`],
        ["Monto reclamado", data.amount != null ? `S/ ${data.amount.toFixed(2)}` : "-"],
        ["N.° de pedido", data.order_reference || "-"],
        ["Tipo", data.complaint_type === "queja" ? "Queja" : "Reclamo"],
        ["Detalle", data.detail],
        ["Pedido del consumidor", data.consumer_request],
      ],
    });

    return NextResponse.json({ ok: true, code: saved.code, createdAt, emailSent: email.ok });
  } catch (error) {
    console.error("libro-reclamaciones:", error);
    return NextResponse.json({ ok: false, error: "No se pudo registrar tu reclamo." }, { status: 500 });
  }
}
