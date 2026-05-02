"use client";

import Image from "next/image";
import Link from "next/link";
import { Loader2, TicketPercent } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/product-images";
import { useCartStore } from "@/store/cart-store";
import { useNotify } from "@/components/feedback/notification-center";
import { DEFAULT_WHATSAPP_PHONE, buildWhatsAppUrl } from "@/lib/whatsapp";
import { createClient } from "@/lib/supabase/client";
import { deliveryOptions, getDeliveryFee, getDeliveryLabel, type DeliveryMethod } from "@/lib/delivery-options";
import { getHalomDepartments } from "@/lib/shipping-halom";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";

const paymentOptions = [
  { value: "transferencia", label: "Transferencia" },
  { value: "yape", label: "Yape" },
  { value: "plin", label: "Plin" },
];

const documentTypeOptions = [
  { value: "dni", label: "DNI" },
  { value: "cex", label: "CEX" },
  { value: "pex", label: "PEX" },
];

const transferBanks = [
  {
    bank: "BCP",
    account: process.env.NEXT_PUBLIC_BANK_BCP_ACCOUNT || "Configurar NEXT_PUBLIC_BANK_BCP_ACCOUNT",
    cci: process.env.NEXT_PUBLIC_BANK_BCP_CCI || "Configurar NEXT_PUBLIC_BANK_BCP_CCI",
  },
  {
    bank: "Interbank",
    account: process.env.NEXT_PUBLIC_BANK_INTERBANK_ACCOUNT || "Configurar NEXT_PUBLIC_BANK_INTERBANK_ACCOUNT",
    cci: process.env.NEXT_PUBLIC_BANK_INTERBANK_CCI || "Configurar NEXT_PUBLIC_BANK_INTERBANK_CCI",
  },
  {
    bank: "BBVA",
    account: process.env.NEXT_PUBLIC_BANK_BBVA_ACCOUNT || "Configurar NEXT_PUBLIC_BANK_BBVA_ACCOUNT",
    cci: process.env.NEXT_PUBLIC_BANK_BBVA_CCI || "Configurar NEXT_PUBLIC_BANK_BBVA_CCI",
  },
];

function paymentMethodLabel(value: string) {
  if (value === "coordinar_con_amysa") return "A coordinar con AMYSA";
  const option = paymentOptions.find((item) => item.value === value);
  return option?.label || value;
}

function documentTypeLabel(value: string) {
  return documentTypeOptions.find((item) => item.value === value)?.label || value.toUpperCase();
}

function normalizeText(value: string) {
  return value.trim().toUpperCase();
}

function inferDeliveryMethodFromText(value: string): DeliveryMethod | null {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  if (normalized.includes("LIMA") || normalized.includes("CALLAO")) {
    return "shipping_lima";
  }

  const isProvincial = getHalomDepartments().some((department) => {
    if (normalized.includes(department.name)) {
      return true;
    }

    return department.districts.some((district) => normalized.includes(district));
  });

  return isProvincial ? "shipping_provincia" : null;
}

type CouponRow = {
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_subtotal: number;
  starts_at: string | null;
  ends_at: string | null;
};

function resolveCouponDiscount(subtotal: number, coupon: CouponRow | null) {
  if (!coupon) return 0;

  if (coupon.discount_type === "percent") {
    return Number(((subtotal * Number(coupon.discount_value || 0)) / 100).toFixed(2));
  }

  return Math.min(subtotal, Number(coupon.discount_value || 0));
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const notify = useNotify();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const [name, setName] = useState("");
  const [documentType, setDocumentType] = useState("dni");
  const [documentNumber, setDocumentNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("transferencia");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("shipping_lima");
  const [couponInput, setCouponInput] = useState("");
  const [activeCoupon, setActiveCoupon] = useState<CouponRow | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.price * item.quantity, 0), [items]);
  const subtotalBase = useMemo(
    () =>
      items.reduce((acc, item) => {
        const unitBasePrice = item.priceBefore && item.priceBefore > item.price ? Number(item.priceBefore) : item.price;
        return acc + unitBasePrice * item.quantity;
      }, 0),
    [items]
  );
  const productDiscountAmount = Math.max(0, subtotalBase - subtotal);
  const discountAmount = resolveCouponDiscount(subtotal, activeCoupon);
  const totalSavings = productDiscountAmount + discountAmount;
  const shippingCost = getDeliveryFee(deliveryMethod);
  const total = Math.max(0, subtotal - discountAmount + shippingCost);
  const isShippingDelivery = deliveryMethod !== "pickup_lima_points";
  const selectedPaymentMethod = isShippingDelivery ? paymentMethod : "coordinar_con_amysa";
  const yapeQrUrl = process.env.NEXT_PUBLIC_YAPE_QR_URL || "";
  const plinQrUrl = process.env.NEXT_PUBLIC_PLIN_QR_URL || "";

  const departmentOptions = useMemo(
    () => getHalomDepartments().map((item) => ({ value: item.name, label: item.name })),
    []
  );

  const provinceOptions = useMemo(() => {
    const provinceSet = new Set<string>();

    for (const item of getHalomDepartments()) {
      provinceSet.add(item.name);

      for (const districtName of item.districts) {
        provinceSet.add(districtName);
      }
    }

    return Array.from(provinceSet)
      .sort((left, right) => left.localeCompare(right))
      .map((item) => ({ value: item, label: item }));
  }, []);

  const districtOptions = useMemo(() => {
    if (!department) {
      return getHalomDepartments()
        .flatMap((item) => item.districts)
        .sort((left, right) => left.localeCompare(right))
        .map((item) => ({ value: item, label: item }));
    }

    const selectedDepartment = getHalomDepartments().find((item) => item.name === department);
    const districts = selectedDepartment?.districts || [];

    return districts
      .slice()
      .sort((left, right) => left.localeCompare(right))
      .map((item) => ({ value: item, label: item }));
  }, [department]);

  useEffect(() => {
    const deliveryFromQuery = searchParams.get("delivery");
    const couponFromQuery = searchParams.get("coupon");

    if (deliveryFromQuery && deliveryOptions.some((option) => option.value === deliveryFromQuery)) {
      setDeliveryMethod(deliveryFromQuery as DeliveryMethod);
    }

    if (couponFromQuery) {
      setCouponInput(couponFromQuery.toUpperCase());
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isShippingDelivery) {
      return;
    }

    const text = `${department} ${province} ${district}`;
    const inferredDeliveryMethod = inferDeliveryMethodFromText(text);

    if (inferredDeliveryMethod) {
      setDeliveryMethod(inferredDeliveryMethod);
    }
  }, [department, district, isShippingDelivery, province]);

  useEffect(() => {
    const deliveryFromQuery = searchParams.get("delivery");

    if (deliveryFromQuery) {
      return;
    }

    let cancelled = false;

    async function loadDefaultDeliveryMethod() {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        const user = data.user;

        if (!user) {
          return;
        }

        const metadataAddress = String(user.user_metadata?.direccion || user.user_metadata?.address || "");
        let sourceAddress = metadataAddress;

        if (!sourceAddress) {
          const profileResult = await supabase.from("profiles").select("direccion").eq("id", user.id).maybeSingle();
          sourceAddress = String(profileResult.data?.direccion || "");
        }

        const inferredDeliveryMethod = inferDeliveryMethodFromText(sourceAddress);

        if (!cancelled && inferredDeliveryMethod) {
          setDeliveryMethod(inferredDeliveryMethod);
        }
      } catch {
        // Si no se puede inferir, se conserva el valor por defecto.
      }
    }

    void loadDefaultDeliveryMethod();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  async function validateCoupon(couponCode: string) {
    const coupon = couponCode.trim().toUpperCase();

    if (!coupon) {
      setActiveCoupon(null);
      notify.info("Cupón", "Escribe un código para aplicar descuento.");
      return;
    }

    setValidatingCoupon(true);

    try {
      const supabase = createClient();
      const result = await supabase
        .from("marketing_coupons")
        .select("code,description,discount_type,discount_value,min_subtotal,starts_at,ends_at")
        .ilike("code", coupon)
        .eq("active", true)
        .maybeSingle();

      if (result.error || !result.data) {
        notify.warning("Cupón inválido", "El código ingresado no existe o no está activo.");
        return;
      }

      const data = result.data as CouponRow;
      const now = Date.now();
      const startsAt = data.starts_at ? new Date(data.starts_at).getTime() : null;
      const endsAt = data.ends_at ? new Date(data.ends_at).getTime() : null;

      if (startsAt && startsAt > now) {
        notify.info("Cupón no disponible", "Este cupón aún no está vigente.");
        return;
      }

      if (endsAt && endsAt < now) {
        notify.warning("Cupón vencido", "Este cupón ya no está disponible.");
        return;
      }

      if (subtotal < Number(data.min_subtotal || 0)) {
        notify.info(
          "Monto mínimo no alcanzado",
          `Este cupón requiere mínimo S/ ${Number(data.min_subtotal || 0).toFixed(2)} en productos.`
        );
        return;
      }

      setActiveCoupon(data);
      notify.success("Cupón aplicado", data.description || `Código ${data.code} aplicado.`);
    } finally {
      setValidatingCoupon(false);
    }
  }

  useEffect(() => {
    const couponFromQuery = searchParams.get("coupon");
    if (!couponFromQuery) return;

    void validateCoupon(couponFromQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, subtotal]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (items.length === 0) {
      notify.info("Carrito vacío", "Agrega productos antes de pasar por checkout.");
      return;
    }

    if (isShippingDelivery && paymentConfirmed) {
      const accepted = window.confirm(
        "Aviso importante: tu pago sera revisado por el personal de AMYSA. Si se confirma la recepcion del pago, se realizara el envio a la direccion solicitada."
      );

      if (!accepted) {
        return;
      }
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();

      const response = await fetch("/api/orders/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: data.user?.id || null,
          channel: "checkout_whatsapp",
          paymentMethod: selectedPaymentMethod,
          paymentConfirmed: isShippingDelivery ? paymentConfirmed : false,
          paymentReference: isShippingDelivery ? paymentReference : "",
          deliveryMethod,
          shippingCost,
          discountAmount,
          couponCode: activeCoupon?.code || null,
          subtotal,
          total,
          customer: {
            name,
            documentType,
            documentNumber,
            email,
            phone,
            department,
            province,
            district,
            address,
            note,
          },
          items: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            variantLabel: item.variantLabel,
            personalizationText: item.personalizationText,
          })),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo registrar el pedido");
      }

      const orderId = payload.orderId ? String(payload.orderId) : "";
      const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || DEFAULT_WHATSAPP_PHONE;
      const fullAddress = [
        department ? `Departamento: ${department}` : "",
        province ? `Provincia: ${province}` : "",
        district ? `Distrito: ${district}` : "",
        address ? `Dirección de entrega: ${address}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      const lines = items.map((item, index) => {
        const variantLine = item.variantLabel ? ` | Tipo: ${item.variantLabel}` : "";
        const customLine = item.personalizationText ? ` | Personalizacion: ${item.personalizationText}` : "";
        return `${index + 1}. ${item.name} x ${item.quantity}${variantLine}${customLine}`;
      });

      const message = [
        `Hola AMYSA SHOP, deseo confirmar mi pedido ${orderId ? `#${orderId.slice(0, 8)}` : ""}.`,
        "",
        `Cliente: ${name}`,
        documentNumber ? `Documento: ${documentTypeLabel(documentType)} ${documentNumber}` : `Documento: ${documentTypeLabel(documentType)}`,
        `Telefono: ${phone}`,
        `Correo: ${email}`,
        fullAddress || `Direccion: ${deliveryMethod === "pickup_lima_points" ? "Entrega en punto coordinado" : address}`,
        `Metodo de entrega: ${getDeliveryLabel(deliveryMethod)}`,
        `Metodo de pago elegido: ${paymentMethodLabel(selectedPaymentMethod)}`,
        isShippingDelivery
          ? paymentConfirmed
            ? "Estado de pago: CONFIRMADO por cliente"
            : "Estado de pago: PENDIENTE (solo pedido)"
          : "Estado de pago: No aplica (entrega con encuentro)",
        isShippingDelivery && paymentConfirmed && paymentReference ? `Referencia de pago: ${paymentReference}` : "",
        "",
        "Resumen de checkout:",
        ...lines,
        "",
        `Subtotal: S/ ${Number(subtotal).toFixed(2)}`,
        activeCoupon ? `Cupon ${activeCoupon.code}: -S/ ${Number(discountAmount).toFixed(2)}` : "",
        `Envio: S/ ${Number(shippingCost).toFixed(2)}`,
        `Total final: S/ ${Number(total).toFixed(2)}`,
        note ? `Nota: ${note}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      window.open(buildWhatsAppUrl(whatsappPhone, message), "_blank", "noopener,noreferrer");

      clearCart();
      notify.success("Pedido registrado", "Tu pedido fue validado y registrado correctamente.");
      router.push("/tienda");
      router.refresh();
    } catch (error) {
      notify.error("No se pudo procesar", error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className="space-y-4 pb-8">
        <h1 className="font-[var(--font-display)] text-3xl">Checkout</h1>
        <p className="text-sm text-muted-foreground">Tu carrito está vacío. Agrega productos para continuar.</p>
        <Button asChild>
          <Link href="/tienda">Ir a tienda</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="space-y-5 pb-8">
      <header className="glass-card rounded-3xl p-5">
        <h1 className="font-[var(--font-display)] text-3xl">Checkout</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Completa tus datos y confirma tu pedido por WhatsApp. Sin pasarela automática por el momento.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="glass-card rounded-2xl p-4">
          <h2 className="mb-3 font-semibold">Datos del cliente</h2>
          <form id="checkout-form" className="space-y-3" onSubmit={handleSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nombre completo"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                required
              />
              <div className="grid grid-cols-[112px_1fr] gap-2">
                <select
                  value={documentType}
                  onChange={(event) => setDocumentType(event.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  required
                >
                  {documentTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  value={documentNumber}
                  onChange={(event) => setDocumentNumber(event.target.value)}
                  placeholder="Número de documento"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Correo"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                required
              />
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Teléfono"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                required
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <select
                value={deliveryMethod}
                onChange={(event) => {
                  const nextMethod = event.target.value as DeliveryMethod;
                  setDeliveryMethod(nextMethod);
                  if (nextMethod === "pickup_lima_points") {
                    setPaymentConfirmed(false);
                    setPaymentReference("");
                  }
                }}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {deliveryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} - S/ {option.fee.toFixed(2)}
                  </option>
                ))}
              </select>

              {isShippingDelivery ? (
                <select
                  value={paymentMethod}
                  onChange={(event) => {
                    setPaymentMethod(event.target.value);
                    setPaymentConfirmed(false);
                    setPaymentReference("");
                  }}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {paymentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex h-10 items-center rounded-md border border-input bg-muted/30 px-3 text-sm text-muted-foreground">
                  Metodo de pago: A coordinar con AMYSA
                </div>
              )}
            </div>

            {isShippingDelivery && (
              <div className="space-y-2 rounded-xl border border-input/70 bg-white/70 p-3">
                <p className="text-sm font-medium">Pasarela de pago manual</p>

                {(paymentMethod === "yape" || paymentMethod === "plin") && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Escanea el QR de {paymentMethodLabel(paymentMethod)} para pagar. Luego marca &quot;Confirmar pago&quot;.
                    </p>
                    {(paymentMethod === "yape" && yapeQrUrl) || (paymentMethod === "plin" && plinQrUrl) ? (
                      <img
                        src={paymentMethod === "yape" ? yapeQrUrl : plinQrUrl}
                        alt={`QR ${paymentMethodLabel(paymentMethod)}`}
                        className="h-48 w-48 rounded-xl border bg-white object-cover"
                      />
                    ) : (
                      <div className="rounded-lg border border-dashed border-input p-3 text-xs text-muted-foreground">
                        QR no configurado. Define {paymentMethod === "yape" ? "NEXT_PUBLIC_YAPE_QR_URL" : "NEXT_PUBLIC_PLIN_QR_URL"}.
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === "transferencia" && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Bancos disponibles para transferencia:</p>
                    <ul className="space-y-2 text-xs">
                      {transferBanks.map((bank) => (
                        <li key={bank.bank} className="rounded-lg border border-input bg-background p-2">
                          <p className="font-semibold">{bank.bank}</p>
                          <p>Cuenta: {bank.account}</p>
                          <p>CCI: {bank.cci}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={paymentConfirmed}
                    onChange={(event) => setPaymentConfirmed(event.target.checked)}
                  />
                  Confirmar pago
                </label>

                {paymentConfirmed && (
                  <input
                    value={paymentReference}
                    onChange={(event) => setPaymentReference(event.target.value)}
                    placeholder="Nro. de operación o referencia"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  />
                )}
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-3">
              <SearchableCombobox
                label="Departamento"
                value={department}
                onChange={setDepartment}
                options={departmentOptions}
                placeholder="Buscar departamento"
                required={deliveryMethod !== "pickup_lima_points"}
              />
              <SearchableCombobox
                label="Provincia"
                value={province}
                onChange={setProvince}
                options={provinceOptions}
                placeholder="Buscar provincia"
                required={deliveryMethod !== "pickup_lima_points"}
              />
              <SearchableCombobox
                label="Distrito"
                value={district}
                onChange={setDistrict}
                options={districtOptions}
                placeholder="Buscar distrito"
                required={deliveryMethod !== "pickup_lima_points"}
              />
            </div>

            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder={deliveryMethod === "pickup_lima_points" ? "Referencia para coordinar (opcional)" : "Dirección de entrega"}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              required={deliveryMethod !== "pickup_lima_points"}
            />

            <p className="text-xs text-muted-foreground">
              {deliveryOptions.find((option) => option.value === deliveryMethod)?.description}
            </p>

            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="Nota del pedido (opcional)"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" asChild>
                <Link href="/carrito">Volver al carrito</Link>
              </Button>
            </div>
          </form>
        </section>

        <section className="glass-card rounded-2xl p-4">
          <h2 className="mb-3 font-semibold">Resumen</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-br from-white via-white to-primary/5 p-2 shadow-sm"
              >
                {(() => {
                  const unitBasePrice = item.priceBefore && item.priceBefore > item.price ? Number(item.priceBefore) : item.price;
                  const itemBaseSubtotal = unitBasePrice * item.quantity;
                  const itemSubtotal = item.price * item.quantity;
                  const itemProductDiscount = Math.max(0, itemBaseSubtotal - itemSubtotal);
                  const itemCouponDiscount = subtotal > 0 ? Number(((itemSubtotal / subtotal) * discountAmount).toFixed(2)) : 0;
                  const itemTotal = Math.max(0, itemSubtotal - itemCouponDiscount);

                  return (
                    <div className="flex gap-3">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-muted">
                    <Image
                      src={item.image || DEFAULT_PRODUCT_IMAGE}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1 pr-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{item.name}</p>
                        {item.variantLabel ? <p className="text-xs text-muted-foreground">Tipo: {item.variantLabel}</p> : null}
                      </div>
                      <div className="shrink-0 text-right text-xs">
                        {unitBasePrice > item.price ? <p className="text-muted-foreground line-through">Antes: S/ {unitBasePrice.toFixed(2)}</p> : null}
                        <p className="font-semibold text-foreground">Precio: S/ {item.price.toFixed(2)}</p>
                        <p className="text-muted-foreground">Subtotal: S/ {itemSubtotal.toFixed(2)}</p>
                        {/** Se elimina la visualización del descuento por precio a nivel de producto para simplificar la UI */}
                        {/* itemProductDiscount ocultado intencionalmente */}
                        {itemCouponDiscount > 0 ? <p className="text-emerald-700">Desc. cupón: - S/ {itemCouponDiscount.toFixed(2)}</p> : null}
                        <p className="font-semibold text-primary">Total: S/ {itemTotal.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-muted px-2 py-1">Cantidad: {item.quantity}</span>
                    </div>

                    {item.personalizationText ? (
                      <p className="text-xs text-foreground/80">
                        Personalización: {item.personalizationText}
                      </p>
                    ) : null}
                  </div>
                </div>
                  );
                })()}
              </article>
            ))}
          </div>

          <div className="mt-4">
            <div className="flex gap-2">
              <input
                value={couponInput}
                onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                placeholder="Código de cupón"
                className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
              />
              <Button type="button" variant="outline" onClick={() => validateCoupon(couponInput)} disabled={validatingCoupon}>
                {validatingCoupon ? <Loader2 className="mr-2 size-4 animate-spin" /> : <TicketPercent className="mr-2 size-4" />}
                Aplicar cupón
              </Button>
            </div>
            {activeCoupon ? <p className="mt-2 text-xs text-emerald-700">Cupón activo: {activeCoupon.code}</p> : null}
          </div>

          <p className="mt-3 text-sm">
            Subtotal base: <span className="font-semibold">S/ {subtotalBase.toFixed(2)}</span>
          </p>
          <p className="text-sm text-emerald-700">
            Descuento por precio: <span className="font-semibold">- S/ {productDiscountAmount.toFixed(2)}</span>
          </p>
          <p className="text-sm">
            Subtotal: <span className="font-semibold">S/ {subtotal.toFixed(2)}</span>
          </p>
          <p className="text-sm text-emerald-700">
            Descuento cupón: <span className="font-semibold">- S/ {discountAmount.toFixed(2)}</span>
          </p>
          <p className="text-sm text-emerald-700">
            Monto total ahorrado: <span className="font-semibold">S/ {totalSavings.toFixed(2)}</span>
          </p>
          <p className="text-sm">
            Envio: <span className="font-semibold">S/ {shippingCost.toFixed(2)}</span>
          </p>
          <p className="text-sm">
            Total final: <span className="font-semibold">S/ {total.toFixed(2)}</span>
          </p>

          <Button type="submit" form="checkout-form" className="mt-4 w-full" disabled={submitting}>
            {submitting
              ? "Procesando..."
              : isShippingDelivery && paymentConfirmed
              ? "Confirmar pago y enviar por WhatsApp"
              : "Confirmar pedido por WhatsApp"}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            {isShippingDelivery
              ? 'Si aun no pagaste, se enviara solo el pedido. Si activas "Confirmar pago", tambien se enviara el detalle del pago.'
              : "Entrega por encuentro: AMYSA coordinara contigo punto y horario por WhatsApp."}
          </p>
        </section>
      </div>
    </main>
  );
}
