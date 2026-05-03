export const FALLBACK_GENDERS = ["Hombre", "Mujer", "Unisex"];
export const FALLBACK_AGE_GROUPS = ["Adultos", "Jóvenes", "Niños"];

function normalizeLabel(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function normalizeTaxonomyOptions(values: string[], fallback: string[]) {
  const seen = new Map<string, string>();

  for (const raw of values) {
    const label = String(raw || "").trim();
    if (!label) continue;

    const key = normalizeLabel(label);
    if (!seen.has(key)) {
      seen.set(key, label);
    }
  }

  const normalized = Array.from(seen.values()).sort((a, b) => a.localeCompare(b, "es"));
  return normalized.length > 0 ? normalized : fallback;
}

/**
 * @deprecated: Usar el hook useRegisteredTaxonomies() en componentes cliente en su lugar.
 * Las opciones de género y edad ahora se cargan desde BD mediante /api/taxonomies
 */
export function getRegisteredGenders(): string[] {
  return FALLBACK_GENDERS;
}

/**
 * @deprecated: Usar el hook useRegisteredTaxonomies() en componentes cliente en su lugar.
 * Las opciones de género y edad ahora se cargan desde BD mediante /api/taxonomies
 */
export function getRegisteredAgeGroups(): string[] {
  return FALLBACK_AGE_GROUPS;
}
