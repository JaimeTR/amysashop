"use client";

import { useEffect, useState } from "react";
import {
  FALLBACK_AGE_GROUPS,
  FALLBACK_GENDERS,
  normalizeTaxonomyOptions,
} from "@/lib/taxonomies";

type TaxonomyResponse = {
  genders?: string[];
  ageGroups?: string[];
};

export function useRegisteredTaxonomies() {
  const [genderOptions, setGenderOptions] = useState<string[]>(FALLBACK_GENDERS);
  const [ageGroupOptions, setAgeGroupOptions] = useState<string[]>(FALLBACK_AGE_GROUPS);

  useEffect(() => {
    let active = true;

    async function loadTaxonomies() {
      try {
        const response = await fetch("/api/taxonomies", { cache: "no-store" });
        if (!response.ok) return;

        const payload = (await response.json()) as TaxonomyResponse;
        if (!active) return;

        setGenderOptions(normalizeTaxonomyOptions(payload.genders || [], FALLBACK_GENDERS));
        setAgeGroupOptions(normalizeTaxonomyOptions(payload.ageGroups || [], FALLBACK_AGE_GROUPS));
      } catch {
        // Mantener fallback local si la API no está disponible.
      }
    }

    loadTaxonomies();

    return () => {
      active = false;
    };
  }, []);

  return { genderOptions, ageGroupOptions };
}
