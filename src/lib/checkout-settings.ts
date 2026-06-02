import { deliveryOptions, type DeliveryMethod } from "@/lib/delivery-options";

type PaymentMethodKey = "transferencia" | "yape" | "plin";

type PaymentMethodSetting = {
  label: string;
  enabled: boolean;
};

type TransferBankSetting = {
  bank: string;
  account: string;
  cci: string;
  enabled: boolean;
};

type ShippingMethodSetting = {
  label: string;
  description: string;
  fee: number;
};

export type CheckoutSettings = {
  paymentMethods: Record<PaymentMethodKey, PaymentMethodSetting>;
  gateways: {
    yapeQrUrl: string;
    plinQrUrl: string;
  };
  transferBanks: TransferBankSetting[];
  shippingMethods: Record<DeliveryMethod, ShippingMethodSetting>;
};

const defaultShippingMethods: Record<DeliveryMethod, ShippingMethodSetting> = {
  shipping_lima: {
    label: "Envio Lima Metropolitana",
    description: "Tarifa fija para envios en Lima.",
    fee: 10,
  },
  shipping_provincia: {
    label: "Envio a provincia (SHALOM)",
    description: "Tarifa fija para departamentos fuera de Lima.",
    fee: 15,
  },
  pickup_lima_points: {
    label: "Entrega a coordinar con AMYSA",
    description: "Coordinamos por WhatsApp el punto de encuentro y horario en Lima.",
    fee: 0,
  },
};

export const DEFAULT_CHECKOUT_SETTINGS: CheckoutSettings = {
  paymentMethods: {
    transferencia: { label: "Transferencia", enabled: true },
    yape: { label: "Yape", enabled: true },
    plin: { label: "Plin", enabled: true },
  },
  gateways: {
    yapeQrUrl: process.env.NEXT_PUBLIC_YAPE_QR_URL || "",
    plinQrUrl: process.env.NEXT_PUBLIC_PLIN_QR_URL || "",
  },
  transferBanks: [
    {
      bank: "BCP",
      account: process.env.NEXT_PUBLIC_BANK_BCP_ACCOUNT || "",
      cci: process.env.NEXT_PUBLIC_BANK_BCP_CCI || "",
      enabled: true,
    },
    {
      bank: "Interbank",
      account: process.env.NEXT_PUBLIC_BANK_INTERBANK_ACCOUNT || "",
      cci: process.env.NEXT_PUBLIC_BANK_INTERBANK_CCI || "",
      enabled: true,
    },
    {
      bank: "BBVA",
      account: process.env.NEXT_PUBLIC_BANK_BBVA_ACCOUNT || "",
      cci: process.env.NEXT_PUBLIC_BANK_BBVA_CCI || "",
      enabled: true,
    },
  ],
  shippingMethods: defaultShippingMethods,
};

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback = true) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "on", "yes"].includes(normalized)) return true;
    if (["false", "0", "off", "no"].includes(normalized)) return false;
  }
  return fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeCheckoutSettings(value: unknown): CheckoutSettings {
  const raw = asRecord(value);
  const rawPaymentMethods = asRecord(raw.paymentMethods);
  const rawGateways = asRecord(raw.gateways);
  const rawTransferBanks = Array.isArray(raw.transferBanks) ? raw.transferBanks : [];
  const rawShippingMethods = asRecord(raw.shippingMethods);

  const transferBanks = DEFAULT_CHECKOUT_SETTINGS.transferBanks.map((defaultBank, index) => {
    const directMatch = rawTransferBanks.find((item) => asString((item as Record<string, unknown>).bank, "").trim().toUpperCase() === defaultBank.bank.toUpperCase());
    const bankSource = asRecord(directMatch || rawTransferBanks[index]);

    return {
      bank: asString(bankSource.bank, defaultBank.bank).trim() || defaultBank.bank,
      account: asString(bankSource.account, defaultBank.account),
      cci: asString(bankSource.cci, defaultBank.cci),
      enabled: asBoolean(bankSource.enabled, defaultBank.enabled),
    };
  });

  const shippingMethods = (Object.keys(defaultShippingMethods) as DeliveryMethod[]).reduce<CheckoutSettings["shippingMethods"]>((acc, key) => {
    const source = asRecord(rawShippingMethods[key]);
    const fallback = defaultShippingMethods[key];

    acc[key] = {
      label: asString(source.label, fallback.label),
      description: asString(source.description, fallback.description),
      fee: asNumber(source.fee, fallback.fee),
    };

    return acc;
  }, {} as CheckoutSettings["shippingMethods"]);

  return {
    paymentMethods: {
      transferencia: {
        label: asString(asRecord(rawPaymentMethods.transferencia).label, DEFAULT_CHECKOUT_SETTINGS.paymentMethods.transferencia.label),
        enabled: asBoolean(asRecord(rawPaymentMethods.transferencia).enabled, DEFAULT_CHECKOUT_SETTINGS.paymentMethods.transferencia.enabled),
      },
      yape: {
        label: asString(asRecord(rawPaymentMethods.yape).label, DEFAULT_CHECKOUT_SETTINGS.paymentMethods.yape.label),
        enabled: asBoolean(asRecord(rawPaymentMethods.yape).enabled, DEFAULT_CHECKOUT_SETTINGS.paymentMethods.yape.enabled),
      },
      plin: {
        label: asString(asRecord(rawPaymentMethods.plin).label, DEFAULT_CHECKOUT_SETTINGS.paymentMethods.plin.label),
        enabled: asBoolean(asRecord(rawPaymentMethods.plin).enabled, DEFAULT_CHECKOUT_SETTINGS.paymentMethods.plin.enabled),
      },
    },
    gateways: {
      yapeQrUrl: asString(rawGateways.yapeQrUrl, DEFAULT_CHECKOUT_SETTINGS.gateways.yapeQrUrl),
      plinQrUrl: asString(rawGateways.plinQrUrl, DEFAULT_CHECKOUT_SETTINGS.gateways.plinQrUrl),
    },
    transferBanks,
    shippingMethods,
  };
}

export function getPaymentOptionsFromSettings(settings: CheckoutSettings) {
  return (Object.entries(settings.paymentMethods) as Array<[PaymentMethodKey, PaymentMethodSetting]>)
    .filter(([, item]) => item.enabled)
    .map(([value, item]) => ({ value, label: item.label }));
}

export function getTransferBanksFromSettings(settings: CheckoutSettings) {
  return settings.transferBanks.filter((item) => item.enabled);
}

export function getDeliveryOptionsFromSettings(settings: CheckoutSettings) {
  return deliveryOptions.map((option) => {
    const configured = settings.shippingMethods[option.value];

    return {
      ...option,
      label: configured?.label || option.label,
      description: configured?.description || option.description,
      fee: configured?.fee ?? option.fee,
    };
  });
}

export function getDeliveryFeeFromSettings(method: DeliveryMethod, settings: CheckoutSettings) {
  return settings.shippingMethods[method]?.fee ?? defaultShippingMethods[method].fee;
}
