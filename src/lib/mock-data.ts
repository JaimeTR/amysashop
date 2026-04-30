import { LandingPage, Product } from "@/lib/types";

export const productSamples: Product[] = [
  {
    id: "1",
    name: "Aretes Aurora",
    description: "Diseño dorado minimal para looks diarios.",
    price: 69.9,
    images: ["https://images.unsplash.com/photo-1610694955371-d4a3e0ce4b52?q=80&w=1200&auto=format&fit=crop"],
    category: "Aretes",
    stock: 18,
    active: true,
  },
  {
    id: "2",
    name: "Pulsera Sienna",
    description: "Textura fina con acabado premium.",
    price: 85,
    images: ["https://images.unsplash.com/photo-1619119069152-a2b331eb392a?q=80&w=1200&auto=format&fit=crop"],
    category: "Pulseras",
    stock: 9,
    active: true,
  },
  {
    id: "3",
    name: "Collar Petra",
    description: "Cadena elegante para capas y outfits noche.",
    price: 109,
    images: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1200&auto=format&fit=crop"],
    category: "Collares",
    stock: 13,
    active: true,
  },
  {
    id: "4",
    name: "Anillo Lumen",
    description: "Anillo fino ajustable con acabado satinado.",
    price: 54,
    images: ["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1200&auto=format&fit=crop"],
    category: "Anillos",
    stock: 22,
    active: true,
  },
];

export const landingSamples: LandingPage[] = [
  {
    id: "lp-1",
    slug: "navidad-oro",
    title: "Coleccion Navidad Oro",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1200&auto=format&fit=crop",
    productId: "1",
    active: true,
  },
];
