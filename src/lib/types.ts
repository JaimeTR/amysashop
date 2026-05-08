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

// EMPRENDE - Sales & Commission Module Types

export type Salesperson = {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  commission_percentage: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
};

export type ExternalClient = {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  salesperson_id: string;
  created_at: string;
  updated_at: string;
};

export type PaymentStatus = "pending" | "partial" | "completed";

export type CommissionStatus = "pending" | "approved" | "paid";

export type Sale = {
  id: string;
  salesperson_id: string;
  product_id: string;
  client_id?: string;
  external_client_id?: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_received: number;
  commission_status: CommissionStatus;
  commission_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type SalesCommission = {
  id: string;
  sale_id: string;
  salesperson_id: string;
  commission_percentage: number;
  commission_amount: number;
  status: CommissionStatus;
  paid_at?: string;
  created_at: string;
  updated_at: string;
};

// Tipos para respuestas de servidor

export type SaleWithDetails = Sale & {
  product?: Product;
  salesperson?: Salesperson;
  client?: Profile;
  external_client?: ExternalClient;
};

export type SalespersonWithStats = Salesperson & {
  total_sales?: number;
  total_commissions?: number;
  pending_commissions?: number;
  month_sales_count?: number;
  month_total_amount?: number;
  month_commission_amount?: number;
};

// Tipos para formularios

export type CreateSaleInput = {
  product_id: string;
  client_id?: string;
  external_client_id?: string;
  quantity: number;
  payment_status: PaymentStatus;
  payment_received?: number;
  notes?: string;
};

export type CreateExternalClientInput = {
  name: string;
  email?: string;
  phone: string;
  address?: string;
};

export type UpdateSalespersonInput = {
  commission_percentage?: number;
  status?: "active" | "inactive";
};

// Tipos para filtros

export type SalesFilter = {
  salesperson_id?: string;
  month?: number;
  year?: number;
  payment_status?: PaymentStatus;
  commission_status?: CommissionStatus;
};