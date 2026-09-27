// Tipos y utilidades de la tienda digital compartidos entre servidor y cliente.

export type DigitalProductType = "plantilla" | "libro" | "curso" | "guia" | "pack" | "otro";

export const DIGITAL_PRODUCT_TYPES: Record<DigitalProductType, { label: string; plural: string }> = {
  plantilla: { label: "Plantilla", plural: "Plantillas" },
  libro: { label: "Libro digital", plural: "Libros digitales" },
  curso: { label: "Curso", plural: "Cursos" },
  guia: { label: "Guía", plural: "Guías" },
  pack: { label: "Pack", plural: "Packs" },
  otro: { label: "Digital", plural: "Otros" },
};

export type DigitalProduct = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string;
  productType: DigitalProductType;
  features: string[];
  idealFor: string | null;
  price: number;
  priceBefore: number | null;
  coverUrl: string | null;
  previewImages: string[];
  active: boolean;
  featured: boolean;
  sortOrder: number;
  updatedAt: string | null;
};

// Información de un archivo que se puede mostrar al público (sin ruta de almacenamiento).
export type DigitalFileInfo = {
  id: string;
  productId: string;
  name: string;
  description: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  sortOrder: number;
};

export type DigitalOrderStatus = "pending" | "completed" | "cancelled";
export type DigitalPaymentMethod = "yape" | "plin" | "transferencia" | "whatsapp" | "otro";

export const DIGITAL_PAYMENT_LABELS: Record<DigitalPaymentMethod, string> = {
  yape: "Yape",
  plin: "Plin",
  transferencia: "Transferencia",
  whatsapp: "WhatsApp",
  otro: "Otro",
};

export type DigitalOrder = {
  id: string;
  code: string;
  productId: string;
  productName: string;
  productSlug: string;
  customerName: string;
  email: string;
  phone: string | null;
  paymentMethod: DigitalPaymentMethod;
  paymentReference: string | null;
  amount: number;
  status: DigitalOrderStatus;
  source: string;
  downloadToken: string;
  downloadCount: number;
  adminNote: string | null;
  createdAt: string;
  confirmedAt: string | null;
};

export type DigitalFileKind = "excel" | "pdf" | "word" | "powerpoint" | "zip" | "video" | "audio" | "imagen" | "otro";

export function getDigitalFileKind(name: string, mimeType?: string | null): DigitalFileKind {
  const ext = String(name || "").toLowerCase().split(".").pop() || "";
  const mime = String(mimeType || "").toLowerCase();
  if (["xlsx", "xls", "xlsm", "csv", "ods"].includes(ext) || mime.includes("spreadsheet") || mime.includes("excel")) return "excel";
  if (ext === "pdf" || mime === "application/pdf") return "pdf";
  if (["doc", "docx", "odt", "rtf"].includes(ext) || mime.includes("word")) return "word";
  if (["ppt", "pptx", "odp"].includes(ext) || mime.includes("presentation")) return "powerpoint";
  if (["zip", "rar", "7z"].includes(ext) || mime.includes("zip") || mime.includes("compressed")) return "zip";
  if (["mp4", "mov", "webm", "m4v"].includes(ext) || mime.startsWith("video/")) return "video";
  if (["mp3", "m4a", "wav"].includes(ext) || mime.startsWith("audio/")) return "audio";
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext) || mime.startsWith("image/")) return "imagen";
  return "otro";
}

export const DIGITAL_FILE_KIND_LABELS: Record<DigitalFileKind, string> = {
  excel: "Excel",
  pdf: "PDF",
  word: "Word",
  powerpoint: "PowerPoint",
  zip: "ZIP",
  video: "Video",
  audio: "Audio",
  imagen: "Imagen",
  otro: "Archivo",
};

export function formatFileSize(bytes: number | null | undefined) {
  const value = Number(bytes || 0);
  if (!value) return "";
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatSoles(value: number) {
  return `S/ ${Number(value || 0).toFixed(2)}`;
}

export function slugifyDigital(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const DIGITAL_MAX_FILE_BYTES = 50 * 1024 * 1024;
export const DIGITAL_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
