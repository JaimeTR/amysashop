"use client";

import { FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, Mail, MessageCircle, Plus, X } from "lucide-react";
import {
  cancelDigitalOrderAction,
  confirmDigitalOrderAction,
  createManualDigitalOrderAction,
  resendDigitalOrderEmailAction,
} from "@/app/admin/digitales/actions";
import { useNotify } from "@/components/feedback/notification-center";
import { DIGITAL_PAYMENT_LABELS, formatSoles, type DigitalOrder, type DigitalPaymentMethod } from "@/lib/digital-types";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type Props = {
  orders: DigitalOrder[];
  status: string;
  products: Array<{ id: string; name: string; price: number }>;
};

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendientes" },
  { value: "completed", label: "Pagados" },
  { value: "cancelled", label: "Cancelados" },
];

const STATUS_BADGES: Record<DigitalOrder["status"], { label: string; className: string }> = {
  pending: { label: "Pendiente", className: "bg-warning/15 text-warning-strong" },
  completed: { label: "Pagado", className: "bg-success/10 text-success-strong" },
  cancelled: { label: "Cancelado", className: "bg-muted text-muted-foreground" },
};

const inputClass = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm";

export function DigitalOrdersPanel({ orders, status, products }: Props) {
  const router = useRouter();
  const notify = useNotify();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [, startTransition] = useTransition();

  function reportEmail(result: { emailSent: boolean; emailError?: string } | undefined, successTitle: string) {
    if (result?.emailSent) {
      notify.success(successTitle, "Se envió el correo con el enlace de descarga.");
    } else {
      notify.warning(successTitle, `No se pudo enviar el correo (${result?.emailError || "sin detalle"}). Copia el enlace y envíalo por WhatsApp.`);
    }
  }

  async function run(orderId: string, action: () => Promise<void>) {
    setBusyId(orderId);
    try {
      await action();
      startTransition(() => router.refresh());
    } finally {
      setBusyId(null);
    }
  }

  function downloadLink(order: DigitalOrder) {
    const params = new URLSearchParams({ token: order.downloadToken, email: order.email });
    return `${window.location.origin}/digital/descargas?${params.toString()}`;
  }

  async function copyLink(order: DigitalOrder) {
    try {
      await navigator.clipboard.writeText(downloadLink(order));
      notify.success("Enlace copiado", "Pégalo en WhatsApp para enviarlo al cliente.");
    } catch {
      window.prompt("Copia el enlace:", downloadLink(order));
    }
  }

  function whatsappToCustomer(order: DigitalOrder) {
    if (!order.phone) return null;
    const phone = order.phone.replace(/\D/g, "");
    const fullPhone = phone.length === 9 ? `51${phone}` : phone;
    const message =
      order.status === "completed"
        ? `Hola ${order.customerName.split(" ")[0]}, tu pago de ${order.productName} fue confirmado. Descarga tus archivos aquí: ${downloadLink(order)}`
        : `Hola ${order.customerName.split(" ")[0]}, te escribimos de AMYSA SHOP por tu pedido ${order.code} (${order.productName}).`;
    return buildWhatsAppUrl(fullPhone, message);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <Link
              key={filter.value}
              href={`/admin/digitales?tab=pedidos${filter.value ? `&estado=${filter.value}` : ""}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                status === filter.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-white/70"
              }`}
            >
              {filter.label}
            </Link>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowManual((value) => !value)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="size-4" /> Registrar venta manual
        </button>
      </div>

      {showManual ? (
        <ManualOrderForm
          products={products}
          onDone={(result) => {
            setShowManual(false);
            reportEmail(result, "Venta registrada");
            startTransition(() => router.refresh());
          }}
        />
      ) : null}

      <div className="glass-card overflow-hidden rounded-3xl">
        {orders.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No hay pedidos en esta vista.</p>
        ) : (
          <ul className="divide-y divide-border/50">
            {orders.map((order) => {
              const badge = STATUS_BADGES[order.status];
              const busy = busyId === order.id;
              const whatsappUrl = whatsappToCustomer(order);
              return (
                <li key={order.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-muted-foreground">{order.code}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}>{badge.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </div>
                    <p className="font-semibold text-foreground">
                      {order.productName} · {formatSoles(order.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.customerName} · {order.email}
                      {order.phone ? ` · ${order.phone}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {DIGITAL_PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
                      {order.paymentReference ? ` · Ref: ${order.paymentReference}` : ""}
                      {order.status === "completed" ? ` · ${order.downloadCount} descargas` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {order.status === "pending" ? (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            run(order.id, async () => {
                              const result = await confirmDigitalOrderAction(order.id);
                              if (!result.ok) return notify.error("No se pudo confirmar", result.error);
                              reportEmail(result.data, "Pago confirmado");
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-md bg-success px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                        >
                          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                          Confirmar pago
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            if (!window.confirm(`¿Cancelar el pedido ${order.code}?`)) return;
                            void run(order.id, async () => {
                              const result = await cancelDigitalOrderAction(order.id);
                              if (!result.ok) notify.error("No se pudo cancelar", result.error);
                            });
                          }}
                          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                        >
                          <X className="size-3.5" /> Cancelar
                        </button>
                      </>
                    ) : null}
                    {order.status === "completed" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => copyLink(order)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold"
                        >
                          <Copy className="size-3.5" /> Copiar enlace
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            run(order.id, async () => {
                              const result = await resendDigitalOrderEmailAction(order.id);
                              if (!result.ok) return notify.error("No se pudo reenviar", result.error);
                              reportEmail(result.data, "Correo reenviado");
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                        >
                          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
                          Reenviar correo
                        </button>
                      </>
                    ) : null}
                    {whatsappUrl ? (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-[#25D366] px-3 py-1.5 text-xs font-semibold text-[#128C7E]"
                      >
                        <MessageCircle className="size-3.5" /> WhatsApp
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function ManualOrderForm({
  products,
  onDone,
}: {
  products: Props["products"];
  onDone: (result: { emailSent: boolean; emailError?: string } | undefined) => void;
}) {
  const notify = useNotify();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    const result = await createManualDigitalOrderAction({
      productId: String(form.get("productId") || ""),
      customerName: String(form.get("customerName") || ""),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      paymentMethod: String(form.get("paymentMethod") || "whatsapp") as DigitalPaymentMethod,
      paymentReference: String(form.get("paymentReference") || ""),
      sendEmail: form.get("sendEmail") === "on",
    });
    setSaving(false);
    if (!result.ok) return notify.error("No se pudo registrar", result.error);
    onDone(result.data);
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card grid gap-3 rounded-3xl p-5 sm:grid-cols-2">
      <p className="text-sm text-muted-foreground sm:col-span-2">
        Para ventas cerradas por WhatsApp u otro medio: se registra como <strong>pagada</strong> y el cliente recibe su enlace de descarga.
      </p>
      <label className="space-y-1 text-sm sm:col-span-2">
        <span className="font-semibold">Producto</span>
        <select name="productId" required className={inputClass}>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} · {formatSoles(product.price)}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-semibold">Nombre del cliente</span>
        <input name="customerName" required className={inputClass} />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-semibold">Correo</span>
        <input name="email" type="email" required className={inputClass} />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-semibold">Celular</span>
        <input name="phone" className={inputClass} />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-semibold">Método de pago</span>
        <select name="paymentMethod" defaultValue="whatsapp" className={inputClass}>
          {(Object.keys(DIGITAL_PAYMENT_LABELS) as DigitalPaymentMethod[]).map((method) => (
            <option key={method} value={method}>
              {DIGITAL_PAYMENT_LABELS[method]}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-sm sm:col-span-2">
        <span className="font-semibold">N.º de operación / referencia (opcional)</span>
        <input name="paymentReference" className={inputClass} />
      </label>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="sendEmail" defaultChecked /> Enviar correo con el enlace de descarga
      </label>
      <div className="sm:col-span-2">
        <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Registrar venta pagada
        </button>
      </div>
    </form>
  );
}
