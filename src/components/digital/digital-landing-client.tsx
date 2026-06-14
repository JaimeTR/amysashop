"use client";

import { useEffect, useState, useCallback } from "react";
import { Check, Loader2, Shield } from "lucide-react";
import Image from "next/image";
import type { DigitalProduct } from "@/lib/digital";

const PAYPAL_LOGO = (
  <svg viewBox="0 0 36 36" className="h-5 w-5" fill="none">
    <rect width="36" height="36" rx="4" fill="#003087" />
    <text x="7" y="24" fill="white" fontSize="16" fontWeight="bold" fontFamily="Arial">P</text>
  </svg>
);

const CULQI_LOGO = (
  <svg viewBox="0 0 36 36" className="h-5 w-5" fill="none">
    <rect width="36" height="36" rx="4" fill="#6C1D45" />
    <text x="4" y="24" fill="white" fontSize="12" fontWeight="bold" fontFamily="Arial">C</text>
  </svg>
);

function detectCountry(): "pe" | "other" {
  if (typeof navigator === "undefined") return "other";
  const lang = navigator.language || "";
  if (lang.includes("es-PE") || lang.includes("es-300") || lang === "es") return "pe";
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  if (timeZone.includes("Lima")) return "pe";
  return "other";
}

function formatPrice(amount: number, currency: "USD" | "PEN"): string {
  if (currency === "PEN") {
    return `S/ ${amount.toFixed(2)}`;
  }
  return `$${amount.toFixed(2)}`;
}

type Props = {
  initialProducts: DigitalProduct[];
};

export function DigitalLandingClient({ initialProducts }: Props) {
  const [products] = useState<DigitalProduct[]>(initialProducts);
  const [country, setCountry] = useState<"pe" | "other">("pe");
  const [currency, setCurrency] = useState<"PEN" | "USD">("PEN");
  const [selectedProduct, setSelectedProduct] = useState<DigitalProduct | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const detected = detectCountry();
    setCountry(detected);
    setCurrency(detected === "pe" ? "PEN" : "USD");
  }, []);

  const openModal = useCallback((product: DigitalProduct) => {
    setSelectedProduct(product);
    setShowModal(true);
    setError("");
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setSelectedProduct(null);
    setCustomerName("");
    setEmail("");
    setError("");
  }, []);

  const handlePayment = useCallback(
    async (method: "paypal" | "culqi") => {
      if (!selectedProduct || !customerName.trim() || !email.trim()) {
        setError("Completa todos los campos");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("Correo electrónico inválido");
        return;
      }

      setSubmitting(true);
      setError("");

      try {
        const payCurrency = method === "culqi" ? "PEN" : "USD";
        const amount = method === "culqi" ? selectedProduct.price_pen : selectedProduct.price_usd;

        const res = await fetch("/api/digital/purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            customer_name: customerName.trim(),
            product_id: selectedProduct.id,
            payment_method: method,
            amount,
            currency: payCurrency,
          }),
        });

        const data = await res.json();

        if (!data.ok) {
          setError(data.error === "Database not available" ? "Servicio no disponible, intenta más tarde" : "Error al procesar la compra");
          setSubmitting(false);
          return;
        }

        const paymentLink = method === "paypal" ? selectedProduct.paypal_link : selectedProduct.culqi_link;

        window.open(paymentLink, "_blank");

        closeModal();

        const params = new URLSearchParams({
          tipo: "digital",
          nombre: customerName.trim(),
          producto: selectedProduct.name,
        });
        window.location.href = `/digital/gracias?${params.toString()}`;
      } catch {
        setError("Error de conexión. Intenta de nuevo.");
        setSubmitting(false);
      }
    },
    [selectedProduct, customerName, email, closeModal]
  );

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden px-4 pb-16 pt-20 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-4xl">
          <h2 className="font-[var(--font-display)] text-4xl leading-tight md:text-5xl">
            Plantillas de <span className="text-primary">Excel</span> para tu negocio
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Organiza tus ventas, controla tu inventario y conoce tu ganancia real con nuestras plantillas profesionales.
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="size-4 text-primary" />
            <span>Pago 100% seguro &mdash; Recibe los archivos por correo</span>
          </div>

          <div className="mt-4 flex items-center justify-center gap-3">
            {(["PEN", "USD"] as const).map((cur) => (
              <button
                key={cur}
                type="button"
                onClick={() => setCurrency(cur)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  currency === cur
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-primary/20 hover:text-primary"
                }`}
              >
                {cur === "PEN" ? "S/ Soles" : "$ Dólares"}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {products.map((product, idx) => {
            const price = currency === "PEN" ? product.price_pen : product.price_usd;
            const imgSrc = `/digital/${idx + 1}.png`;
            return (
              <div
                key={product.id}
                className="glass-card group relative flex flex-col overflow-hidden rounded-3xl border border-primary/10 bg-white/70 transition hover:border-primary/30 hover:shadow-lg"
              >
                {product.id === "pro" && (
                  <div className="absolute right-3 top-3 z-10 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                    Popular
                  </div>
                )}

                <div className="relative aspect-[9/2] w-full overflow-hidden">
                  <Image
                    src={imgSrc}
                    alt={product.name}
                    fill
                    className="object-contain transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>

                <div className="flex flex-1 flex-col p-6 pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/70">{product.subtitle}</p>
                  <h3 className="mt-1 font-[var(--font-display)] text-xl">{product.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-primary">{formatPrice(price, currency)}</span>
                    {currency === "PEN" && (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatPrice(product.price_usd * 3.3, currency)}
                      </span>
                    )}
                  </div>

                  <ul className="mt-4 flex-1 space-y-2.5">
                    {product.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {product.ideal_for && (
                    <div className="mt-4 rounded-xl bg-secondary/60 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ideal para</p>
                      <p className="mt-0.5 text-xs text-muted-foreground/80">{product.ideal_for}</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => openModal(product)}
                    className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                  >
                    Comprar ahora
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            ¿Preguntas? Escríbenos al{" "}
            <a href="https://wa.me/51965312386" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">
              WhatsApp
            </a>
          </p>
        </div>
      </section>

      {showModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeModal}>
          <div
            className="w-full max-w-md rounded-3xl border border-white/60 bg-white p-6 shadow-2xl backdrop-blur"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-[var(--font-display)] text-lg">Completar compra</h3>
              <button type="button" onClick={closeModal} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>

            <p className="text-sm text-muted-foreground">
              {selectedProduct.name} &mdash;{" "}
              <span className="font-semibold text-primary">
                {currency === "PEN" ? formatPrice(selectedProduct.price_pen, "PEN") : formatPrice(selectedProduct.price_usd, "USD")}
              </span>
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Tu nombre</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej: María García"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Tu correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej: maria@ejemplo.com"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">Te enviaremos los archivos a este correo</p>
              </div>

              {error && <p className="text-xs font-semibold text-destructive">{error}</p>}

              <div className="flex flex-col gap-2 pt-2">
                <p className="text-xs font-semibold text-muted-foreground">Selecciona método de pago:</p>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handlePayment("culqi")}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6C1D45] to-[#8B2D5E] py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : CULQI_LOGO}
                  {submitting ? "Procesando..." : `Pagar con Culqi - S/ ${selectedProduct.price_pen.toFixed(2)}`}
                </button>

                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] text-muted-foreground">O</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handlePayment("paypal")}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#003087] py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : PAYPAL_LOGO}
                  {submitting ? "Procesando..." : `Pagar con PayPal - $${selectedProduct.price_usd.toFixed(2)}`}
                </button>
              </div>

              <p className="text-center text-[10px] text-muted-foreground">
                Al comprar aceptas nuestras políticas de privacidad. Recibirás los archivos una vez verificado el pago.
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
