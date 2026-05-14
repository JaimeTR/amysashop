"use client";

import Image from "next/image";
import Link from "next/link";
import { Loader2, Minus, Plus, TicketPercent, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DEFAULT_WHATSAPP_PHONE, buildCartWhatsAppMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { deliveryOptions, getDeliveryFee, getDeliveryLabel, type DeliveryMethod } from "@/lib/delivery-options";
import { useCartStore } from "@/store/cart-store";
import { useNotify } from "@/components/feedback/notification-center";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/product-images";

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

export default function CarritoPage() {
  const items = useCartStore((state) => state.items);
  const setItemQuantity = useCartStore((state) => state.setItemQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const notify = useNotify();

  const [couponInput, setCouponInput] = useState("");
  const [activeCoupon, setActiveCoupon] = useState<CouponRow | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("shipping_lima");

  const subtotalBase = items.reduce((acc, item) => {
    const unitBasePrice = item.priceBefore && item.priceBefore > item.price ? Number(item.priceBefore) : item.price;
    return acc + unitBasePrice * item.quantity;
  }, 0);
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const productDiscount = Math.max(0, subtotalBase - subtotal);
  const couponDiscount = resolveCouponDiscount(subtotal, activeCoupon);
  const totalSavings = productDiscount + couponDiscount;
  const shippingCost = getDeliveryFee(deliveryMethod);
  const total = Math.max(0, subtotal - couponDiscount + shippingCost);
  const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || DEFAULT_WHATSAPP_PHONE;
  const waMessage = buildCartWhatsAppMessage(items);
  const waUrl = buildWhatsAppUrl(whatsappPhone, waMessage);
  const checkoutQuery = useMemo(() => {
    const params = new URLSearchParams();
    params.set("delivery", deliveryMethod);

    if (activeCoupon?.code) {
      params.set("coupon", activeCoupon.code);
    }

    return `/checkout?${params.toString()}`;
  }, [activeCoupon?.code, deliveryMethod]);

  function handleRemoveItem(id: string, name: string) {
    removeItem(id);
    notify.removed("Producto eliminado", `${name} se quitó del carrito.`);
  }

  function handleQuantityChange(id: string, nextQuantity: number) {
    setItemQuantity(id, nextQuantity);
  }

  async function handleApplyCoupon() {
    const coupon = couponInput.trim().toUpperCase();

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

  function handleClearCart() {
    if (items.length === 0) {
      notify.info("Carrito vacío", "No hay productos para eliminar.");
      return;
    }

    clearCart();
    notify.warning("Carrito vaciado", "Se eliminaron todos los productos.");
  }

  async function handleSendWhatsApp() {
    if (items.length === 0) {
      notify.info("No hay productos", "Agrega productos antes de consultar por WhatsApp.");
      return;
    }

    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();

      await fetch("/api/orders/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: data.user?.id || null,
          channel: "carrito_whatsapp",
          paymentMethod: "whatsapp",
          deliveryMethod,
          shippingCost,
          discountAmount: couponDiscount,
          couponCode: activeCoupon?.code || null,
          subtotal,
          total,
          customer: {
            name: String(data.user?.user_metadata?.nombre || "Cliente web"),
            email: String(data.user?.email || ""),
            phone: "",
            address: "",
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
    } catch {
      // Mantener compra por WhatsApp aunque falle el registro automático.
    }

    notify.query("Consulta enviada", "Abriendo WhatsApp para confirmar stock y entrega.");
    const extendedMessage = [
      waMessage,
      "",
      `Metodo de entrega: ${getDeliveryLabel(deliveryMethod)}`,
      `Envio: S/ ${shippingCost.toFixed(2)}`,
      activeCoupon ? `Cupon: ${activeCoupon.code} (-S/ ${couponDiscount.toFixed(2)})` : "",
      `Total estimado: S/ ${total.toFixed(2)}`,
    ]
      .filter(Boolean)
      .join("\n");

    window.open(buildWhatsAppUrl(whatsappPhone, extendedMessage), "_blank", "noopener,noreferrer");
  }

  return (
    <main className="space-y-5 pb-8">
      <h1 className="font-[var(--font-display)] text-center text-3xl md:text-left">Carrito</h1>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Tu carrito está vacío.</p>
      ) : (
        <>
          <div className="grid gap-3">
            {items.map((item) => {
              const unitBasePrice = item.priceBefore && item.priceBefore > item.price ? Number(item.priceBefore) : item.price;
              const itemBaseSubtotal = unitBasePrice * item.quantity;
              const itemSubtotal = item.price * item.quantity;
              const itemProductDiscount = Math.max(0, itemBaseSubtotal - itemSubtotal);
              const itemCouponDiscount = subtotal > 0 ? Number(((itemSubtotal / subtotal) * couponDiscount).toFixed(2)) : 0;
              const itemFinal = Math.max(0, itemSubtotal - itemCouponDiscount);

              return (
                <article key={item.id} className="glass-card rounded-2xl p-4">
                  <div className="flex items-start gap-3 md:grid md:grid-cols-[88px_minmax(0,1fr)_auto] md:items-center">
                    <Image
                      src={item.image || DEFAULT_PRODUCT_IMAGE}
                      alt={item.name}
                      width={88}
                      height={88}
                      unoptimized
                      className="size-20 shrink-0 rounded-xl object-cover md:size-[88px]"
                    />

                    <div className="min-w-0 flex-1">
                      <h2 className="line-clamp-2 font-semibold">{item.name}</h2>
                      {item.variantLabel ? (
                        <p className="text-xs text-muted-foreground">Tipo: {item.variantLabel}</p>
                      ) : null}
                      {item.personalizationText ? (
                        <p className="text-xs text-muted-foreground">Personalización: {item.personalizationText}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-muted-foreground">Monto unitario: S/ {item.price.toFixed(2)}</p>
                      <p className="text-sm font-semibold text-primary">Monto: S/ {itemSubtotal.toFixed(2)}</p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2 md:items-end">
                      <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-2 py-1">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          className="grid size-7 place-content-center rounded-full border border-primary/20 text-primary transition hover:bg-primary/10"
                          aria-label="Disminuir cantidad"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="min-w-6 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="grid size-7 place-content-center rounded-full border border-primary/20 text-primary transition hover:bg-primary/10"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id, item.name)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <section className="glass-card space-y-4 rounded-2xl p-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div>
                <p className="mb-2 text-sm font-semibold">Cupón de descuento</p>
                <div className="flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                    placeholder="Ej: AMYSA2026"
                    className="h-10 flex-1 rounded-xl border border-input bg-white px-3 text-sm"
                  />
                  <Button type="button" variant="outline" onClick={handleApplyCoupon} disabled={validatingCoupon}>
                    {validatingCoupon ? <Loader2 className="mr-2 size-4 animate-spin" /> : <TicketPercent className="mr-2 size-4" />}
                    Aplicar
                  </Button>
                </div>
                {activeCoupon ? (
                  <p className="mt-1 text-xs font-semibold text-success-foreground">
                    Cupón activo: {activeCoupon.code} ({activeCoupon.description || "Descuento aplicado"})
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-white/50 bg-white/70 p-3">
              <p className="mb-2 text-sm font-semibold">Metodo de envio o entrega</p>
              <select
                value={deliveryMethod}
                onChange={(event) => setDeliveryMethod(event.target.value as DeliveryMethod)}
                className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm"
              >
                {deliveryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} - S/ {option.fee.toFixed(2)}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-muted-foreground">
                {deliveryOptions.find((option) => option.value === deliveryMethod)?.description}
              </p>
            </div>

            <div className="space-y-1 rounded-2xl border border-white/50 bg-white/70 p-3 text-sm">
              <p className="flex items-center justify-between">
                <span>Subtotal base (precio antes)</span>
                <span className="font-semibold">S/ {subtotalBase.toFixed(2)}</span>
              </p>
              <p className="flex items-center justify-between">
                <span>Subtotal productos</span>
                <span className="font-semibold">S/ {subtotal.toFixed(2)}</span>
              </p>
              <p className="flex items-center justify-between text-success-foreground">
                <span>Descuento por precio</span>
                <span className="font-semibold">- S/ {productDiscount.toFixed(2)}</span>
              </p>
              <p className="flex items-center justify-between text-success-foreground">
                <span>Descuento cupón</span>
                <span className="font-semibold">- S/ {couponDiscount.toFixed(2)}</span>
              </p>
              <p className="flex items-center justify-between text-success-foreground/90">
                <span>Monto total ahorrado</span>
                <span className="font-semibold">S/ {totalSavings.toFixed(2)}</span>
              </p>
              <p className="flex items-center justify-between">
                <span>Envío</span>
                <span className="font-semibold">S/ {shippingCost.toFixed(2)}</span>
              </p>
              <p className="mt-1 flex items-center justify-between border-t border-white/70 pt-2 text-base">
                <span className="font-semibold">Total a pagar</span>
                <span className="font-bold text-primary">S/ {total.toFixed(2)}</span>
              </p>
            </div>

            <Button className="w-full" asChild>
              <Link href={checkoutQuery}>Ir a checkout</Link>
            </Button>
            <Button variant="outline" className="w-full" onClick={handleSendWhatsApp}>
              Enviar pedido por WhatsApp
            </Button>
            <Button variant="outline" className="w-full" onClick={handleClearCart}>
              Vaciar carrito
            </Button>
          </section>
        </>
      )}
    </main>
  );
}
