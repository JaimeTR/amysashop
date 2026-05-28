type ProductLike = {
  id?: string;
  productId?: string;
  name: string;
};

function slugify(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function getProductSlug(product: ProductLike) {
  const slug = slugify(product.name);
  return slug;
}

export function getProductUrl(product: ProductLike) {
  return `/producto/${getProductSlug(product)}`;
}

export function slugifyProductName(name: string) {
  return slugify(name);
}