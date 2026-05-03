"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { useNotify } from "@/components/feedback/notification-center";
import { buildCartWhatsAppMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

type Props = {
  productId: string;
  name: string;
  price: number;
  priceBefore?: number | null;
  image?: string;
  category: string;
  whatsappPhone: string;
  colorOptions?: string[];
  volumeOptions?: string[];
  sizeOptions?: string[];
};

const ringTypes = [
  "Anillo Clásico",
  "Anillo Compromiso",
  "Anillo Sello",
  "Anillo Minimal",
  "Anillo Ajustable",
];

function isRingCategory(category: string) {
  return category.toLowerCase().includes("anillo");
}

export function ProductDetailPurchase({
  productId,
  name,
  price,
  priceBefore,
  image,
  category,
  whatsappPhone,
  colorOptions = [],
  volumeOptions = [],
  sizeOptions = [],
}: Props) {
  const ringMode = isRingCategory(category);
  const notify = useNotify();
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(colorOptions[0] ?? "");
  const [selectedVolume, setSelectedVolume] = useState(volumeOptions[0] ?? "");
  const [selectedSize, setSelectedSize] = useState(sizeOptions[0] ?? "");
  const [variantLabel, setVariantLabel] = useState(ringMode ? ringTypes[0] : "");
  const [personalizationText, setPersonalizationText] = useState("");

  const composedVariant = useMemo(() => {
    const parts = [
      ringMode ? variantLabel : "",
      selectedColor ? `Color: ${selectedColor}` : "",
      selectedVolume ? `Contenido: ${selectedVolume}` : "",
      selectedSize ? `Medida: ${selectedSize}` : "",
    ].filter(Boolean);

    return parts.join(" | ");
  }, [ringMode, selectedColor, selectedSize, selectedVolume, variantLabel]);

  const waUrl = useMemo(() => {
    const message = buildCartWhatsAppMessage([
      {
        id: `${productId}-preview`,
        productId,
        name,
        price,
        priceBefore,
        quantity,
        image,
        variantLabel: composedVariant || undefined,
        personalizationText: ringMode && personalizationText.trim() ? personalizationText.trim() : undefined,
      },
    ]);

    return buildWhatsAppUrl(whatsappPhone, message);
  }, [composedVariant, image, name, personalizationText, price, priceBefore, productId, quantity, ringMode, whatsappPhone]);

  function openWhatsApp() {
    notify.query("Consulta abierta", "Te llevamos a WhatsApp para confirmar el pedido.");
    window.open(waUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="grid gap-2.5 sm:gap-3 w-full">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Yambal de AMYSA</p>

      <section className="glass-card space-y-2.5 sm:space-y-3 rounded-2xl p-3 sm:p-4">
        <div className="grid gap-1">
          <label htmlFor="detail-quantity" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Cantidad
          </label>
          <div className="flex h-10 w-full max-w-[220px] items-center justify-between rounded-md border border-input bg-background px-3">
            <button
              type="button"
              className="text-xl leading-none text-foreground"
              onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
              aria-label="Restar cantidad"
            >
              -
            </button>
            <span id="detail-quantity" className="text-base font-semibold text-foreground">{quantity}</span>
            <button
              type="button"
              className="text-xl leading-none text-foreground"
              onClick={() => setQuantity((prev) => Math.min(99, prev + 1))}
              aria-label="Sumar cantidad"
            >
              +
            </button>
          </div>
        </div>

        {colorOptions.length > 0 ? (
          <div className="grid gap-1">
            <label htmlFor="detail-color" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Color
            </label>
            <select
              id="detail-color"
              value={selectedColor}
              onChange={(event) => setSelectedColor(event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {colorOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {volumeOptions.length > 0 ? (
          <div className="grid gap-1">
            <label htmlFor="detail-volume" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Mililitros
            </label>
            <select
              id="detail-volume"
              value={selectedVolume}
              onChange={(event) => setSelectedVolume(event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {volumeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {sizeOptions.length > 0 ? (
          <div className="grid gap-1">
            <label htmlFor="detail-size" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tamaño / mm
            </label>
            <select
              id="detail-size"
              value={selectedSize}
              onChange={(event) => setSelectedSize(event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {sizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </section>

      {ringMode ? (
        <section className="glass-card space-y-3 rounded-2xl p-4">
          <p className="text-sm font-semibold">Personaliza tu anillo</p>
          <div className="grid gap-1">
            <label htmlFor="ring-type" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tipo de anillo
            </label>
            <select
              id="ring-type"
              value={variantLabel}
              onChange={(event) => setVariantLabel(event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {ringTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1">
            <label htmlFor="ring-personalization" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Texto personalizado
            </label>
            <input
              id="ring-personalization"
              value={personalizationText}
              onChange={(event) => setPersonalizationText(event.target.value.slice(0, 24))}
              placeholder="Ej: J&J, 14.02.2026"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
            <p className="text-xs text-muted-foreground">Hasta 24 caracteres.</p>
          </div>
        </section>
      ) : null}

      <AddToCartButton
        productId={productId}
        name={name}
        price={price}
        priceBefore={priceBefore}
        image={image}
        quantity={quantity}
        variantLabel={composedVariant || undefined}
        personalizationText={ringMode ? personalizationText.trim() || undefined : undefined}
      />

      <Button variant="outline" className="w-full" onClick={openWhatsApp}>
        Comprar por WhatsApp
      </Button>
    </div>
  );
}
