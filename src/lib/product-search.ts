type SearchableProduct = {
  name?: string | null;
  description?: string | null;
  summary?: string | null;
  content?: string | null;
  category?: string | null;
  brand?: string | null;
  gender?: string | null;
};

export function normalizeSearchText(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function getProductSearchText(product: SearchableProduct) {
  const gender = String(product.gender || "").trim().toLowerCase();
  const genderAliases =
    gender.startsWith("hom") || gender === "male" || gender === "man"
      ? " hombre men man male masculino "
      : gender.startsWith("muj") || gender === "female" || gender === "woman"
        ? " mujer women woman female femenino "
        : gender.startsWith("uni")
          ? " unisex unisex genderless "
          : "";

  return normalizeSearchText(
    [product.name, product.description, product.summary, product.content, product.category, product.brand, genderAliases]
      .filter(Boolean)
      .join(" ")
  );
}

export function productMatchesSearch(product: SearchableProduct, query: string) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  return getProductSearchText(product).includes(normalizedQuery);
}