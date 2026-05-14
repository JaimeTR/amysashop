import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { HandCoins, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageNotifications } from "@/components/feedback/admin-page-notifications";
import { CashRegisterPanel } from "@/components/admin/cash-register-panel";
import { requireAdminUser } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type PageProps = {
  searchParams?: {
    ok?: string;
    error?: string;
  };
};

type ProductOption = {
  id: string;
  name: string;
  sku: string;
  price: number;
  imageUrl: string;
};

type SellerOption = {
  id: string;
  name: string;
};

type IncomeDbRow = {
  id: number;
  product_id?: string | null;
  product_name: string;
  unit_type: string;
  quantity: number;
  unit_price: number;
  total: number;
  was_sold: boolean;
  payment_method?: string | null;
  seller_id?: string | null;
  seller_name?: string | null;
  notes?: string | null;
  created_at: string;
};

type ExpenseDbRow = {
  id: number;
  concept: string;
  expense_type: string;
  amount: number;
  payment_method?: string | null;
  notes?: string | null;
  created_at: string;
};

const PAYMENT_METHODS = ["efectivo", "yape", "transferencia", "tarjeta_credito", "plin", "otro"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

function toNumber(value: FormDataEntryValue | null, fallback = 0) {
  const normalized = String(value || "").trim().replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getSafeImageUrl(value: unknown) {
  const first = Array.isArray(value) ? String(value[0] || "").trim() : "";
  if (first.startsWith("/") || /^https?:\/\//i.test(first)) {
    return first;
  }
  return "";
}

function isMissingTableError(error: { message?: string } | null | undefined, tableName: string) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes(tableName.toLowerCase()) && message.includes("schema cache");
}

function isMissingColumnError(error: { message?: string } | null | undefined, columnName: string) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("column") && message.includes(columnName.toLowerCase()) && message.includes("does not exist");
}

function normalizePaymentMethod(value: FormDataEntryValue | null): PaymentMethod {
  const normalized = String(value || "").trim().toLowerCase();
  return (PAYMENT_METHODS as readonly string[]).includes(normalized) ? (normalized as PaymentMethod) : "efectivo";
}

async function resolveSellerName(
  db: NonNullable<ReturnType<typeof createServiceRoleClient>>,
  sellerId: string
): Promise<string> {
  const seller = await db.from("profiles").select("id,nombre").eq("id", sellerId).maybeSingle();
  if (!seller.error && seller.data) {
    return String((seller.data as { nombre?: string | null }).nombre || "").trim() || "Sin nombre";
  }
  return "Sin nombre";
}

async function createIncomeAction(formData: FormData) {
  "use server";

  const { user } = await requireAdminUser("inventory.manage");
  const db = createServiceRoleClient();

  if (!db) {
    redirect("/admin/caja-amysa?error=Falta+configuracion+de+Supabase");
  }

  const productId = String(formData.get("productId") || "").trim();
  const sellerId = String(formData.get("sellerId") || "").trim();
  const quantity = Math.max(0.01, toNumber(formData.get("quantity"), 1));
  const unitType = String(formData.get("unitType") || "unidad").trim().toLowerCase();
  const unitPrice = Math.max(0, toNumber(formData.get("unitPrice"), 0));
  const paymentMethod = normalizePaymentMethod(formData.get("paymentMethod"));
  const wasSold = ["true", "on", "1"].includes(String(formData.get("wasSold") || "").trim().toLowerCase());
  const notes = String(formData.get("notes") || "").trim();

  if (!productId) {
    redirect("/admin/caja-amysa?error=Selecciona+un+producto");
  }

  if (!sellerId) {
    redirect("/admin/caja-amysa?error=Selecciona+la+vendedora+o+usuario+que+realizo+la+venta");
  }

  const { data: product, error: productError } = await db
    .from("products")
    .select("id,name")
    .eq("id", productId)
    .maybeSingle();

  if (productError || !product) {
    redirect("/admin/caja-amysa?error=No+se+pudo+encontrar+el+producto");
  }

  const safeUnitType = ["unidad", "caja", "paquete"].includes(unitType) ? unitType : "unidad";
  const total = Number((quantity * unitPrice).toFixed(2));
  const sellerName = await resolveSellerName(db, sellerId);

  const insertResult = await db.from("amysa_cash_income").insert({
    product_id: String((product as { id: string }).id),
    product_name: String((product as { name: string }).name || "Producto"),
    unit_type: safeUnitType,
    quantity,
    unit_price: unitPrice,
    total,
    was_sold: wasSold,
    payment_method: paymentMethod,
    seller_id: sellerId,
    seller_name: sellerName,
    notes: notes || null,
    created_by: user.id,
  });

  if (insertResult.error) {
    if (
      isMissingTableError(insertResult.error, "amysa_cash_income") ||
      isMissingColumnError(insertResult.error, "payment_method") ||
      isMissingColumnError(insertResult.error, "seller_id")
    ) {
      redirect("/admin/caja-amysa?error=Debes+aplicar+las+migraciones+de+Caja+AMYSA+para+usar+asesora+de+venta+y+metodos+de+pago");
    }
    redirect(`/admin/caja-amysa?error=${encodeURIComponent(insertResult.error.message)}`);
  }

  revalidatePath("/admin/caja-amysa");
  redirect("/admin/caja-amysa?ok=Ingreso+registrado");
}

async function updateIncomeAction(formData: FormData) {
  "use server";

  await requireAdminUser("inventory.manage");
  const db = createServiceRoleClient();

  if (!db) {
    redirect("/admin/caja-amysa?error=Falta+configuracion+de+Supabase");
  }

  const id = String(formData.get("incomeId") || "").trim();
  const productId = String(formData.get("productId") || "").trim();
  const sellerId = String(formData.get("sellerId") || "").trim();
  const quantity = Math.max(0.01, toNumber(formData.get("quantity"), 1));
  const unitType = String(formData.get("unitType") || "unidad").trim().toLowerCase();
  const unitPrice = Math.max(0, toNumber(formData.get("unitPrice"), 0));
  const paymentMethod = normalizePaymentMethod(formData.get("paymentMethod"));
  const wasSold = ["true", "on", "1"].includes(String(formData.get("wasSold") || "").trim().toLowerCase());
  const notes = String(formData.get("notes") || "").trim();

  if (!id) {
    redirect("/admin/caja-amysa?error=Ingreso+invalido");
  }

  if (!productId) {
    redirect("/admin/caja-amysa?error=Selecciona+un+producto");
  }

  if (!sellerId) {
    redirect("/admin/caja-amysa?error=Selecciona+la+vendedora+o+usuario+que+realizo+la+venta");
  }

  const safeUnitType = ["unidad", "caja", "paquete"].includes(unitType) ? unitType : "unidad";
  const total = Number((quantity * unitPrice).toFixed(2));
  const sellerName = await resolveSellerName(db, sellerId);

  const { data: product, error: productError } = await db
    .from("products")
    .select("id,name")
    .eq("id", productId)
    .maybeSingle();

  if (productError || !product) {
    redirect("/admin/caja-amysa?error=No+se+pudo+encontrar+el+producto+para+actualizar");
  }

  const updateResult = await db
    .from("amysa_cash_income")
    .update({
      product_id: productId,
      product_name: String((product as { name: string }).name || "Producto"),
      quantity,
      unit_type: safeUnitType,
      unit_price: unitPrice,
      total,
      was_sold: wasSold,
      payment_method: paymentMethod,
      seller_id: sellerId,
      seller_name: sellerName,
      notes: notes || null,
    })
    .eq("id", id);

  if (updateResult.error) {
    if (
      isMissingColumnError(updateResult.error, "payment_method") ||
      isMissingColumnError(updateResult.error, "seller_id")
    ) {
      redirect("/admin/caja-amysa?error=Debes+aplicar+las+migraciones+de+Caja+AMYSA+para+editar+asesora+de+venta+y+metodos+de+pago");
    }
    redirect(`/admin/caja-amysa?error=${encodeURIComponent(updateResult.error.message)}`);
  }

  revalidatePath("/admin/caja-amysa");
  redirect("/admin/caja-amysa?ok=Ingreso+actualizado");
}

async function deleteIncomeAction(formData: FormData) {
  "use server";

  await requireAdminUser("inventory.manage");
  const db = createServiceRoleClient();

  if (!db) {
    redirect("/admin/caja-amysa?error=Falta+configuracion+de+Supabase");
  }

  const id = String(formData.get("incomeId") || "").trim();
  if (!id) {
    redirect("/admin/caja-amysa?error=Ingreso+invalido");
  }

  const deleteResult = await db.from("amysa_cash_income").delete().eq("id", id);
  if (deleteResult.error) {
    redirect(`/admin/caja-amysa?error=${encodeURIComponent(deleteResult.error.message)}`);
  }

  revalidatePath("/admin/caja-amysa");
  redirect("/admin/caja-amysa?ok=Ingreso+eliminado");
}

async function createExpenseAction(formData: FormData) {
  "use server";

  const { user } = await requireAdminUser("inventory.manage");
  const db = createServiceRoleClient();

  if (!db) {
    redirect("/admin/caja-amysa?error=Falta+configuracion+de+Supabase");
  }

  const concept = String(formData.get("concept") || "").trim();
  const expenseType = String(formData.get("expenseType") || "general").trim().toLowerCase();
  const paymentMethod = normalizePaymentMethod(formData.get("paymentMethod"));
  const amount = Math.max(0, toNumber(formData.get("amount"), 0));
  const notes = String(formData.get("notes") || "").trim();

  if (!concept) {
    redirect("/admin/caja-amysa?error=Ingresa+el+concepto+del+gasto");
  }

  const safeExpenseType = ["compra", "general"].includes(expenseType) ? expenseType : "general";

  const insertResult = await db.from("amysa_cash_expense").insert({
    concept,
    expense_type: safeExpenseType,
    payment_method: paymentMethod,
    amount,
    notes: notes || null,
    created_by: user.id,
  });

  if (insertResult.error) {
    if (isMissingColumnError(insertResult.error, "payment_method")) {
      redirect("/admin/caja-amysa?error=Debes+aplicar+la+migracion+de+metodos+de+pago+en+Caja+AMYSA");
    }
    redirect(`/admin/caja-amysa?error=${encodeURIComponent(insertResult.error.message)}`);
  }

  revalidatePath("/admin/caja-amysa");
  redirect("/admin/caja-amysa?ok=Egreso+registrado");
}

async function updateExpenseAction(formData: FormData) {
  "use server";

  await requireAdminUser("inventory.manage");
  const db = createServiceRoleClient();

  if (!db) {
    redirect("/admin/caja-amysa?error=Falta+configuracion+de+Supabase");
  }

  const id = String(formData.get("expenseId") || "").trim();
  const concept = String(formData.get("concept") || "").trim();
  const expenseType = String(formData.get("expenseType") || "general").trim().toLowerCase();
  const paymentMethod = normalizePaymentMethod(formData.get("paymentMethod"));
  const amount = Math.max(0, toNumber(formData.get("amount"), 0));
  const notes = String(formData.get("notes") || "").trim();

  if (!id || !concept) {
    redirect("/admin/caja-amysa?error=Datos+de+egreso+incompletos");
  }

  const safeExpenseType = ["compra", "general"].includes(expenseType) ? expenseType : "general";

  const updateResult = await db
    .from("amysa_cash_expense")
    .update({
      concept,
      expense_type: safeExpenseType,
      payment_method: paymentMethod,
      amount,
      notes: notes || null,
    })
    .eq("id", id);

  if (updateResult.error) {
    if (isMissingColumnError(updateResult.error, "payment_method")) {
      redirect("/admin/caja-amysa?error=Debes+aplicar+la+migracion+de+metodos+de+gasto+en+Caja+AMYSA");
    }
    redirect(`/admin/caja-amysa?error=${encodeURIComponent(updateResult.error.message)}`);
  }

  revalidatePath("/admin/caja-amysa");
  redirect("/admin/caja-amysa?ok=Egreso+actualizado");
}

async function deleteExpenseAction(formData: FormData) {
  "use server";

  await requireAdminUser("inventory.manage");
  const db = createServiceRoleClient();

  if (!db) {
    redirect("/admin/caja-amysa?error=Falta+configuracion+de+Supabase");
  }

  const id = String(formData.get("expenseId") || "").trim();
  if (!id) {
    redirect("/admin/caja-amysa?error=Egreso+invalido");
  }

  const deleteResult = await db.from("amysa_cash_expense").delete().eq("id", id);
  if (deleteResult.error) {
    redirect(`/admin/caja-amysa?error=${encodeURIComponent(deleteResult.error.message)}`);
  }

  revalidatePath("/admin/caja-amysa");
  redirect("/admin/caja-amysa?ok=Egreso+eliminado");
}

const MONEY_FORMATTER = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

function toMoney(value: number) {
  return MONEY_FORMATTER.format(Number(value || 0));
}

export default async function AdminCajaAmysaPage({ searchParams }: PageProps) {
  const { user } = await requireAdminUser("inventory.manage");

  const db = createServiceRoleClient();
  if (!db) {
    return (
      <main className="space-y-5 pb-8">
        <header className="glass-card rounded-3xl p-5">
          <h1 className="font-[var(--font-display)] text-3xl">Caja AMYSA</h1>
          <p className="mt-2 text-sm text-muted-foreground">Configura las variables de Supabase para usar este modulo.</p>
        </header>
      </main>
    );
  }

  const [productsResult, sellerFull, sellerMinimal] = await Promise.all([
    db.from("products").select("id,name,sku,price,images").order("name", { ascending: true }).limit(500),
    db.from("profiles").select("id,nombre,role,is_admin").order("nombre", { ascending: true }).limit(300),
    db.from("profiles").select("id,nombre,is_admin").order("nombre", { ascending: true }).limit(300),
  ]);

  const incomeSelectCandidates = [
    "id,product_id,product_name,unit_type,quantity,unit_price,total,was_sold,payment_method,seller_id,seller_name,notes,created_at",
    "id,product_id,product_name,unit_type,quantity,unit_price,total,was_sold,seller_id,seller_name,notes,created_at",
    "id,product_name,unit_type,quantity,unit_price,total,was_sold,notes,created_at",
  ];

  const expenseSelectCandidates = [
    "id,concept,expense_type,amount,payment_method,notes,created_at",
    "id,concept,expense_type,amount,notes,created_at",
    "id,concept,expense_type,amount,created_at",
  ];

  let incomesResult = await db
    .from("amysa_cash_income")
    .select(incomeSelectCandidates[0])
    .order("created_at", { ascending: false })
    .limit(60);

  if (incomesResult.error && !isMissingTableError(incomesResult.error, "amysa_cash_income")) {
    const retryResults = await Promise.all(
      incomeSelectCandidates.slice(1).map((select) =>
        db.from("amysa_cash_income").select(select).order("created_at", { ascending: false }).limit(60)
      )
    );
    for (const retry of retryResults) {
      if (!retry.error) {
        incomesResult = retry;
        break;
      }
    }
  }

  let expensesResult = await db
    .from("amysa_cash_expense")
    .select(expenseSelectCandidates[0])
    .order("created_at", { ascending: false })
    .limit(60);

  if (expensesResult.error && !isMissingTableError(expensesResult.error, "amysa_cash_expense")) {
    const retryResults = await Promise.all(
      expenseSelectCandidates.slice(1).map((select) =>
        db.from("amysa_cash_expense").select(select).order("created_at", { ascending: false }).limit(60)
      )
    );
    for (const retry of retryResults) {
      if (!retry.error) {
        expensesResult = retry;
        break;
      }
    }
  }

  const missingIncomeTable = isMissingTableError(incomesResult.error, "amysa_cash_income");
  const missingExpenseTable = isMissingTableError(expensesResult.error, "amysa_cash_expense");
  const missingTables = missingIncomeTable || missingExpenseTable;

  const products = (
    (productsResult.data || []) as Array<{ id: string; name: string | null; sku: string | null; price: number | null; images?: unknown }>
  ).map((item) => ({
    id: String(item.id),
    name: String(item.name || "Producto sin nombre"),
    sku: String(item.sku || ""),
    price: Number(item.price || 0),
    imageUrl: getSafeImageUrl(item.images),
  })) as ProductOption[];

  const sellerSource = !sellerFull.error && sellerFull.data ? sellerFull.data : sellerMinimal.data || [];
  const sellerMap = new Map<string, SellerOption>();
  for (const item of (sellerSource as Array<{ id: string; nombre?: string | null; role?: string | null; is_admin?: boolean | null }>)) {
    const role = String(item.role || "").trim().toLowerCase();
    const shouldInclude = !role ? (Boolean(item.is_admin) || item.id === user.id) : ["superadmin", "administrador", "duena", "dueña", "vendedora", "socia"].includes(role);
    if (shouldInclude) {
      sellerMap.set(String(item.id), { id: String(item.id), name: String(item.nombre || "Sin nombre") });
    }
  }
  const sellers = Array.from(sellerMap.values()) as SellerOption[];

  const incomesData = !incomesResult.error && Array.isArray(incomesResult.data) ? (incomesResult.data as unknown as IncomeDbRow[]) : [];
  const incomes = incomesData.map((row) => ({
    id: row.id,
    productId: String(row.product_id || ""),
    productName: row.product_name,
    unitType: row.unit_type,
    quantity: Number(row.quantity || 0),
    unitPrice: Number(row.unit_price || 0),
    total: Number(row.total || 0),
    wasSold: Boolean(row.was_sold),
    paymentMethod: String(row.payment_method || "efectivo"),
    sellerId: String(row.seller_id || ""),
    sellerName: String(row.seller_name || "Sin vendedor"),
    notes: String(row.notes || ""),
    createdAt: row.created_at,
  }));

  const expensesData = !expensesResult.error && Array.isArray(expensesResult.data) ? (expensesResult.data as unknown as ExpenseDbRow[]) : [];
  const expenses = expensesData.map((row) => ({
    id: row.id,
    concept: row.concept,
    expenseType: row.expense_type,
    amount: Number(row.amount || 0),
    paymentMethod: String(row.payment_method || "efectivo"),
    notes: String(row.notes || ""),
    createdAt: row.created_at,
  }));

  const incomeTotal = incomes.reduce((acc, row) => acc + row.total, 0);
  const expenseTotal = expenses.reduce((acc, row) => acc + row.amount, 0);
  const balance = incomeTotal - expenseTotal;

  return (
    <main className="space-y-5 pb-8">
      <AdminPageNotifications ok={searchParams?.ok} error={searchParams?.error} />

      <header className="glass-card rounded-3xl p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Modulo financiero interno</p>
        <h1 className="font-[var(--font-display)] text-3xl">Caja AMYSA</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Registro de ingresos y egresos para control diario de ventas y gastos generales.
        </p>
      </header>

      {missingTables ? (
        <Card className="glass-card border-warning/40">
          <CardHeader>
            <CardTitle className="text-base text-warning-foreground">Falta aplicar migracion de Caja AMYSA</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ejecuta la migracion <strong>20260421_create_cash_register_module.sql</strong> para crear las tablas
              <strong> public.amysa_cash_income </strong>y<strong> public.amysa_cash_expense</strong>.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!missingTables ? (
        <>
          <section className="grid gap-3 md:grid-cols-3">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <HandCoins className="size-4 text-success-foreground" /> Ingresos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-success-foreground">{toMoney(incomeTotal)}</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Wallet className="size-4 text-destructive-foreground" /> Egresos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-foreground">{toMoney(expenseTotal)}</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-foreground">{toMoney(balance)}</p>
              </CardContent>
            </Card>
          </section>

          <CashRegisterPanel
            products={products}
            sellers={sellers}
            paymentMethods={[...PAYMENT_METHODS]}
            incomes={incomes}
            expenses={expenses}
            createIncomeAction={createIncomeAction}
            updateIncomeAction={updateIncomeAction}
            deleteIncomeAction={deleteIncomeAction}
            createExpenseAction={createExpenseAction}
            updateExpenseAction={updateExpenseAction}
            deleteExpenseAction={deleteExpenseAction}
          />
        </>
      ) : null}
    </main>
  );
}
