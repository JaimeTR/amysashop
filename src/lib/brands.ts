/**
 * Configuración centralizada de marcas con logos
 */

export type Brand = {
  id: string;
  name: string;
  logo: string;
  description?: string;
  color?: string;
};

export const REGISTERED_BRANDS: Brand[] = [
  {
    id: "amysa",
    name: "AMYSA",
    logo: "/logos/LOGO AMYSA SHOP.png",
    description: "Línea de productos seleccionados",
    color: "#E74C3C",
  },
  {
    id: "cyzone",
    name: "CYZONE",
    logo: "/logos/cyzone.jpg",
    description: "Línea de cosméticos de Yanbal",
    color: "#FF6B6B",
  },
  {
    id: "esika",
    name: "ESIKA",
    logo: "/logos/esika.png",
    description: "Línea premium de cosméticos",
    color: "#4ECDC4",
  },
  {
    id: "lbel",
    name: "LBEL",
    logo: "/logos/lbel.png",
    description: "Línea de maquillaje profesional",
    color: "#FFB700",
  },
  {
    id: "natura",
    name: "NATURA",
    logo: "/logos/natura.png",
    description: "Productos naturales y cosméticos",
    color: "#2ECC71",
  },
  {
    id: "yanbal",
    name: "YANBAL",
    logo: "/logos/yambal.png",
    description: "Marca principal de belleza",
    color: "#9B59B6",
  },
];

export const BRANDS: Record<string, Brand> = Object.fromEntries(REGISTERED_BRANDS.map((brand) => [brand.id, brand]));

const BRAND_ALIASES: Record<string, string> = {
  amysa: "AMYSA",
  "amysa shop": "AMYSA",
  "amysa secret": "AMYSA",
  "amiyza secret": "AMYSA",
  cyzone: "CYZONE",
  esika: "ESIKA",
  "ésika": "ESIKA",
  lbel: "LBEL",
  natura: "NATURA",
  yanbal: "YANBAL",
  yambal: "YANBAL",
};

function normalizeLabel(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function getRegisteredBrands(): Brand[] {
  return [...REGISTERED_BRANDS];
}

export function getRegisteredBrandNames(): string[] {
  return REGISTERED_BRANDS.map((brand) => brand.name);
}

export function canonicalizeBrandName(name: string) {
  const normalized = normalizeLabel(name);
  if (!normalized) {
    return "";
  }

  return BRAND_ALIASES[normalized] || REGISTERED_BRANDS.find((brand) => normalizeLabel(brand.name) === normalized)?.name || String(name || "").trim();
}

/**
 * Obtener marca por nombre (normalizado)
 */
export function getBrandByName(name: string): Brand | undefined {
  const canonicalName = canonicalizeBrandName(name);
  const normalized = normalizeLabel(canonicalName);

  return REGISTERED_BRANDS.find((brand) => normalizeLabel(brand.name) === normalized || normalizeLabel(brand.id) === normalized);
}

/**
 * Obtener todas las marcas
 */
export function getAllBrands(): Brand[] {
  return getRegisteredBrands();
}

/**
 * Verificar si un nombre es una marca válida
 */
export function isBrand(name: string): boolean {
  return Boolean(getBrandByName(name));
}
