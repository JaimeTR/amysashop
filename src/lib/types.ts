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

export type SaleWithDetails = {
  id: string;
  salesperson_id: string;
  product_id?: string | null;
  client_id?: string | null;
  external_client_id?: string | null;
  quantity: number;
  unit_price: number;
  total_amount: number;
  commission_amount: number;
  payment_status: string;
  payment_received: number;
  commission_status?: string | null;
  notes?: string | null;
  created_at: string;
  salesperson?: Salesperson | null;
  product?: Product | null;
  client?: Profile | null;
  external_client?: ExternalClient | null;
};

export type SalespersonWithStats = Salesperson & {
  month_sales_count?: number;
  month_total_amount?: number;
  month_commission_amount?: number;
};

export type ExternalClient = {
  id: string;
  salesperson_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  created_at: string;
};

export type Sale = {
  id: string;
  salesperson_id: string;
  product_id?: string | null;
  client_id?: string | null;
  external_client_id?: string | null;
  quantity: number;
  unit_price: number;
  total_amount: number;
  commission_amount: number;
  payment_status: string;
  payment_received: number;
  commission_status?: string | null;
  notes?: string | null;
  created_at: string;
};

export type SalesCommission = {
  id: string;
  salesperson_id: string;
  sale_id: string;
  commission_amount: number;
  status: string;
  created_at: string;
};

export type CreateSaleInput = {
  product_id: string;
  quantity: number;
  payment_status: "pending" | "partial" | "completed";
  payment_received?: number;
  client_type?: "internal" | "external";
  client_id?: string;
  external_client_id?: string;
  notes?: string;
};

export type CreateExternalClientInput = {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
};

export type UpdateSalespersonInput = {
  name?: string;
  email?: string;
  phone?: string;
  commission_percentage?: number;
  status?: "active" | "inactive";
};

export type SalesFilter = {
  salesperson_id?: string;
  payment_status?: string;
  commission_status?: string;
  month?: number;
  year?: number;
};

export type PaymentStatus = "pending" | "partial" | "completed";