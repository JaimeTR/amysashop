import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type RegisterOrderBody = {
  userId?: string | null;
  channel?: string;
  paymentMethod?: string;
  paymentConfirmed?: boolean;
  paymentReference?: string;
  deliveryMethod?: string;
  shippingCost?: number;
  discountAmount?: number;
  couponCode?: string | null;
  subtotal?: number;
  total?: number;
  customer?: {
    name?: string;
    documentType?: string;
    documentNumber?: string;
    email?: string;
    phone?: string;
    department?: string;
    province?: string;
    district?: string;
    address?: string;
    note?: string;
  };
  items?: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    variantLabel?: string;
    personalizationText?: string;
  }>;
};

function sanitizeString(value: unknown) {
  return String(value || "").trim();
}

function isMissingColumnError(message: string) {
  return /column .* does not exist/i.test(message) || /could not find the '.*' column of '.*' in the schema cache/i.test(message);
}

export async function POST(request: NextRequest) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json(
      { error: "Faltan variables SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SECRET_KEY" },
      { status: 500 }
    );
  }

  let body: RegisterOrderBody;

  try {
    body = (await request.json()) as RegisterOrderBody;
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "No hay productos para registrar" }, { status: 400 });
  }

  const total = items.reduce((acc, item) => acc + Number(item.price || 0) * Number(item.quantity || 0), 0);
  const subtotal = Number(body.subtotal || total);
  const shippingCost = Math.max(0, Number(body.shippingCost || 0));
  const discountAmount = Math.max(0, Number(body.discountAmount || 0));
  const totalWithCharges = Number(body.total || Math.max(0, subtotal - discountAmount + shippingCost));
  const channel = sanitizeString(body.channel || "web").toLowerCase();
  const paymentMethod = sanitizeString(body.paymentMethod || "pendiente").toLowerCase();
  const paymentConfirmed = Boolean(body.paymentConfirmed);
  const paymentReference = sanitizeString(body.paymentReference);
  const deliveryMethod = sanitizeString(body.deliveryMethod || "shipping_lima").toLowerCase();
  const couponCode = sanitizeString(body.couponCode || "").toUpperCase() || null;
  const paymentStatus = paymentConfirmed ? "completo" : "pendiente";
  const department = sanitizeString(body.customer?.department);
  const province = sanitizeString(body.customer?.province);
  const district = sanitizeString(body.customer?.district);
  const address = sanitizeString(body.customer?.address);
  const fullAddress = [department, province, district, address].filter(Boolean).join(" - ");

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const payloadFull: Record<string, unknown> = {
    user_id: body.userId || null,
    status: "confirmado",
    total: totalWithCharges,
    total_amount: totalWithCharges,
    subtotal_amount: subtotal,
    shipping_amount: shippingCost,
    discount_amount: discountAmount,
    coupon_code: couponCode,
    channel,
    payment_method: paymentMethod,
    delivery_method: deliveryMethod,
    payment_status: paymentStatus,
    payment_reference: paymentReference || null,
    customer_name: sanitizeString(body.customer?.name),
    customer_document_type: sanitizeString(body.customer?.documentType).toLowerCase() || null,
    customer_document_number: sanitizeString(body.customer?.documentNumber),
    customer_email: sanitizeString(body.customer?.email),
    customer_phone: sanitizeString(body.customer?.phone),
    customer_address: fullAddress,
    customer_note: sanitizeString(body.customer?.note),
    items_json: items,
  };

  const payloadCandidates: Array<Record<string, unknown>> = [
    payloadFull,
    {
      user_id: payloadFull.user_id,
      status: payloadFull.status,
      total: payloadFull.total,
      total_amount: payloadFull.total_amount,
      channel: payloadFull.channel,
      payment_method: payloadFull.payment_method,
      payment_status: payloadFull.payment_status,
      customer_name: payloadFull.customer_name,
    },
    {
      user_id: payloadFull.user_id,
      status: payloadFull.status,
      total: payloadFull.total,
      total_amount: payloadFull.total_amount,
      customer_name: payloadFull.customer_name,
      customer_email: payloadFull.customer_email,
      customer_phone: payloadFull.customer_phone,
      customer_address: payloadFull.customer_address,
      customer_note: payloadFull.customer_note,
    },
    {
      user_id: payloadFull.user_id,
      status: payloadFull.status,
      total: payloadFull.total,
      total_amount: payloadFull.total_amount,
      customer_name: payloadFull.customer_name,
    },
    {
      user_id: payloadFull.user_id,
      status: payloadFull.status,
      total: payloadFull.total,
      customer_name: payloadFull.customer_name,
    },
    {
      user_id: payloadFull.user_id,
      status: payloadFull.status,
      total_amount: payloadFull.total_amount,
      customer_name: payloadFull.customer_name,
    },
  ];

  let lastError = "";

  for (const payload of payloadCandidates) {
    const { data, error } = await supabase.from("orders").insert(payload).select("id").maybeSingle();

    if (!error) {
      return NextResponse.json({ success: true, orderId: data?.id || null, total: totalWithCharges });
    }

    lastError = error.message;

    if (!isMissingColumnError(error.message)) {
      break;
    }
  }

  return NextResponse.json({ error: lastError || "No se pudo registrar el pedido" }, { status: 500 });
}
