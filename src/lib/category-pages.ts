// Páginas de categoría indexables (/tienda/<slug>). `category` debe coincidir con el nombre
// de la categoría en la BD (se compara sin tildes ni mayúsculas).
export type CategoryPageConfig = {
  slug: string;
  category: string;
  title: string;
  description: string;
  intro: string;
  keywords: string[];
};

export const CATEGORY_PAGES: CategoryPageConfig[] = [
  {
    slug: "perfumes",
    category: "Perfume",
    title: "Perfumes y fragancias",
    description:
      "Compra perfumes y fragancias de Ésika, L'Bel, Cyzone y Yanbal en AMYSA SHOP. Envío a Lima y provincias.",
    intro:
      "Fragancias para mujer, hombre y unisex de las marcas de catálogo más populares del Perú. Elige tu perfume, paga con Yape, Plin o transferencia y recíbelo en Lima o en provincia.",
    keywords: ["perfumes", "fragancias", "perfumes Perú", "perfumes Ésika", "perfumes L'Bel", "perfumes Yanbal"],
  },
  {
    slug: "maquillaje",
    category: "Maquillaje",
    title: "Maquillaje",
    description:
      "Maquillaje de Ésika, Cyzone, L'Bel y más marcas de catálogo en AMYSA SHOP: labiales, bases, sombras y más con envío a todo el Perú.",
    intro:
      "Labiales, bases, sombras, delineadores y todo lo que necesitas para tu look, de marcas de catálogo reconocidas. Envío a Lima y provincias.",
    keywords: ["maquillaje", "labiales", "bases de maquillaje", "maquillaje Cyzone", "maquillaje Ésika", "maquillaje Perú"],
  },
  {
    slug: "cuidado-corporal",
    category: "Cuidado personal",
    title: "Cuidado personal y corporal",
    description:
      "Cremas, desodorantes, cuidado del cabello y productos de cuidado personal de marcas de catálogo en AMYSA SHOP. Envío a todo el Perú.",
    intro:
      "Productos para el cuidado de tu piel, cuerpo y cabello: cremas, desodorantes, colonias, shampoo y más, con envío a Lima y provincias.",
    keywords: ["cuidado personal", "cuidado corporal", "cremas", "desodorantes", "cuidado del cabello"],
  },
  {
    slug: "joyas-y-accesorios",
    category: "Joyas y accesorios",
    title: "Joyas y accesorios",
    description: "Joyas, bisutería y accesorios en AMYSA SHOP: aretes, collares, anillos y más para regalar o para ti. Envío a todo el Perú.",
    intro: "Aretes, collares, pulseras, anillos y accesorios para complementar tu estilo o para regalar.",
    keywords: ["joyas", "bisutería", "accesorios", "aretes", "collares", "anillos"],
  },
  {
    slug: "packs",
    category: "Packs Amysa",
    title: "Packs y regalos",
    description: "Packs y sets de regalo de perfumería y belleza armados por AMYSA SHOP. Ideales para regalar, con envío a todo el Perú.",
    intro: "Combinaciones de productos armadas por AMYSA, pensadas para regalar en cumpleaños, aniversarios y fechas especiales.",
    keywords: ["packs de regalo", "sets de perfume", "regalos", "packs de belleza"],
  },
];

export function getCategoryPage(slug: string) {
  return CATEGORY_PAGES.find((item) => item.slug === slug) ?? null;
}

function normalize(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function getCategoryPageByName(categoryName: string) {
  const key = normalize(categoryName);
  return CATEGORY_PAGES.find((item) => normalize(item.category) === key) ?? null;
}

export function matchCategoryName(config: CategoryPageConfig, categories: string[]) {
  const key = normalize(config.category);
  return categories.find((name) => normalize(name) === key) ?? config.category;
}

// Enlace preferido para una categoría: su página propia si existe, si no el filtro de /tienda.
export function getCategoryHref(categoryName: string) {
  const page = getCategoryPageByName(categoryName);
  return page ? `/tienda/${page.slug}` : `/tienda?categoria=${encodeURIComponent(categoryName)}`;
}
