"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

function safeText(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function parseNumber(value: FormDataEntryValue | null) {
  const parsed = Number(String(value || "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function getSaleErrorRedirectUrl(error: { code?: string | null; message?: string | null; details?: string | null } | null) {
  const code = String(error?.code || "");
  const message = String(error?.message || "");
  const details = String(error?.details || "");

  if (code === "P0001" || /insufficient stock/i.test(message) || /insufficient stock/i.test(details)) {
    return "/admin/emprende?error=Stock+insuficiente+para+uno+de+los+productos";
  }

  if (code === "23503") {
    return "/admin/emprende?error=No+se+pudo+registrar+una+de+las+ventas";
  }

  return "/admin/emprende?error=No+se+pudo+registrar+una+de+las+ventas";
}

function normalizeCommissionStatus(value: string) {
  const status = String(value || "").toLowerCase();

  if (status === "approved" || status === "paid") {
    return status;
  }

  return "pending";
}

async function restoreProductStock(serviceClient: ReturnType<typeof createServiceRoleClient>, productId: string, quantity: number) {
  const client = serviceClient;

  if (!client) {
    return;
  }

  const productResult = await client.from("products").select("stock").eq("id", productId).maybeSingle();

  if (!productResult.data) {
    return;
  }

  const currentStock = Number(productResult.data.stock || 0);
  await client.from("products").update({ stock: currentStock + quantity }).eq("id", productId);
}

export async function updateSaleAction(formData: FormData) {
  const serviceClient = createServiceRoleClient();

  if (!serviceClient) {
    redirect("/admin/emprende?error=Falta+configuracion+de+SUPABASE_SECRET_KEY");
  }

  await requireAdminUser("sales.manage");

  const saleId = safeText(formData.get("saleId"));
  const paymentStatusRaw = safeText(formData.get("paymentStatus")).toLowerCase();
  const commissionStatusRaw = normalizeCommissionStatus(safeText(formData.get("commissionStatus")));
  const notes = safeText(formData.get("notes"));
  const paymentReceivedInput = parseNumber(formData.get("paymentReceived"));

  if (!saleId) {
    redirect("/admin/emprende?error=Falta+identificar+la+venta+a+modificar");
  }

  const saleResult = await serviceClient
    .from("sales")
    .select(
      "id,product_id,salesperson_id,quantity,total_amount,commission_amount,salespeople:salespeople(id,commission_percentage),sales_commissions(id,commission_percentage,commission_amount,status)"
    )
    .eq("id", saleId)
    .maybeSingle();

  if (saleResult.error || !saleResult.data) {
    redirect("/admin/emprende?error=No+se+encontro+la+venta+seleccionada");
  }

  const sale = saleResult.data as {
    id: string;
    product_id: string;
    salesperson_id?: string | null;
    quantity: number;
    total_amount: number;
    commission_amount: number;
    salespeople?: { commission_percentage?: number | null } | null;
    sales_commissions?: Array<{ id: string; commission_percentage?: number | null; commission_amount?: number | null; status?: string | null }> | null;
  };

  const normalizedPaymentStatus = paymentStatusRaw === "completed" || paymentStatusRaw === "partial" ? paymentStatusRaw : "pending";
  const paymentReceived =
    normalizedPaymentStatus === "completed"
      ? Number(sale.total_amount || 0)
      : normalizedPaymentStatus === "partial"
        ? Math.min(Number(paymentReceivedInput || 0), Number(sale.total_amount || 0))
        : 0;

  if (normalizedPaymentStatus === "partial" && paymentReceived <= 0) {
    redirect("/admin/emprende?error=Ingresa+el+monto+pagado+hasta+el+momento");
  }

  const commissionStatus = normalizedPaymentStatus === "completed" && commissionStatusRaw === "pending" ? "approved" : commissionStatusRaw;
  const commissionPercentage = Number(sale.salespeople?.commission_percentage || sale.sales_commissions?.[0]?.commission_percentage || 0);
  const computedCommissionAmount = Number(((Number(sale.total_amount || 0) * commissionPercentage) / 100).toFixed(2));
  const currentCommissionAmount = Number(sale.sales_commissions?.[0]?.commission_amount || sale.commission_amount || 0);
  const commissionAmount = commissionStatus === "pending" ? currentCommissionAmount : computedCommissionAmount || currentCommissionAmount;

  const updateResult = await serviceClient
    .from("sales")
    .update({
      payment_status: normalizedPaymentStatus,
      payment_received: paymentReceived,
      commission_status: commissionStatus,
      commission_amount: commissionAmount,
      notes: notes || null,
    })
    .eq("id", saleId);

  if (updateResult.error) {
    redirect("/admin/emprende?error=No+se+pudo+actualizar+la+venta");
  }

  const existingCommission = sale.sales_commissions?.[0];

  if (commissionAmount > 0 || existingCommission) {
    if (existingCommission?.id) {
      await serviceClient
        .from("sales_commissions")
        .update({
          commission_percentage: commissionPercentage,
          commission_amount: commissionAmount,
          status: commissionStatus,
        })
        .eq("id", existingCommission.id);
    } else if (commissionAmount > 0) {
      await serviceClient.from("sales_commissions").insert({
        sale_id: saleId,
        salesperson_id: sale.salesperson_id || null,
        commission_percentage: commissionPercentage,
        commission_amount: commissionAmount,
        status: commissionStatus,
      });
    }
  }

  revalidatePath("/admin/emprende");
  revalidatePath("/admin");
  revalidatePath("/admin/vendedora");
  redirect("/admin/emprende?ok=Venta+actualizada+correctamente");
}

export async function deleteSaleAction(formData: FormData) {
  const serviceClient = createServiceRoleClient();

  if (!serviceClient) {
    redirect("/admin/emprende?error=Falta+configuracion+de+SUPABASE_SECRET_KEY");
  }

  await requireAdminUser("sales.manage");

  const saleId = safeText(formData.get("saleId"));

  if (!saleId) {
    redirect("/admin/emprende?error=Falta+identificar+la+venta+a+eliminar");
  }

  const saleResult = await serviceClient.from("sales").select("id,product_id,quantity").eq("id", saleId).maybeSingle();

  if (saleResult.error || !saleResult.data) {
    redirect("/admin/emprende?error=No+se+encontro+la+venta+seleccionada");
  }

  const sale = saleResult.data as { product_id: string; quantity: number };

  await serviceClient.from("sales_commissions").delete().eq("sale_id", saleId);
  await serviceClient.from("sales").delete().eq("id", saleId);
  await restoreProductStock(serviceClient, sale.product_id, Number(sale.quantity || 0));

  revalidatePath("/admin/emprende");
  revalidatePath("/admin");
  revalidatePath("/admin/vendedora");
  redirect("/admin/emprende?ok=Venta+eliminada+correctamente");
}

export async function registerSaleAction(formData: FormData) {
  const serviceClient = createServiceRoleClient();
  const { user, role } = await requireAdminUser("sales.manage");

  if (!serviceClient) {
    redirect("/admin/emprende?error=Falta+configuracion+de+SUPABASE_SECRET_KEY");
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

  if (role === "vendedora") {
    const ownSalesperson = await serviceClient
      .from("salespeople")
      .select("id,name,commission_percentage")
      .eq("user_id", user.id)
      .maybeSingle();

    if (ownSalesperson.error || !ownSalesperson.data) {
      redirect("/admin/emprende?error=No+se+encontro+tu+registro+de+vendedora");
    }

    salespersonId = ownSalesperson.data.id;
  }

  if (!salespersonId) {
    redirect("/admin/emprende?error=Completa+la+vendedora+antes+de+registrar+la+venta");
  }

  const salespersonResult = await serviceClient
    .from("salespeople")
    .select("id,name,commission_percentage")
    .eq("id", salespersonId)
    .maybeSingle();

  if (salespersonResult.error || !salespersonResult.data) {
    redirect("/admin/emprende?error=No+se+encontro+la+vendedora+seleccionada");
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
    redirect("/admin/emprende?error=Agrega+al+menos+un+producto+para+registrar+la+venta");
  }

  let externalClientId: string | null = null;

  if (!clientProfileId) {
    if (!customerName || !customerPhone) {
      redirect("/admin/emprende?error=Completa+los+datos+del+cliente+o+selecciona+uno+registrado");
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
      redirect("/admin/emprende?error=No+se+pudo+crear+el+cliente+externo");
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

      redirect("/admin/emprende?error=No+se+encontro+uno+de+los+productos+seleccionados");
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

      redirect("/admin/emprende?error=Stock+insuficiente+para+uno+de+los+productos");
    }

    const price = Number(productResult.data.price || 0);
    const totalAmount = Number((price * quantity).toFixed(2));
    const commissionAmount = normalizedPaymentStatus === "pending" ? 0 : Number(((totalAmount * commissionPercentage) / 100).toFixed(2));
    const paymentReceived = normalizedPaymentStatus === "completed" ? totalAmount : normalizedPaymentStatus === "partial" ? Math.min(Number(paymentReceivedInput || 0), totalAmount) : 0;

    if (normalizedPaymentStatus === "partial" && paymentReceived <= 0) {
      redirect("/admin/emprende?error=Ingresa+el+monto+pagado+hasta+el+momento");
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

      redirect("/admin/emprende?error=No+se+pudo+actualizar+el+stock");
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

      redirect(getSaleErrorRedirectUrl(rpcResult.error));
    }

    const newSaleId = String(rpcResult.data);
    createdSales.push({ saleId: newSaleId, productId: line.productId, previousStock: currentStock });
  }

  revalidatePath("/admin/emprende");
  revalidatePath("/admin");
  revalidatePath("/admin/vendedora");
  redirect("/admin/emprende?ok=Venta+registrada+correctamente");
}