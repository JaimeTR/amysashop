import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, MessageCircle, XCircle } from "lucide-react";
import { getCheckoutSettings } from "@/lib/checkout-settings-server";
import { getTransferBanksFromSettings } from "@/lib/checkout-settings";
import { getDigitalOrderById } from "@/lib/digital-store";
import { DIGITAL_PAYMENT_LABELS, formatSoles } from "@/lib/digital-types";
import { isOptimizableImageSrc } from "@/lib/product-images";
import { buildWhatsAppUrl, DEFAULT_WHATSAPP_PHONE } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tu pedido digital",
  robots: { index: false, follow: false },
};

// Página que ve el cliente después de pedir: instrucciones de pago y envío del comprobante.
// El id del pedido (UUID) solo lo conoce quien hizo el pedido.
export default async function DigitalOrderPage({ params }: { params: { id: string } }) {
  const order = await getDigitalOrderById(params.id);
  if (!order) notFound();

  const settings = await getCheckoutSettings();
  const banks = getTransferBanksFromSettings(settings).filter((bank) => bank.account || bank.cci);
  const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || DEFAULT_WHATSAPP_PHONE;
  const qrUrl =
    order.paymentMethod === "yape" ? settings.gateways.yapeQrUrl : order.paymentMethod === "plin" ? settings.gateways.plinQrUrl : "";

  const whatsappMessage = [
    `Hola AMYSA, envío el comprobante de mi pedido digital ${order.code}.`,
    `Producto: ${order.productName} (${formatSoles(order.amount)})`,
    `Método: ${DIGITAL_PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}`,
    `Correo para la descarga: ${order.email}`,
  ].join("\n");
  const whatsappUrl = buildWhatsAppUrl(whatsappPhone, whatsappMessage);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="glass-card space-y-6 rounded-3xl p-6 sm:p-8">
        <header className="space-y-2 text-center">
          {order.status === "completed" ? (
            <CheckCircle2 className="mx-auto size-10 text-success" />
          ) : order.status === "cancelled" ? (
            <XCircle className="mx-auto size-10 text-destructive" />
          ) : (
            <Clock className="mx-auto size-10 text-primary" />
          )}
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/80">Pedido {order.code}</p>
          <h1 className="font-[var(--font-display)] text-3xl">
            {order.status === "completed"
              ? "¡Pago confirmado!"
              : order.status === "cancelled"
                ? "Pedido cancelado"
                : `Gracias, ${order.customerName.split(" ")[0]}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {order.productName} · <strong className="text-foreground">{formatSoles(order.amount)}</strong>
          </p>
        </header>

        {order.status === "completed" ? (
          <p className="rounded-2xl bg-success/10 p-4 text-center text-sm text-foreground">
            Te enviamos un correo a <strong>{order.email}</strong> con el enlace para descargar tus archivos. Revisa también la carpeta de spam.
          </p>
        ) : order.status === "pending" ? (
          <>
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">1. Realiza el pago</h2>
              {order.paymentMethod === "whatsapp" ? (
                <p className="text-sm text-muted-foreground">Coordina el pago por WhatsApp con nuestro equipo.</p>
              ) : null}

              {qrUrl ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-white p-4">
                  <p className="text-sm font-semibold">Escanea con {DIGITAL_PAYMENT_LABELS[order.paymentMethod]}</p>
                  <Image src={qrUrl} alt={`QR ${DIGITAL_PAYMENT_LABELS[order.paymentMethod]}`} width={220} height={220} unoptimized={!isOptimizableImageSrc(qrUrl)} className="size-56 object-contain" />
                  <p className="text-sm">
                    Monto: <strong>{formatSoles(order.amount)}</strong>
                  </p>
                </div>
              ) : null}

              {order.paymentMethod === "transferencia" && banks.length > 0 ? (
                <ul className="space-y-2">
                  {banks.map((bank) => (
                    <li key={bank.bank} className="rounded-2xl border border-border/60 bg-white p-3 text-sm">
                      <p className="font-semibold">{bank.bank}</p>
                      {bank.account ? <p>Cuenta: {bank.account}</p> : null}
                      {bank.cci ? <p>CCI: {bank.cci}</p> : null}
                    </li>
                  ))}
                </ul>
              ) : null}

              {(order.paymentMethod === "yape" || order.paymentMethod === "plin") && !qrUrl ? (
                <p className="text-sm text-muted-foreground">
                  Te enviaremos los datos de {DIGITAL_PAYMENT_LABELS[order.paymentMethod]} por WhatsApp.
                </p>
              ) : null}
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">2. Envía tu comprobante</h2>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-white transition hover:bg-[#1eb957]"
              >
                <MessageCircle className="size-4" /> Enviar comprobante por WhatsApp
              </a>
            </section>

            <section className="space-y-1">
              <h2 className="text-lg font-semibold">3. Recibe tus archivos</h2>
              <p className="text-sm text-muted-foreground">
                Al confirmar el pago te enviaremos un correo a <strong className="text-foreground">{order.email}</strong> con el enlace de descarga.
              </p>
            </section>
          </>
        ) : (
          <p className="text-center text-sm text-muted-foreground">Si crees que es un error, escríbenos por WhatsApp.</p>
        )}

        <div className="flex flex-wrap justify-center gap-3 pt-2 text-sm">
          <Link href="/digital" className="font-semibold text-primary hover:underline">
            Ver más productos
          </Link>
          <Link href="/digital/descargas" className="font-semibold text-primary hover:underline">
            Mis descargas
          </Link>
        </div>
      </div>
    </div>
  );
}
