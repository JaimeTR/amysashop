"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CartItem } from "@/lib/types";

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id" | "quantity">) => void;
  setItemQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

function buildOptionSignature(item: Omit<CartItem, "id" | "quantity">) {
  const variant = (item.variantLabel || "").trim().toLowerCase();
  const personalization = (item.personalizationText || "").trim().toLowerCase();
  return `${item.productId}::${variant}::${personalization}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const optionSignature = buildOptionSignature(item);
          const existing = state.items.find((x) => x.optionSignature === optionSignature);

          if (existing) {
            return {
              items: state.items.map((x) =>
                x.optionSignature === optionSignature ? { ...x, quantity: x.quantity + 1 } : x
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                ...item,
                id: crypto.randomUUID(),
                quantity: 1,
                optionSignature,
              },
            ],
          };
        }),
      setItemQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  quantity: Math.max(1, Math.trunc(quantity) || 1),
                }
              : item
          ),
        })),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "amysa_cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
