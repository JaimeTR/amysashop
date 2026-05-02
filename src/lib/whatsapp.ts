import { CartItem } from "@/lib/types";

export const DEFAULT_WHATSAPP_PHONE = "51965312386";
export const DEFAULT_WHATSAPP_DISPLAY_PHONE = "965 312 386";

const moneyFormatter = new Intl.NumberFormat("es-PE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatSoles(value: number) {
  return `S/ ${moneyFormatter.format(value)}`;
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export function buildWhatsAppUrl(phone: string, message: string) {
  const normalizedPhone = normalizePhone(phone);
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

export function buildCartWhatsAppMessage(items: CartItem[]) {
  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const lines = items.map((item, index) => {
    const subtotal = item.price * item.quantity;
    const variantLine = item.variantLabel ? `\n   Tipo: ${item.variantLabel}` : "";
    const personalizationLine = item.personalizationText
      ? `\n   Personalizacion: ${item.personalizationText}`
      : "";

    return `${index + 1}. ${item.name}${variantLine}${personalizationLine}\n   Cantidad: ${item.quantity}\n   Precio: ${formatSoles(item.price)}\n   Subtotal: ${formatSoles(subtotal)}`;
  });

  return [
    "Hola AMYSA SHOP, quiero realizar este pedido:",
    "",
    ...lines,
    "",
    `Total del carrito: ${formatSoles(total)}`,
    "",
    "¿Me ayudan con la confirmacion de stock y entrega, por favor?",
  ].join("\n");
}
