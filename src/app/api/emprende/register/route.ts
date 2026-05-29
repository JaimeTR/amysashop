import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

function safeText(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function parseNumber(value: FormDataEntryValue | null) {
  const parsed = Number(String(value || "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function getSaleErrorMessage(error: { code?: string | null; message?: string | null; details?: string | null } | null) {
  const code = String(error?.code || "");
  const message = String(error?.message || "");
  const details = String(error?.details || "");

  if (code === "P0001" || /insufficient stock/i.test(message) || /insufficient stock/i.test(details)) {
    return "Stock insuficiente para uno de los productos";
  }

  if (code === "23503") {
    return "No se pudo registrar una de las ventas";
  }

  return "No se pudo registrar una de las ventas";
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const serviceClient = createServiceRoleClient();

    if (!serviceClient) {
      return NextResponse.json({ error: "Falta configuracion de SUPABASE_SECRET_KEY" }, { status: 500 });
    }

    const salespersonIdFromForm = safeText(formData.get("salespersonId"));
    const clientProfileId = safeText(formData.get("clientProfileId"));
    const customerName = safeText(formData.get("customerName"));
    const customerEmail = safeText(formData.get("customerEmail"));
    const customerPhone = safeText(formData.get("customerPhone"));
    const notes = safeText(formData.get("notes"));
    const paymentStatus = safeText(formData.get("paymentStatus")).toLowerCase();
    const paymentReceivedInput = parseNumber(formData.get("paymentReceived"));
    const saleLinesRaw = safeText(formData.get("saleLines"));

    let salespersonId = salespersonIdFromForm;

    if (!salespersonId) {
      return NextResponse.json({ error: "Completa la vendedora antes de registrar la venta" }, { status: 400 });
    }

    const salespersonResult = await serviceClient
      .from("salespeople")
      .select("id,name,commission_percentage")
      .eq("id", salespersonId)
      .maybeSingle();

    if (salespersonResult.error || !salespersonResult.data) {
      return NextResponse.json({ error: "No se encontro la vendedora seleccionada" }, { status: 400 });
    }

    const commissionPercentage = Number(salespersonResult.data.commission_percentage || 0);
    const normalizedPaymentStatus = paymentStatus === "completed" || paymentStatus === "partial" ? paymentStatus : "pending";
    const commissionStatus = normalizedPaymentStatus === "completed" ? "approved" : "pending";

    const parsedSaleLines = (() => {
      if (!saleLinesRaw) {
        const fallbackProductId = safeText(formData.get("productId"));
        const fallbackQuantity = Math.max(1, Math.trunc(parseNumber(formData.get("quantity"))));

        return fallbackProductId ? [{ productId: fallbackProductId, quantity: fallbackQuantity }] : [];
      }

      try {
        const parsed = JSON.parse(saleLinesRaw) as Array<{ productId?: string; quantity?: number }>;
        const normalized = parsed.map((item) => ({
          productId: safeText(item.productId || ""),
          quantity: Math.max(1, Math.trunc(Number(item.quantity || 0))),
        }));

        if (normalized.some((item) => !item.productId)) {
          return [];
        }

        return normalized;
      } catch {
        return [];
      }
    })();

    if (!parsedSaleLines.length) {
      return NextResponse.json({ error: "Agrega al menos un producto para registrar la venta" }, { status: 400 });
    }

    let externalClientId: string | null = null;

    if (!clientProfileId) {
      if (!customerName || !customerPhone) {
        return NextResponse.json({ error: "Completa los datos del cliente o selecciona uno registrado" }, { status: 400 });
      }

      const externalClientInsert = await serviceClient
        .from("external_clients")
        .insert({
          name: customerName,
          email: customerEmail || null,
          phone: customerPhone,
          salesperson_id: salespersonId,
        })
        .select("id")
        .maybeSingle();

      if (externalClientInsert.error || !externalClientInsert.data) {
        return NextResponse.json({ error: "No se pudo crear el cliente externo" }, { status: 500 });
      }

      externalClientId = externalClientInsert.data.id;
    }

    const createdSales: Array<{ saleId: string; productId: string; previousStock: number }> = [];

    for (const line of parsedSaleLines) {
      const productResult = await serviceClient
        .from("products")
        .select("id,name,stock,price")
        .eq("id", line.productId)
        .maybeSingle();

      if (productResult.error || !productResult.data) {
        for (const createdSale of createdSales.reverse()) {
          await serviceClient.from("sales_commissions").delete().eq("sale_id", createdSale.saleId);
          await serviceClient.from("sales").delete().eq("id", createdSale.saleId);
          await serviceClient.from("products").update({ stock: createdSale.previousStock }).eq("id", createdSale.productId);
        }

        if (externalClientId) {
          await serviceClient.from("external_clients").delete().eq("id", externalClientId);
        }

        return NextResponse.json({ error: "No se encontro uno de los productos seleccionados" }, { status: 400 });
      }

      const quantity = Math.max(1, Math.trunc(line.quantity || 0));
      const currentStock = Number(productResult.data.stock || 0);

      if (currentStock < quantity) {
        for (const createdSale of createdSales.reverse()) {
          await serviceClient.from("sales_commissions").delete().eq("sale_id", createdSale.saleId);
          await serviceClient.from("sales").delete().eq("id", createdSale.saleId);
          await serviceClient.from("products").update({ stock: createdSale.previousStock }).eq("id", createdSale.productId);
        }

        if (externalClientId) {
          await serviceClient.from("external_clients").delete().eq("id", externalClientId);
        }

        return NextResponse.json({ error: "Stock insuficiente para uno de los productos" }, { status: 400 });
      }

      const price = Number(productResult.data.price || 0);
      const totalAmount = Number((price * quantity).toFixed(2));
      const commissionAmount = normalizedPaymentStatus === "pending" ? 0 : Number(((totalAmount * commissionPercentage) / 100).toFixed(2));
      const paymentReceived = normalizedPaymentStatus === "completed" ? totalAmount : normalizedPaymentStatus === "partial" ? Math.min(Number(paymentReceivedInput || 0), totalAmount) : 0;

      if (normalizedPaymentStatus === "partial" && paymentReceived <= 0) {
        return NextResponse.json({ error: "Ingresa el monto pagado hasta el momento" }, { status: 400 });
      }

      const stockUpdate = await serviceClient
        .from("products")
        .update({ stock: currentStock - quantity })
        .eq("id", line.productId);

      if (stockUpdate.error) {
        for (const createdSale of createdSales.reverse()) {
          await serviceClient.from("sales_commissions").delete().eq("sale_id", createdSale.saleId);
          await serviceClient.from("sales").delete().eq("id", createdSale.saleId);
          await serviceClient.from("products").update({ stock: createdSale.previousStock }).eq("id", createdSale.productId);
        }

        if (externalClientId) {
          await serviceClient.from("external_clients").delete().eq("id", externalClientId);
        }

        return NextResponse.json({ error: "No se pudo actualizar el stock" }, { status: 500 });
      }

      // Use a stored function to insert sale + commission atomically to avoid FK races
      const rpcResult = await serviceClient.rpc("insert_sale_with_commission", {
        p_salesperson_id: salespersonId,
        p_product_id: line.productId,
        p_client_id: clientProfileId || null,
        p_external_client_id: externalClientId || null,
        p_quantity: quantity,
        p_unit_price: price,
        p_total_amount: totalAmount,
        p_payment_status: normalizedPaymentStatus,
        p_payment_received: paymentReceived,
        p_commission_percentage: commissionPercentage,
        p_commission_amount: commissionAmount,
        p_commission_status: commissionStatus,
        p_notes: notes || null,
      });

      if (rpcResult.error || !rpcResult.data) {
        // eslint-disable-next-line no-console
        console.error("emprende: insert_sale_with_commission failed", { error: rpcResult.error, data: rpcResult.data, line });
        // restore product stock for prior createdSales (if any)
        for (const createdSale of createdSales.reverse()) {
          await serviceClient.from("sales_commissions").delete().eq("sale_id", createdSale.saleId);
          await serviceClient.from("sales").delete().eq("id", createdSale.saleId);
          await serviceClient.from("products").update({ stock: createdSale.previousStock }).eq("id", createdSale.productId);
        }

        if (externalClientId) {
          await serviceClient.from("external_clients").delete().eq("id", externalClientId);
        }

        return NextResponse.json({ error: getSaleErrorMessage(rpcResult.error) }, { status: 500 });
      }

      const newSaleId = String(rpcResult.data);
      createdSales.push({ saleId: newSaleId, productId: line.productId, previousStock: currentStock });
    }

    // revalidate paths via a simple ping (optional) - omitted here
    return NextResponse.json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("emprende: unexpected error in api route", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
