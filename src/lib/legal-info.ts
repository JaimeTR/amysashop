// Datos del proveedor que la ley exige mostrar (Libro de Reclamaciones, privacidad, términos).
// COMPLETAR con los datos reales del negocio (o definir las variables de entorno).
export const LEGAL_INFO = {
  tradeName: "AMYSA SHOP",
  legalName: process.env.NEXT_PUBLIC_LEGAL_NAME || "",
  ruc: process.env.NEXT_PUBLIC_LEGAL_RUC || "",
  address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || "",
  email: process.env.NEXT_PUBLIC_LEGAL_EMAIL || process.env.CONTACT_TO_EMAIL || "",
  phone: "+51 965 312 386",
  website: "https://amysashop.com",
  lastUpdated: "28 de septiembre de 2026",
};


export const LEGAL_LINKS = [
  { href: "/legal/terminos", label: "Términos y condiciones" },
  { href: "/legal/privacidad", label: "Política de privacidad" },
  { href: "/legal/cookies", label: "Política de cookies" },
  { href: "/ayuda/envios-devoluciones", label: "Cambios y devoluciones" },
  { href: "/libro-de-reclamaciones", label: "Libro de Reclamaciones" },
];
