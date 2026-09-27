"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle, ShieldCheck } from "lucide-react";
import { formatSoles } from "@/lib/digital-types";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type PaymentOption = { value: "yape" | "plin" | "transferencia"; label: string };

type Props = {
  product: { id: string; name: string; price: number; priceBefore: number | null };
  paymentOptions: PaymentOption[];
  whatsappPhone: string;
};

const inputClass =
  "w-full rounded-xl border border-[#e7d9cf] bg-white/95 px-3 py-2.5 text-sm outline-none ring-primary/30 transition focus:ring-2";

export function DigitalPurchasePanel({ product, paymentOptions, whatsappPhone }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<PaymentOption["value"]>(paymentOptions[0]?.value || "yape");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState<"pay" | "whatsapp" | null>(null);
  const [error, setError] = useState("");

  const hasDiscount = product.priceBefore != null && product.priceBefore > product.price;

  function validate() {
    if (name.trim().length < 2) return "Ingresa tu nombre.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Ingresa un correo válido: ahí te enviaremos tus archivos.";
    return "";
  }

  async function createOrder(paymentMethod: string) {
    const response = await fetch("/api/digital/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, customerName: name, email, phone, paymentMethod, website }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.error || "No se pudo registrar el pedido. Intenta nuevamente.");
    return data as { orderId: string | null; code: string };
  }

  async function handlePay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validate();
    if (validation) return setError(validation);

    setError("");
    setLoading("pay");
    try {
      const order = await createOrder(method);
      if (order.orderId) router.push(`/digital/pedido/${order.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el pedido.");
      setLoading(null);
    }
  }

  async function handleWhatsApp() {
    const validation = validate();
    if (validation) return setError(validation);

    setError("");
    setLoading("whatsapp");
    // Se abre la pestaña en el clic (si se abre después del fetch, el navegador la bloquea).
    const popup = window.open("", "_blank");
    try {
      const order = await createOrder("whatsapp");
      const message = [
        `Hola AMYSA, quiero comprar: *${product.name}* (${formatSoles(product.price)}).`,
        `Pedido: ${order.code}`,
        `Nombre: ${name.trim()}`,
        `Correo para la descarga: ${email.trim()}`,
      ].join("\n");
      const url = buildWhatsAppUrl(whatsappPhone, message);
      if (popup) popup.location.href = url;
      else window.location.href = url;
      if (order.orderId) router.push(`/digital/pedido/${order.orderId}`);
    } catch (err) {
      popup?.close();
      setError(err instanceof Error ? err.message : "No se pudo registrar el pedido.");
      setLoading(null);
    }
  }

  return (
    <form onSubmit={handlePay} className="glass-card space-y-4 rounded-3xl p-5">
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-primary">{formatSoles(product.price)}</span>
        {hasDiscount ? <span className="text-sm text-muted-foreground line-through">{formatSoles(product.priceBefore!)}</span> : null}
      </div>

      <div className="grid gap-3">
        <input className={inputClass} placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        <input
          className={inputClass}
          placeholder="Correo (ahí llegará tu descarga)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <input className={inputClass} placeholder="Celular (opcional)" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
        {/* Trampa para bots */}
        <input tabIndex={-1} autoComplete="off" className="hidden" value={website} onChange={(e) => setWebsite(e.target.value)} aria-hidden="true" />
      </div>

      {paymentOptions.length > 0 ? (
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Método de pago</legend>
          <div className="grid grid-cols-3 gap-2">
            {paymentOptions.map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded-xl border px-2 py-2 text-center text-sm font-semibold transition ${
                  method === option.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-white/70 text-foreground hover:border-primary/40"
                }`}
              >
                <input type="radio" name="method" value={option.value} checked={method === option.value} onChange={() => setMethod(option.value)} className="sr-only" />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-2">
        {paymentOptions.length > 0 ? (
          <button
            type="submit"
            disabled={loading !== null}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {loading === "pay" ? <Loader2 className="size-4 animate-spin" /> : null}
            Continuar al pago
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleWhatsApp}
          disabled={loading !== null}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#25D366] bg-[#25D366]/10 px-4 text-sm font-semibold text-[#128C7E] transition hover:bg-[#25D366]/20 disabled:opacity-60"
        >
          {loading === "whatsapp" ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
          Comprar por WhatsApp
        </button>
      </div>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        Cuando confirmemos tu pago te enviaremos un correo con el enlace para descargar tus archivos.
      </p>
    </form>
  );
}
