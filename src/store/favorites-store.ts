"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type FavoriteItem = {
  productId: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  addedAt: string;
};

type FavoritesState = {
  items: FavoriteItem[];
  addFavorite: (item: Omit<FavoriteItem, "addedAt">) => void;
  removeFavorite: (productId: string) => void;
  toggleFavorite: (item: Omit<FavoriteItem, "addedAt">) => void;
  isFavorite: (productId: string) => boolean;
  clearFavorites: () => void;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],
      addFavorite: (item) =>
        set((state) => {
          if (state.items.some((favorite) => favorite.productId === item.productId)) {
            return state;
          }

          return {
            items: [{ ...item, addedAt: new Date().toISOString() }, ...state.items],
          };
        }),
      removeFavorite: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),
      toggleFavorite: (item) => {
        const exists = get().items.some((favorite) => favorite.productId === item.productId);

        if (exists) {
          set((state) => ({
            items: state.items.filter((favorite) => favorite.productId !== item.productId),
          }));
          return;
        }

        set((state) => ({
          items: [{ ...item, addedAt: new Date().toISOString() }, ...state.items],
        }));
      },
      isFavorite: (productId) => get().items.some((item) => item.productId === productId),
      clearFavorites: () => set({ items: [] }),
    }),
    {
      name: "amysa-favorites",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
