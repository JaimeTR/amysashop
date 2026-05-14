"use client";

import { useMemo, useState } from "react";
import { Search, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";

type OrderRow = {
  id: string;
  status: string;
  paymentStatus: string;
  total: number;
  userId: string;
  createdAt: string;
  channel: string;
  paymentMethod: string;
  customerName: string;
};

type Props = {
  rows: OrderRow[];
  statuses: string[];
  paymentStatuses: string[];
  updateStatusAction: (formData: FormData) => void;
};

function humanizeStatus(value: string) {
  return value.replaceAll("_", " ");
}

export function OrdersInventoryTable({ rows, statuses, paymentStatuses, updateStatusAction }: Props) {
  const [query, setQuery] = useState("");

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return rows;
    }

    return rows.filter((row) => {
      const searchable = [
        row.id,
        row.status,
        row.userId,
        row.customerName,
        row.channel,
        row.paymentMethod,
        String(row.total),
        row.createdAt,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(term);
    });
  }, [rows, query]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-semibold text-foreground">Listado de pedidos</h3>
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por pedido, cliente, estado, canal o pago..."
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Mostrando {filteredRows.length} de {rows.length} pedidos
      </p>

      {filteredRows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No se encontraron pedidos con ese criterio.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white/80">
          <table className="w-full text-sm">
            <thead className="bg-[#efe3d8] text-left">
              <tr>
                <th className="px-3 py-2">Pedido</th>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2 hidden sm:table-cell">Canal</th>
                <th className="px-3 py-2 hidden md:table-cell">Pago</th>
                <th className="px-3 py-2">Est. Pago</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2 hidden md:table-cell">Estado</th>
                <th className="px-3 py-2 hidden lg:table-cell">Fecha</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((order) => (
                <tr key={order.id} className="border-t align-top">
                  <td className="px-3 py-2 font-semibold text-primary text-xs">#{order.id.slice(0, 8)}</td>
                  <td className="px-3 py-2">
                    <p className="font-medium text-xs truncate max-w-[120px]" title={order.customerName || "Sin nombre"}>{order.customerName || "Sin nombre"}</p>
                    <p className="text-xs text-muted-foreground">{order.userId?.slice(0, 8) || "Sin usuario"}...</p>
                  </td>
                  <td className="px-3 py-2 hidden sm:table-cell text-xs">{order.channel || "No definido"}</td>
                  <td className="px-3 py-2 hidden md:table-cell text-xs">{order.paymentMethod || "No definido"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          order.paymentStatus === "completo"
                            ? "bg-success/10 text-success-foreground"
                            : order.paymentStatus === "adelanto" || order.paymentStatus === "cuotas"
                              ? "bg-warning/10 text-warning-foreground"
                              : "bg-muted/10 text-muted-foreground"
                        }`}
                    >
                      {humanizeStatus(order.paymentStatus || "pendiente")}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-semibold text-primary text-xs">S/ {Number(order.total || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 hidden md:table-cell">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          order.status === "entregado"
                            ? "bg-success/10 text-success-foreground"
                            : order.status === "cancelado"
                              ? "bg-destructive/10 text-destructive-foreground"
                              : "bg-warning/10 text-warning-foreground"
                        }`}
                    >
                      {humanizeStatus(order.status)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground hidden lg:table-cell">
                    {order.createdAt ? new Date(order.createdAt).toLocaleString("es-PE") : "-"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      <form action={updateStatusAction} className="flex items-center gap-1">
                        <input type="hidden" name="orderId" value={order.id} />
                        <select
                          name="status"
                          defaultValue={order.status}
                          onChange={(event) => event.currentTarget.form?.requestSubmit()}
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          {statuses.map((option) => (
                            <option key={option} value={option}>
                              {humanizeStatus(option)}
                            </option>
                          ))}
                        </select>
                      </form>

                      <form action={updateStatusAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <select
                          name="paymentStatus"
                          defaultValue={order.paymentStatus || "pendiente"}
                          onChange={(event) => event.currentTarget.form?.requestSubmit()}
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          {paymentStatuses.map((option) => (
                            <option key={option} value={option}>
                              Pago {humanizeStatus(option)}
                            </option>
                          ))}
                        </select>
                      </form>

                      <form action={updateStatusAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="status" value="cancelado" />
                        <Button 
                          type="submit" 
                          size="icon" 
                          variant="destructive" 
                          className="h-8 w-8"
                          title="Cancelar pedido"
                        >
                          <Ban className="size-3 sm:size-4" />
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
    </div>
  );
}
