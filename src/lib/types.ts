export type Profile = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
};

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
  stock?: number;
  active?: boolean;
  cost?: number;
  operating_cost?: number;
  profit_margin?: number;
  seller_markup_percentage?: number;
  month_commission_amount?: number;
};

export type Salesperson = {
  id: string;
  user_id?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  commission_percentage?: number | null;
  status?: string | null;
};

export type NavProduct = Pick<Product, "id" | "name" | "description" | "price" | "images" | "category" | "brand" | "gender">;

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

// Estadísticas agregadas para vistas de administración (vendedoras / emprende)
export type SalespersonWithStats = {
  id: string;
  user_id?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  commission_percentage?: number | null;
  status?: string | null;
  // métricas
  sales_count?: number; // número de ventas en el periodo
  revenue?: number; // monto total vendido
  commission_due?: number; // comisión acumulada pendiente
};
