export type Product = {
  id: string;
  name: string;
  description: string;
  summary?: string;
  content?: string;
  price: number;
  priceBefore?: number | null;
  images: string[];
  category: string;
  brand?: string;
  gender?: string;
  ageGroup?: string;
  stock: number;
  active: boolean;
  cost?: number;
  operating_cost?: number;
  profit_margin?: number;
};

export type NavProduct = Pick<
  Product,
  "id" | "name" | "description" | "price" | "images" | "category" | "brand" | "gender"
>;

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  priceBefore?: number | null;
  image?: string;
  quantity: number;
  variantLabel?: string;
  personalizationText?: string;
  optionSignature?: string;
};

export type LandingPage = {
  id: string;
  slug: string;
  title: string;
  image: string;
  productId: string;
  active: boolean;
};
