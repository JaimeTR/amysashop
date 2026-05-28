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
    const commissionAmount = normalizedPaymentStatus === "completed" ? Number(((totalAmount * commissionPercentage) / 100).toFixed(2)) : 0;

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

    const saleInsert = await serviceClient
      .from("sales")
      .insert({
        salesperson_id: salespersonId,
        product_id: line.productId,
        client_id: clientProfileId || null,
        external_client_id: externalClientId,
        quantity,
        unit_price: price,
        total_amount: totalAmount,
        payment_status: normalizedPaymentStatus,
        payment_received: normalizedPaymentStatus === "completed" ? totalAmount : 0,
        commission_status: commissionStatus,
        commission_amount: commissionAmount,
        notes: notes || null,
      })
      .select("id")
      .maybeSingle();

    if (saleInsert.error || !saleInsert.data) {
      await serviceClient.from("products").update({ stock: currentStock }).eq("id", line.productId);

      for (const createdSale of createdSales.reverse()) {
        await serviceClient.from("sales_commissions").delete().eq("sale_id", createdSale.saleId);
        await serviceClient.from("sales").delete().eq("id", createdSale.saleId);
        await serviceClient.from("products").update({ stock: createdSale.previousStock }).eq("id", createdSale.productId);
      }

      if (externalClientId) {
        await serviceClient.from("external_clients").delete().eq("id", externalClientId);
      }

      redirect("/admin/emprende?error=No+se+pudo+registrar+una+de+las+ventas");
    }

    if (normalizedPaymentStatus === "completed" && commissionAmount > 0) {
      await serviceClient.from("sales_commissions").insert({
        sale_id: saleInsert.data.id,
        salesperson_id: salespersonId,
        commission_percentage: commissionPercentage,
        commission_amount: commissionAmount,
        status: "approved",
      });
    }

    createdSales.push({ saleId: saleInsert.data.id, productId: line.productId, previousStock: currentStock });
  }

  revalidatePath("/admin/emprende");
  revalidatePath("/admin");
  revalidatePath("/admin/vendedora");
  redirect("/admin/emprende?ok=Venta+registrada+correctamente");
}