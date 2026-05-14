"use server";

import { createClient } from "@/lib/supabase/server";
import {
  Salesperson,
  ExternalClient,
  Sale,
  SalesCommission,
  SaleWithDetails,
  SalespersonWithStats,
  CreateSaleInput,
  CreateExternalClientInput,
  UpdateSalespersonInput,
  SalesFilter,
  PaymentStatus,
} from "@/lib/types";
import { auth } from "@/lib/auth";

async function requireAuthenticatedUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return { supabase, user };
}

// ============================================================================
// SALESPEOPLE (VENDEDORAS)
// ============================================================================

export async function getSalesperson(userId: string): Promise<Salesperson | null> {
  const { supabase, user } = await requireAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("salespeople")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching salesperson:", error);
    return null;
  }

  return data;
}

export async function getAllSalespeople(): Promise<Salesperson[]> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const { supabase } = await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from("salespeople")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching salespeople:", error);
    return [];
  }

  return data || [];
}

export async function createSalesperson(
  userId: string,
  name: string,
  email?: string,
  phone?: string,
  commissionPercentage: number = 5
): Promise<Salesperson | null> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const { supabase } = await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from("salespeople")
    .insert([
      {
        user_id: userId,
        name,
        email,
        phone,
        commission_percentage: commissionPercentage,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating salesperson:", error);
    return null;
  }

  return data;
}

export async function updateSalesperson(
  salespersonId: string,
  updates: UpdateSalespersonInput
): Promise<Salesperson | null> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const { supabase } = await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from("salespeople")
    .update(updates)
    .eq("id", salespersonId)
    .select()
    .single();

  if (error) {
    console.error("Error updating salesperson:", error);
    return null;
  }

  return data;
}

// ============================================================================
// EXTERNAL CLIENTS
// ============================================================================

export async function createExternalClient(
  salespersonId: string,
  clientData: CreateExternalClientInput
): Promise<ExternalClient | null> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const { supabase } = await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from("external_clients")
    .insert([
      {
        ...clientData,
        salesperson_id: salespersonId,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating external client:", error);
    return null;
  }

  return data;
}

export async function getExternalClientsBySalesperson(
  salespersonId: string
): Promise<ExternalClient[]> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const { supabase } = await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from("external_clients")
    .select("*")
    .eq("salesperson_id", salespersonId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching external clients:", error);
    return [];
  }

  return data || [];
}

export async function updateExternalClient(
  clientId: string,
  updates: Partial<ExternalClient>
): Promise<ExternalClient | null> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const { supabase } = await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from("external_clients")
    .update(updates)
    .eq("id", clientId)
    .select()
    .single();

  if (error) {
    console.error("Error updating external client:", error);
    return null;
  }

  return data;
}

// ============================================================================
// SALES
// ============================================================================

export async function createSale(
  salespersonId: string,
  saleData: CreateSaleInput,
  unitPrice: number
): Promise<Sale | null> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const { supabase } = await requireAuthenticatedUser();
  const totalAmount = unitPrice * saleData.quantity;

  const { data, error } = await supabase
    .from("sales")
    .insert([
      {
        salesperson_id: salespersonId,
        product_id: saleData.product_id,
        client_id: saleData.client_id || null,
        external_client_id: saleData.external_client_id || null,
        quantity: saleData.quantity,
        unit_price: unitPrice,
        total_amount: totalAmount,
        payment_status: saleData.payment_status,
        payment_received: saleData.payment_received || 0,
        notes: saleData.notes,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating sale:", error);
    return null;
  }

  return data;
}

export async function getSalesByMonth(
  salespersonId: string,
  month: number,
  year: number
): Promise<SaleWithDetails[]> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const { supabase } = await requireAuthenticatedUser();
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

  const { data, error } = await supabase
    .from("sales")
    .select(
      `
      *,
      product:products(*),
      salesperson:salespeople(*),
      client:profiles(*),
      external_client:external_clients(*)
    `
    )
    .eq("salesperson_id", salespersonId)
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching sales by month:", error);
    return [];
  }

  return data || [];
}

export async function getAllSalesByMonth(
  month: number,
  year: number
): Promise<SaleWithDetails[]> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const { supabase } = await requireAuthenticatedUser();
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

  const { data, error } = await supabase
    .from("sales")
    .select(
      `
      *,
      product:products(*),
      salesperson:salespeople(*),
      client:profiles(*),
      external_client:external_clients(*)
    `
    )
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all sales by month:", error);
    return [];
  }

  return data || [];
}

export async function getSalesByFilter(filter: SalesFilter): Promise<SaleWithDetails[]> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const { supabase } = await requireAuthenticatedUser();
  let query = supabase
    .from("sales")
    .select(
      `
      *,
      product:products(*),
      salesperson:salespeople(*),
      client:profiles(*),
      external_client:external_clients(*)
    `
    );

  if (filter.salesperson_id) {
    query = query.eq("salesperson_id", filter.salesperson_id);
  }

  if (filter.payment_status) {
    query = query.eq("payment_status", filter.payment_status);
  }

  if (filter.commission_status) {
    query = query.eq("commission_status", filter.commission_status);
  }

  if (filter.month && filter.year) {
    const startDate = new Date(filter.year, filter.month - 1, 1).toISOString();
    const endDate = new Date(filter.year, filter.month, 0, 23, 59, 59).toISOString();
    query = query.gte("created_at", startDate).lte("created_at", endDate);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching sales with filter:", error);
    return [];
  }

  return data || [];
}

export async function updateSale(
  saleId: string,
  updates: Partial<Sale>
): Promise<Sale | null> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const { supabase } = await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from("sales")
    .update(updates)
    .eq("id", saleId)
    .select()
    .single();

  if (error) {
    console.error("Error updating sale:", error);
    return null;
  }

  return data;
}

export async function updateSalePayment(
  saleId: string,
  paymentStatus: PaymentStatus,
  paymentReceived: number
): Promise<Sale | null> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const { supabase } = await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from("sales")
    .update({
      payment_status: paymentStatus,
      payment_received: paymentReceived,
    })
    .eq("id", saleId)
    .select()
    .single();

  if (error) {
    console.error("Error updating sale payment:", error);
    return null;
  }

  return data;
}

export async function deleteSale(saleId: string): Promise<boolean> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const { supabase } = await requireAuthenticatedUser();
  const { error } = await supabase.from("sales").delete().eq("id", saleId);

  if (error) {
    console.error("Error deleting sale:", error);
    return false;
  }

  return true;
}

// ============================================================================
// SALES COMMISSIONS
// ============================================================================

export async function getCommissionsBySalesperson(
  salespersonId: string
): Promise<SalesCommission[]> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const { supabase } = await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from("sales_commissions")
    .select("*")
    .eq("salesperson_id", salespersonId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching commissions:", error);
    return [];
  }

  return data || [];
}

export async function getCommissionsByMonth(
  salespersonId: string,
  month: number,
  year: number
): Promise<SalesCommission[]> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const { supabase } = await requireAuthenticatedUser();
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

  const { data, error } = await supabase
    .from("sales_commissions")
    .select("*")
    .eq("salesperson_id", salespersonId)
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching commissions by month:", error);
    return [];
  }

  return data || [];
}

export async function getSalespersonStats(
  salespersonId: string,
  month?: number,
  year?: number
): Promise<SalespersonWithStats | null> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const { supabase } = await requireAuthenticatedUser();
  const salesperson = await supabase
    .from("salespeople")
    .select("*")
    .eq("id", salespersonId)
    .single();

  if (salesperson.error) {
    console.error("Error fetching salesperson:", salesperson.error);
    return null;
  }

  let query = supabase.from("sales").select("total_amount, commission_amount").eq("salesperson_id", salespersonId);

  if (month && year) {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
    query = query.gte("created_at", startDate).lte("created_at", endDate);
  }

  const sales = await query;

  if (sales.error) {
    console.error("Error fetching sales for stats:", sales.error);
    return null;
  }

  const salesData = sales.data || [];
  const monthSales = salesData.length;
  const monthTotalAmount = salesData.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const monthCommissionAmount = salesData.reduce((sum, s) => sum + (s.commission_amount || 0), 0);

  return {
    ...salesperson.data,
    month_sales_count: monthSales,
    month_total_amount: monthTotalAmount,
    month_commission_amount: monthCommissionAmount,
  };
}

// ============================================================================
// STATISTICS
// ============================================================================

export async function getTotalCommissionsForMonth(
  salespersonId: string,
  month: number,
  year: number
): Promise<number> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const { supabase } = await requireAuthenticatedUser();
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

  const { data, error } = await supabase
    .from("sales_commissions")
    .select("commission_amount")
    .eq("salesperson_id", salespersonId)
    .eq("status", "approved")
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  if (error) {
    console.error("Error fetching total commissions:", error);
    return 0;
  }

  return (data || []).reduce((sum, c) => sum + (c.commission_amount || 0), 0);
}

export async function getTotalSalesForMonth(
  salespersonId: string,
  month: number,
  year: number
): Promise<number> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const { supabase } = await requireAuthenticatedUser();
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

  const { data, error } = await supabase
    .from("sales")
    .select("total_amount")
    .eq("salesperson_id", salespersonId)
    .eq("payment_status", "completed")
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  if (error) {
    console.error("Error fetching total sales:", error);
    return 0;
  }

  return (data || []).reduce((sum, s) => sum + (s.total_amount || 0), 0);
}

export async function getPendingCommissions(
  salespersonId: string
): Promise<number> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const { supabase } = await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from("sales_commissions")
    .select("commission_amount")
    .eq("salesperson_id", salespersonId)
    .eq("status", "pending");

  if (error) {
    console.error("Error fetching pending commissions:", error);
    return 0;
  }

  return (data || []).reduce((sum, c) => sum + (c.commission_amount || 0), 0);
}
