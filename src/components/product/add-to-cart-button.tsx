"use client";

import { ShoppingCart } from "lucide-react";
import type { MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { useNotify } from "@/components/feedback/notification-center";

type Props = {
  productId: string;
  name: string;
  price: number;
  priceBefore?: number | null;
  image?: string;
  quantity?: number;
  variantLabel?: string;
  personalizationText?: string;
  buttonLabel?: string;
};

export function AddToCartButton({
  productId,
  name,
  price,
  priceBefore,
  image,
  quantity = 1,
  variantLabel,
  personalizationText,
  buttonLabel,
}: Props) {
  const addItem = useCartStore((state) => state.addItem);
  const notify = useNotify();

  function handleAddToCart(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const safeQuantity = Math.max(1, Number(quantity) || 1);

    for (let index = 0; index < safeQuantity; index += 1) {
      addItem({ productId, name, price, priceBefore, image, variantLabel, personalizationText });
    }

    notify.success("Agregado al carrito", `${name} se añadió correctamente.`);
  }

  return (
    <Button
      type="button"
      onClick={handleAddToCart}
      className="h-auto w-full touch-manipulation py-2.5 sm:py-3"
    >
      <ShoppingCart className="mr-2 size-4 flex-shrink-0" />
      <span>{buttonLabel || "Agregar al carrito"}</span>
    </Button>
  );
}
