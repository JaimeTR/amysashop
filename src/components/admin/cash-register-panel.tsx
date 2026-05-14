"use client";

import Image from "next/image";
import { useMemo, useState, type ReactNode } from "react";
import { Pencil, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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

type IncomeRow = {
  id: number;
  productId: string;
  productName: string;
  unitType: string;
  quantity: number;
  unitPrice: number;
  total: number;
  wasSold: boolean;
  paymentMethod: string;
  sellerId: string;
  sellerName: string;
  notes: string;
  createdAt: string;
};

type ExpenseRow = {
  id: number;
  concept: string;
  expenseType: string;
  amount: number;
  paymentMethod: string;
  notes: string;
  createdAt: string;
};

type Props = {
  products: ProductOption[];
  sellers: SellerOption[];
  paymentMethods: string[];
  incomes: IncomeRow[];
  expenses: ExpenseRow[];
  createIncomeAction: (formData: FormData) => void;
  updateIncomeAction: (formData: FormData) => void;
  deleteIncomeAction: (formData: FormData) => void;
  createExpenseAction: (formData: FormData) => void;
  updateExpenseAction: (formData: FormData) => void;
  deleteExpenseAction: (formData: FormData) => void;
};

function toMoney(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function toDateOnly(value: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-PE");
}

function paymentMethodLabel(value: string) {
  if (value === "tarjeta_credito") return "Tarjeta credito";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

type ModalShellProps = {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
};

function ModalShell({ open, title, description, onClose, children }: ModalShellProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/30 bg-white/95 p-6 shadow-2xl backdrop-blur-md">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-black/60">Registro</p>
            <h3 className="font-[var(--font-display)] text-3xl text-black">{title}</h3>
            <p className="text-sm text-black/60">{description}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar modal" className="text-black hover:bg-black/5 hover:text-black">
            <X className="size-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

type IncomeEditModalProps = {
  income: IncomeRow;
  products: ProductOption[];
  sellers: SellerOption[];
  paymentMethods: string[];
  onClose: () => void;
  onSubmitAction: (formData: FormData) => void;
};

function IncomeEditModal({ income, products, sellers, paymentMethods, onClose, onSubmitAction }: IncomeEditModalProps) {
  const initialProduct = useMemo(() => products.find((product) => product.id === income.productId) || null, [income.productId, products]);
  const [productQuery, setProductQuery] = useState(initialProduct ? `${initialProduct.name} (${initialProduct.sku || "SIN SKU"})` : income.productName);
  const [selectedProductId, setSelectedProductId] = useState(income.productId || "");
  const [quantity, setQuantity] = useState(String(income.quantity));
  const [unitPrice, setUnitPrice] = useState(String(income.unitPrice));
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredProducts = useMemo(() => {
    const term = productQuery.trim().toLowerCase();
    if (!term) return [] as ProductOption[];

    return products.filter((product) => `${product.name} ${product.sku}`.toLowerCase().includes(term)).slice(0, 10);
  }, [productQuery, products]);

  const selectedProduct = useMemo(() => products.find((product) => product.id === selectedProductId) || null, [products, selectedProductId]);

  return (
    <ModalShell open title="Editar ingreso" description="Actualiza el producto, asesora de venta, cantidades, pago y notas." onClose={onClose}>
      <form action={onSubmitAction} className="grid gap-4">
        <input type="hidden" name="incomeId" value={income.id} />
        <input type="hidden" name="productId" value={selectedProductId} />

        <div className="grid gap-2">
          <label htmlFor="income-edit-product-query" className="text-sm font-medium">Buscar producto</label>
          <div className="space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="income-edit-product-query"
                value={productQuery}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setProductQuery(nextValue);
                  setShowSuggestions(nextValue.trim().length > 0);
                  if (!nextValue.trim()) setSelectedProductId("");
                }}
                onFocus={() => setShowSuggestions(productQuery.trim().length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                placeholder="Buscar por nombre o SKU"
                className="pl-9"
              />
            </div>

            {showSuggestions && filteredProducts.length > 0 ? (
              <div className="max-h-48 overflow-y-auto rounded-md border border-input bg-background p-1">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onMouseDown={() => {
                      setSelectedProductId(product.id);
                      setProductQuery(`${product.name} (${product.sku || "SIN SKU"})`);
                      setShowSuggestions(false);
                      if (!unitPrice && Number(product.price || 0) > 0) {
                        setUnitPrice(String(Number(product.price || 0)));
                      }
                    }}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                  >
                    <Image
                      src={product.imageUrl || "/logos/amysa%20shop.png"}
                      alt={product.name}
                      width={36}
                      height={36}
                      className="size-9 rounded object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{product.name}</span>
                      <span className="block text-xs text-muted-foreground">{product.sku || "SIN SKU"} | {toMoney(product.price)}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {selectedProduct ? (
          <div className="rounded-md border border-success/40 bg-success/90 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-success-foreground">Vista previa</p>
            <div className="flex items-center gap-3">
              <Image
                src={selectedProduct.imageUrl || "/logos/amysa%20shop.png"}
                alt={selectedProduct.name}
                width={64}
                height={64}
                className="size-16 rounded-md object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-success-foreground">{selectedProduct.name}</p>
                <p className="text-xs text-success-foreground">SKU: {selectedProduct.sku || "SIN SKU"}</p>
                <p className="text-sm font-semibold text-success-foreground">Precio base: {toMoney(selectedProduct.price)}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-2">
            <label htmlFor="income-edit-sellerId" className="text-sm font-medium">Asesora de venta</label>
            <select id="income-edit-sellerId" name="sellerId" required defaultValue={income.sellerId || ""} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Selecciona quien vendio</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label htmlFor="income-edit-paymentMethod" className="text-sm font-medium">Metodo de pago</label>
            <select id="income-edit-paymentMethod" name="paymentMethod" defaultValue={income.paymentMethod || "efectivo"} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {paymentMethodLabel(method)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="grid gap-2">
            <label htmlFor="income-edit-quantity" className="text-sm font-medium">Cantidad</label>
            <Input id="income-edit-quantity" name="quantity" type="number" min="0.01" step="0.01" required value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          </div>

          <div className="grid gap-2">
            <label htmlFor="income-edit-unitType" className="text-sm font-medium">Unidad</label>
            <select id="income-edit-unitType" name="unitType" defaultValue={income.unitType} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="unidad">Unidad</option>
              <option value="caja">Caja</option>
              <option value="paquete">Paquete</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label htmlFor="income-edit-unitPrice" className="text-sm font-medium">Precio</label>
            <Input
              id="income-edit-unitPrice"
              name="unitPrice"
              type="number"
              min="0"
              step="0.01"
              required
              value={unitPrice}
              onChange={(event) => setUnitPrice(event.target.value)}
            />
          </div>
        </div>

        <label htmlFor="income-edit-wasSold" className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
          <input id="income-edit-wasSold" type="checkbox" name="wasSold" value="true" defaultChecked={income.wasSold} className="size-4 rounded border-input" />
          Se vendio este producto
        </label>

        <div className="grid gap-2">
          <label htmlFor="income-edit-notes" className="text-sm font-medium">Notas (opcional)</label>
          <textarea id="income-edit-notes" name="notes" rows={3} defaultValue={income.notes} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Guardar cambios</Button>
        </div>
      </form>
    </ModalShell>
  );
}

type ExpenseEditModalProps = {
  expense: ExpenseRow;
  paymentMethods: string[];
  onClose: () => void;
  onSubmitAction: (formData: FormData) => void;
};

function ExpenseEditModal({ expense, paymentMethods, onClose, onSubmitAction }: ExpenseEditModalProps) {
  const [amount, setAmount] = useState(String(expense.amount));

  return (
    <ModalShell open title="Editar egreso" description="Actualiza el concepto, tipo, monto, método de pago y notas." onClose={onClose}>
      <form action={onSubmitAction} className="grid gap-4">
        <input type="hidden" name="expenseId" value={expense.id} />

        <div className="grid gap-2">
          <label htmlFor="expense-edit-concept" className="text-sm font-medium">Concepto del gasto</label>
          <Input id="expense-edit-concept" name="concept" required defaultValue={expense.concept} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <label htmlFor="expense-edit-type" className="text-sm font-medium">Tipo</label>
            <select id="expense-edit-type" name="expenseType" defaultValue={expense.expenseType} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="compra">Compra</option>
              <option value="general">General</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label htmlFor="expense-edit-paymentMethod" className="text-sm font-medium">Metodo de gasto</label>
            <select id="expense-edit-paymentMethod" name="paymentMethod" defaultValue={expense.paymentMethod || "efectivo"} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {paymentMethodLabel(method)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-2">
          <label htmlFor="expense-edit-amount" className="text-sm font-medium">Monto total</label>
          <Input id="expense-edit-amount" name="amount" type="number" min="0" step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} />
        </div>

        <div className="grid gap-2">
          <label htmlFor="expense-edit-notes" className="text-sm font-medium">Notas (opcional)</label>
          <textarea id="expense-edit-notes" name="notes" rows={3} defaultValue={expense.notes} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="secondary">Guardar cambios</Button>
        </div>
      </form>
    </ModalShell>
  );
}

export function CashRegisterPanel({
  products,
  sellers,
  paymentMethods,
  incomes,
  expenses,
  createIncomeAction,
  updateIncomeAction,
  deleteIncomeAction,
  createExpenseAction,
  updateExpenseAction,
  deleteExpenseAction,
}: Props) {
  const [productQuery, setProductQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeRow | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseRow | null>(null);

  const filteredProducts = useMemo(() => {
    const term = productQuery.trim().toLowerCase();
    if (!term) {
      return [] as ProductOption[];
    }

    return products
      .filter((product) => {
        const searchable = `${product.name} ${product.sku}`.toLowerCase();
        return searchable.includes(term);
      })
      .slice(0, 12);
  }, [productQuery, products]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) || null,
    [products, selectedProductId]
  );

  const quickTotal = useMemo(() => {
    const parsedQuantity = Number(quantity.replace(",", "."));
    const parsedUnitPrice = Number(unitPrice.replace(",", "."));

    if (!Number.isFinite(parsedQuantity) || !Number.isFinite(parsedUnitPrice)) {
      return 0;
    }

    return Math.max(0, parsedQuantity) * Math.max(0, parsedUnitPrice);
  }, [quantity, unitPrice]);

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Registro de ingresos</CardTitle>
            <p className="text-sm text-muted-foreground">Registra ventas por producto, vendedor y medio de pago.</p>
          </CardHeader>
          <CardContent>
            <form action={createIncomeAction} className="grid gap-3">
              <input type="hidden" name="productId" value={selectedProductId} required />

              <div className="grid gap-2">
                <label htmlFor="income-create-product-query" className="text-sm font-medium">Buscar producto</label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="income-create-product-query"
                      value={productQuery}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setProductQuery(nextValue);
                        setShowSuggestions(nextValue.trim().length > 0);
                        if (!nextValue.trim()) {
                          setSelectedProductId("");
                        }
                      }}
                      onFocus={() => setShowSuggestions(productQuery.trim().length > 0)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                      placeholder="Buscar por nombre o SKU"
                      className="pl-9"
                    />
                  </div>

                  {showSuggestions && filteredProducts.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto rounded-md border border-input bg-background p-1">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onMouseDown={() => {
                            setSelectedProductId(product.id);
                            setProductQuery(`${product.name} (${product.sku || "SIN SKU"})`);
                            setShowSuggestions(false);
                            if (!unitPrice && Number(product.price || 0) > 0) {
                              setUnitPrice(String(Number(product.price || 0)));
                            }
                          }}
                          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                        >
                          <Image
                            src={product.imageUrl || "/logos/amysa%20shop.png"}
                            alt={product.name}
                            width={36}
                            height={36}
                            className="size-9 rounded object-cover"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{product.name}</span>
                            <span className="block text-xs text-muted-foreground">{product.sku || "SIN SKU"} | {toMoney(product.price)}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              {selectedProduct ? (
                <div className="rounded-md border border-success/40 bg-success/90 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-success-foreground">Vista previa</p>
                  <div className="flex items-center gap-3">
                    <Image
                      src={selectedProduct.imageUrl || "/logos/amysa%20shop.png"}
                      alt={selectedProduct.name}
                      width={64}
                      height={64}
                      className="size-16 rounded-md object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-success-foreground">{selectedProduct.name}</p>
                      <p className="text-xs text-success-foreground">SKU: {selectedProduct.sku || "SIN SKU"}</p>
                      <p className="text-sm font-semibold text-success-foreground">Precio base: {toMoney(selectedProduct.price)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning-foreground">Selecciona un producto desde la lista mientras escribes.</p>
              )}

                <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-2">
                  <label htmlFor="income-create-sellerId" className="text-sm font-medium">Asesora de venta</label>
                  <select id="income-create-sellerId" name="sellerId" required className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Selecciona quien vendio</option>
                    {sellers.map((seller) => (
                      <option key={seller.id} value={seller.id}>
                        {seller.name}
                      </option>
                    ))}
                  </select>
                </div>

                  <div className="grid gap-2">
                    <label htmlFor="income-create-paymentMethod" className="text-sm font-medium">Metodo de pago</label>
                    <select id="income-create-paymentMethod" name="paymentMethod" defaultValue="efectivo" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>
                        {paymentMethodLabel(method)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <label htmlFor="income-create-quantity" className="text-sm font-medium">Cantidad</label>
                    <Input id="income-create-quantity" name="quantity" type="number" min="0.01" step="0.01" required value={quantity} onChange={(event) => setQuantity(event.target.value)} />
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="income-create-unitType" className="text-sm font-medium">Unidad</label>
                    <select id="income-create-unitType" name="unitType" defaultValue="unidad" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      <option value="unidad">Unidad</option>
                      <option value="caja">Caja</option>
                      <option value="paquete">Paquete</option>
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="income-create-unitPrice" className="text-sm font-medium">Precio manual</label>
                    <Input
                      id="income-create-unitPrice"
                      name="unitPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={unitPrice}
                      onChange={(event) => setUnitPrice(event.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

              <label htmlFor="income-create-wasSold" className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                <input id="income-create-wasSold" type="checkbox" name="wasSold" value="true" defaultChecked className="size-4 rounded border-input" />
                Se vendio este producto
              </label>

              <div className="grid gap-2">
                <label htmlFor="income-create-notes" className="text-sm font-medium">Notas (opcional)</label>
                <textarea id="income-create-notes" name="notes" rows={2} placeholder="Ejemplo: venta por delivery o contraentrega" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>

              <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">Total estimado: {toMoney(quickTotal)}</p>

              <Button type="submit">Registrar ingreso</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Registro de egresos</CardTitle>
            <p className="text-sm text-muted-foreground">Registra gastos de compras o generales por monto total y medio de pago.</p>
          </CardHeader>
          <CardContent>
            <form action={createExpenseAction} className="grid gap-3">
              <div className="grid gap-2">
                  <label htmlFor="expense-create-concept" className="text-sm font-medium">Concepto del gasto</label>
                  <Input id="expense-create-concept" name="concept" required placeholder="Ejemplo: Compra de mercaderia" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label htmlFor="expense-create-type" className="text-sm font-medium">Tipo</label>
                  <select id="expense-create-type" name="expenseType" defaultValue="general" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="compra">Compra</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="expense-create-amount" className="text-sm font-medium">Monto total</label>
                  <Input id="expense-create-amount" name="amount" type="number" min="0" step="0.01" required placeholder="0.00" />
                </div>
              </div>

              <div className="grid gap-2">
                <label htmlFor="expense-create-paymentMethod" className="text-sm font-medium">Metodo de gasto</label>
                <select id="expense-create-paymentMethod" name="paymentMethod" defaultValue="efectivo" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {paymentMethodLabel(method)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label htmlFor="expense-create-notes" className="text-sm font-medium">Notas (opcional)</label>
                <textarea id="expense-create-notes" name="notes" rows={3} placeholder="Detalle adicional del gasto" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>

              <Button type="submit" variant="secondary">Registrar egreso</Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Ultimos ingresos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {incomes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aun no hay ingresos registrados.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border bg-white/80">
                <table className="min-w-[980px] w-full text-sm">
                  <thead className="bg-[#efe3d8] text-left">
                    <tr>
                      <th className="px-3 py-2">Producto</th>
                      <th className="px-3 py-2">Vendedora</th>
                      <th className="px-3 py-2">Unidad</th>
                      <th className="px-3 py-2">Cantidad</th>
                      <th className="px-3 py-2">Precio</th>
                      <th className="px-3 py-2">Pago</th>
                      <th className="px-3 py-2">Total</th>
                      <th className="px-3 py-2">Venta</th>
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomes.map((item) => (
                      <tr key={item.id} className="border-t align-top">
                        <td className="px-3 py-2 font-medium">{item.productName}</td>
                        <td className="px-3 py-2">{item.sellerName || "-"}</td>
                        <td className="px-3 py-2 capitalize">{item.unitType}</td>
                        <td className="px-3 py-2">{item.quantity}</td>
                        <td className="px-3 py-2">{toMoney(item.unitPrice)}</td>
                        <td className="px-3 py-2">{paymentMethodLabel(item.paymentMethod || "efectivo")}</td>
                        <td className="px-3 py-2 font-semibold text-primary">{toMoney(item.total)}</td>
                        <td className="px-3 py-2">{item.wasSold ? "Si" : "No"}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{toDateOnly(item.createdAt)}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <Button type="button" variant="outline" size="icon" className="size-8" onClick={() => setEditingIncome(item)} aria-label="Editar ingreso">
                              <Pencil className="size-4" />
                            </Button>
                            <form action={deleteIncomeAction}>
                              <input type="hidden" name="incomeId" value={item.id} />
                              <Button type="submit" variant="destructive" size="icon" className="size-8" aria-label="Borrar ingreso">
                                <Trash2 className="size-4" />
                              </Button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Ultimos egresos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aun no hay egresos registrados.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border bg-white/80">
                <table className="min-w-[820px] w-full text-sm">
                  <thead className="bg-[#efe3d8] text-left">
                    <tr>
                      <th className="px-3 py-2">Concepto</th>
                      <th className="px-3 py-2">Tipo</th>
                      <th className="px-3 py-2">Metodo</th>
                      <th className="px-3 py-2">Monto</th>
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((item) => (
                      <tr key={item.id} className="border-t align-top">
                        <td className="px-3 py-2 font-medium">{item.concept}</td>
                        <td className="px-3 py-2 capitalize">{item.expenseType}</td>
                        <td className="px-3 py-2">{paymentMethodLabel(item.paymentMethod || "efectivo")}</td>
                        <td className="px-3 py-2 font-semibold text-foreground">{toMoney(item.amount)}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{toDateOnly(item.createdAt)}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <Button type="button" variant="outline" size="icon" className="size-8" onClick={() => setEditingExpense(item)} aria-label="Editar egreso">
                              <Pencil className="size-4" />
                            </Button>
                            <form action={deleteExpenseAction}>
                              <input type="hidden" name="expenseId" value={item.id} />
                              <Button type="submit" variant="destructive" size="icon" className="size-8" aria-label="Borrar egreso">
                                <Trash2 className="size-4" />
                              </Button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {editingIncome ? (
        <IncomeEditModal
          income={editingIncome}
          products={products}
          sellers={sellers}
          paymentMethods={paymentMethods}
          onClose={() => setEditingIncome(null)}
          onSubmitAction={updateIncomeAction}
        />
      ) : null}

      {editingExpense ? (
        <ExpenseEditModal
          expense={editingExpense}
          paymentMethods={paymentMethods}
          onClose={() => setEditingExpense(null)}
          onSubmitAction={updateExpenseAction}
        />
      ) : null}
    </div>
  );
}
