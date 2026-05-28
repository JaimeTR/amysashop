"use client";

import { useMemo, useState } from "react";
import { BadgeDollarSign, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type EmprendeSalespersonOption = {
  id: string;
  name: string;
  email?: string | null;
  commission_percentage?: number | null;
  status?: string | null;
};

export type EmprendeClientOption = {
  id: string;
  nombre: string;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  img_avatar?: string | null;
  avatar_url?: string | null;
};

export type EmprendeProductOption = {
  id: string;
  name: string;
  brand?: string | null;
  category?: string | null;
  stock?: number | null;
  price?: number | null;
  price_before?: number | null;
  images?: string[] | null;
};

type SaleLineState = {
  id: string;
  query: string;
  productId: string;
  quantity: number;
};

let saleLineSequence = 0;
const NEW_CLIENT_ID = "__new__";

type Props = {
  role: "superadmin" | "administrador" | "duena" | "vendedora" | "socia" | "cliente";
  salespeople: EmprendeSalespersonOption[];
  clients: EmprendeClientOption[];
  products: EmprendeProductOption[];
  initialSalespersonId: string;
  action: (formData: FormData) => Promise<void>;
};

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function normalizeText(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function createLine(): SaleLineState {
  saleLineSequence += 1;
  return {
    id: `sale-line-${saleLineSequence}`,
    query: "",
    productId: "",
    quantity: 1,
  };
}

export function EmprendeSaleForm({ role, salespeople, clients, products, initialSalespersonId, action }: Props) {
  const [salespersonId, setSalespersonId] = useState(initialSalespersonId);
  const [clientQuery, setClientQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("completed");
  const [saleLines, setSaleLines] = useState<SaleLineState[]>([
    {
      id: "sale-line-0",
      query: "",
      productId: "",
      quantity: 1,
    },
  ]);

  const selectedClient = useMemo(() => clients.find((client) => client.id === selectedClientId) || null, [clients, selectedClientId]);
  const hasClientQuery = clientQuery.trim().length > 0;

  const filteredClients = useMemo(() => {
    const query = normalizeText(clientQuery);

    if (!query) {
      return [];
    }

    return clients
      .filter((client) => {
        const haystack = normalizeText(`${client.nombre} ${client.email || ""} ${client.telefono || ""}`);
        return haystack.includes(query);
      })
      .slice(0, 8);
  }, [clientQuery, clients]);

  const selectedClientDisplayName = selectedClient?.nombre || clientName || clientQuery;

  const selectedClientIsExisting = Boolean(selectedClientId && selectedClientId !== NEW_CLIENT_ID);
  const selectedClientIsNew = selectedClientId === NEW_CLIENT_ID;

  function updateLine(lineId: string, patch: Partial<SaleLineState>) {
    setSaleLines((current) => current.map((line) => (line.id === lineId ? { ...line, ...patch } : line)));
  }

  function addLine() {
    setSaleLines((current) => [...current, createLine()]);
  }

  function removeLine(lineId: string) {
    setSaleLines((current) => (current.length > 1 ? current.filter((line) => line.id !== lineId) : current));
  }

  function selectClient(client: EmprendeClientOption) {
    setSelectedClientId(client.id);
    setClientQuery(client.nombre);
    setClientName(client.nombre);
    setClientEmail(client.email || "");
    setClientPhone(client.telefono || "");
  }

  function clearClientSelection(options?: { keepQuery?: boolean }) {
    setSelectedClientId("");
    if (!options?.keepQuery) {
      setClientQuery("");
    }
    setClientName("");
    setClientEmail("");
    setClientPhone("");
  }

  function chooseNewClient() {
    setSelectedClientId(NEW_CLIENT_ID);
    setClientName(clientQuery.trim());
    setClientEmail("");
    setClientPhone("");
  }

  function selectProduct(lineId: string, product: EmprendeProductOption) {
    updateLine(lineId, {
      productId: product.id,
      query: product.name,
      quantity: 1,
    });
  }

  const payloadLines = saleLines.map((line) => ({
    productId: line.productId,
    quantity: line.quantity,
  }));
  const hasIncompleteLine = saleLines.some((line) => !line.productId || line.quantity < 1);

  return (
    <Card className="glass-card rounded-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BadgeDollarSign className="size-4 text-primary" />
          Registrar venta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <form action={action} className="space-y-5">
          <div className="space-y-5">
            {role !== "vendedora" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="salespersonId">Vendedora</label>
                <select
                  id="salespersonId"
                  name="salespersonId"
                  value={salespersonId}
                  onChange={(event) => setSalespersonId(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Selecciona una vendedora</option>
                  {salespeople.map((salesperson) => (
                    <option key={salesperson.id} value={salesperson.id}>
                      {salesperson.name}
                      {salesperson.commission_percentage != null ? ` (${salesperson.commission_percentage}%)` : ""}
                    </option>
                  ))}
                </select>
                {salespeople.length === 0 ? <p className="text-xs text-amber-700">Todavía no hay vendedoras sincronizadas desde perfiles.</p> : null}
              </div>
            ) : (
              <input type="hidden" name="salespersonId" value={salespersonId} />
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="client-search">Cliente</label>
              <div className="relative">
                <Input
                  id="client-search"
                  value={clientQuery}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    if (selectedClientId) {
                      clearClientSelection({ keepQuery: true });
                    }
                    setClientQuery(nextValue);
                    setClientName(nextValue);
                  }}
                  placeholder="Busca cliente registrado o escribe uno nuevo"
                  autoComplete="off"
                />
                {!selectedClientId && hasClientQuery && filteredClients.length > 0 ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-20 max-h-56 overflow-auto rounded-2xl border border-input bg-white shadow-xl">
                    {filteredClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectClient(client)}
                        className="flex w-full items-center gap-3 border-b border-muted px-3 py-2 text-left text-sm last:border-b-0 hover:bg-primary/5"
                      >
                        <span className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {String(client.nombre || "").slice(0, 2).toUpperCase() || "CL"}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium">{client.nombre}</span>
                          <span className="block text-xs text-muted-foreground">{client.email || client.telefono || "Cliente registrado"}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              {!selectedClientId && hasClientQuery && filteredClients.length === 0 ? (
                <div className="space-y-2 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-3">
                  <p className="text-sm text-muted-foreground">No encontramos coincidencias.</p>
                  <Button type="button" variant="outline" className="w-full" onClick={chooseNewClient}>
                    Registrar cliente nuevo
                  </Button>
                </div>
              ) : null}
            </div>

            {selectedClientIsExisting ? (
              <div className="grid gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4 md:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Nombre</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{selectedClient?.nombre || selectedClientDisplayName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Correo</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{selectedClient?.email || "Sin correo"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Teléfono</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{selectedClient?.telefono || "Sin teléfono"}</p>
                </div>
                <input type="hidden" name="clientProfileId" value={selectedClientId} />
                <input type="hidden" name="customerName" value={selectedClient?.nombre || ""} />
                <input type="hidden" name="customerEmail" value={selectedClient?.email || ""} />
                <input type="hidden" name="customerPhone" value={selectedClient?.telefono || ""} />
              </div>
            ) : null}

            {selectedClientIsNew ? (
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="customerName">Nombre del cliente</label>
                  <Input id="customerName" name="customerName" value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Nombre completo" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="customerEmail">Correo del cliente</label>
                  <Input id="customerEmail" name="customerEmail" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} type="email" placeholder="correo@ejemplo.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="customerPhone">Teléfono</label>
                  <Input id="customerPhone" name="customerPhone" value={clientPhone} onChange={(event) => setClientPhone(event.target.value)} placeholder="Número de contacto" required />
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <label className="text-sm font-medium">Productos</label>
                  <p className="text-xs text-muted-foreground">Selecciona uno o más productos. Cada fila se guardará como una venta relacionada.</p>
                </div>
                <Button type="button" variant="outline" onClick={addLine}>
                  <Plus className="mr-2 size-4" /> Agregar producto
                </Button>
              </div>

              <input type="hidden" name="saleLines" value={JSON.stringify(payloadLines)} />

              <div className="space-y-4">
                {saleLines.map((line, index) => {
                  const lineQuery = normalizeText(line.query);
                  const hasLineQuery = String(line.query || "").trim().length > 0;
                  const selectedProduct = products.find((item) => item.id === line.productId) || null;
                  const filteredProducts = hasLineQuery
                    ? products
                        .filter((item) => {
                          const haystack = normalizeText(`${item.name} ${item.brand || ""}`);
                          return haystack.includes(lineQuery);
                        })
                        .slice(0, 8)
                    : [];

                  return (
                    <div key={line.id} className="rounded-3xl border border-border/70 bg-white/70 p-4 shadow-sm">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground">Producto {index + 1}</p>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(line.id)} disabled={saleLines.length === 1}>
                              <Trash2 className="mr-2 size-4" /> Quitar
                            </Button>
                          </div>

                          <div className="relative">
                            <Input
                              value={line.query}
                              onChange={(event) => {
                                const nextValue = event.target.value;
                                updateLine(line.id, { query: nextValue, productId: "" });
                              }}
                              placeholder="Busca por nombre o marca"
                              autoComplete="off"
                            />
                                {!line.productId && hasLineQuery && filteredProducts.length > 0 ? (
                                  <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-20 max-h-60 overflow-auto rounded-2xl border border-input bg-white shadow-xl">
                                    {filteredProducts.map((item) => (
                                      <button
                                        key={item.id}
                                        type="button"
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={() => selectProduct(line.id, item)}
                                        className="flex w-full items-center justify-between gap-3 border-b border-muted px-3 py-2 text-left text-sm last:border-b-0 hover:bg-primary/5"
                                      >
                                        <div className="flex items-center gap-3 min-w-0">
                                          <img
                                            src={item.images?.[0] || "/logos/amysa-square-primary.png"}
                                            alt={item.name}
                                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                                          />
                                          <div className="min-w-0">
                                            <div className="font-medium truncate">{item.name}</div>
                                            <div className="text-xs text-muted-foreground truncate">{item.brand || "Sin marca"} · Stock {Number(item.stock || 0)} · {formatMoney(item.price)}</div>
                                          </div>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                ) : null}
                          </div>

                            <div className="grid gap-3 md:grid-cols-[1fr_160px] md:items-end">
                              <div className="space-y-2 rounded-2xl border border-primary/15 bg-primary/5 p-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Seleccionado</p>
                                {selectedProduct ? (
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={selectedProduct.images?.[0] || "/logos/amysa-square-primary.png"}
                                      alt={selectedProduct.name}
                                      className="h-12 w-12 rounded-lg object-cover"
                                    />
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-medium text-foreground">{selectedProduct.name}</p>
                                      <p className="truncate text-xs text-muted-foreground">
                                        {selectedProduct.brand || "Sin marca"} · Stock {Number(selectedProduct.stock || 0)} · {formatMoney(selectedProduct.price)}
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm font-medium text-foreground">Todavía no seleccionaste un producto</p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground" htmlFor={`quantity-${line.id}`}>
                                  Cantidad
                                </label>
                                <Input
                                  id={`quantity-${line.id}`}
                                  type="number"
                                  min="1"
                                  value={line.quantity}
                                  onChange={(event) => updateLine(line.id, { quantity: Math.max(1, Number(event.target.value) || 1) })}
                                  required
                                />
                              </div>
                            </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="paymentStatus">Estado de pago</label>
                <select
                  id="paymentStatus"
                  name="paymentStatus"
                  value={paymentStatus}
                  onChange={(event) => setPaymentStatus(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="pending">Pendiente</option>
                  <option value="partial">Parcial</option>
                  <option value="completed">Completado</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="notes">Notas</label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Observaciones, referencia de entrega o detalles de la venta"
                  className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={hasIncompleteLine}>
              Registrar {saleLines.length > 1 ? "ventas" : "venta"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
