export type DeliveryMethod = "pickup_lima_points" | "shipping_lima" | "shipping_provincia";

export const deliveryOptions: Array<{
  value: DeliveryMethod;
  label: string;
  description: string;
  fee: number;
}> = [
  {
    value: "shipping_lima",
    label: "Envio Lima Metropolitana",
    description: "Tarifa fija para envios en Lima.",
    fee: 10,
  },
  {
    value: "shipping_provincia",
    label: "Envio a provincia (SHALOM)",
    description: "Tarifa fija para departamentos fuera de Lima.",
    fee: 15,
  },
  {
    value: "pickup_lima_points",
    label: "Entrega a coordinar con AMYSA",
    description: "Coordinamos por WhatsApp el punto de encuentro y horario en Lima.",
    fee: 0,
  },
];

export function getDeliveryFee(method: DeliveryMethod) {
  return deliveryOptions.find((option) => option.value === method)?.fee ?? 0;
}

export function getDeliveryLabel(method: DeliveryMethod) {
  return deliveryOptions.find((option) => option.value === method)?.label || "No definido";
}
