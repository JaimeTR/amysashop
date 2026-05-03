"use client";

import { useEffect, useState } from "react";

type CategoriesResponse = {
  categories?: string[];
};

export type BrandData = {
  id: string;
  name: string;
  logo?: string;
  color?: string;
};

type BrandsResponse = {
  brands?: BrandData[];
};

export function useCategoriesFromDB() {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      setLoading(true);
      try {
        const response = await fetch("/api/categories", { cache: "no-store" });
        if (!response.ok) return;

        const payload = (await response.json()) as CategoriesResponse;
        if (!active) return;

        setCategories(payload.categories || []);
      } catch {
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  return { categories, loading };
}

export function useBrandsFromDB() {
  const [brands, setBrands] = useState<BrandData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadBrands() {
      setLoading(true);
      try {
        const response = await fetch("/api/brands", { cache: "no-store" });
        if (!response.ok) return;

        const payload = (await response.json()) as BrandsResponse;
        if (!active) return;

        setBrands(payload.brands || []);
      } catch {
        setBrands([]);
      } finally {
        setLoading(false);
      }
    }

    loadBrands();

    return () => {
      active = false;
    };
  }, []);

  return { brands, loading };
}

/**
 * Para componentes que necesitan solo nombres de marcas
 */
export function useBrandNamesFromDB() {
  const { brands, loading } = useBrandsFromDB();
  return { 
    brandNames: brands.map((b) => b.name), 
    loading 
  };
}

/**
 * Para componentes que necesitan objetos Brand completos
 */
export function useBrandObjectsFromDB() {
  const { brands, loading } = useBrandsFromDB();
  return { 
    brands, 
    loading 
  };
}
