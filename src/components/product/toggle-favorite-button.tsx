"use client";

import { Star } from "lucide-react";
import type { MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { useNotify } from "@/components/feedback/notification-center";
import { useFavoritesStore } from "@/store/favorites-store";

type Props = {
  productId: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  className?: string;
};

export function ToggleFavoriteButton({
  productId,
  name,
  price,
  image,
  category,
  className,
}: Props) {
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const favorite = useFavoritesStore((state) => state.isFavorite(productId));
  const notify = useNotify();

  function handleToggle(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    toggleFavorite({ productId, name, price, image, category });

    if (favorite) {
      notify.info("Quitado de favoritos", `${name} ya no aparece en tu lista.`);
      return;
    }

    notify.success("Agregado a favoritos", `${name} se guardo en tu lista.`);
  }

  return (
    <Button
      type="button"
      variant={favorite ? "default" : "outline"}
      size="icon"
      onClick={handleToggle}
      aria-label={favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
      aria-pressed={favorite}
      className={`min-h-11 min-w-11 touch-manipulation ${className || ""}`}
    >
      <Star className={`size-4 ${favorite ? "fill-current" : ""}`} />
    </Button>
  );
}
