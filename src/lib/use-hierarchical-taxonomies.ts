"use client";

import { useEffect, useState } from "react";

type HierarchicalTaxonomyResponse = {
  subcategories?: { id: string; name: string }[];
  subbrands?: { id: string; name: string }[];
};

export function useHierarchicalTaxonomies() {
  const [subcategories, setSubcategories] = useState<{ id: string; name: string }[]>([]);
  const [subbrands, setSubbrands] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadSubcategoriesForCategory(categoryId: string) {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/hierarchical-taxonomies?categoryId=${encodeURIComponent(categoryId)}`);
      if (response.ok) {
        const data = (await response.json()) as HierarchicalTaxonomyResponse;
        setSubcategories(data.subcategories || []);
      }
    } catch {
      setSubcategories([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadSubbrandsForBrand(brandId: string) {
    if (!brandId) {
      setSubbrands([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/hierarchical-taxonomies?brandId=${encodeURIComponent(brandId)}`);
      if (response.ok) {
        const data = (await response.json()) as HierarchicalTaxonomyResponse;
        setSubbrands(data.subbrands || []);
      }
    } catch {
      setSubbrands([]);
    } finally {
      setLoading(false);
    }
  }

  return { subcategories, subbrands, loading, loadSubcategoriesForCategory, loadSubbrandsForBrand };
}
