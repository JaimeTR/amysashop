-- ============================================================
-- BASE SCHEMA para proyecto NUEVO de Supabase
-- Ejecutar esto PRIMERO en el SQL Editor del proyecto nuevo
-- Luego ejecutar el resto de migraciones (all-migrations.sql)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. categories
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY categories_select_all ON public.categories FOR SELECT USING (true);
CREATE POLICY categories_write_authenticated ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 2. profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT,
  telefono TEXT,
  direccion TEXT,
  role TEXT,
  is_admin BOOLEAN DEFAULT false,
  gender TEXT,
  avatar_url TEXT,
  img_avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  CONSTRAINT profiles_gender_check CHECK (gender IS NULL OR lower(gender) IN ('masculino','femenino'))
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_self   ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY profiles_insert_self   ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update_self   ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_service_all   ON public.profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.email));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. products
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  price NUMERIC NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  category_id UUID REFERENCES public.categories(id),
  brand TEXT,
  sub_brand TEXT,
  sub_category TEXT,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  price_before NUMERIC,
  sku TEXT,
  nso TEXT,
  precio_normal NUMERIC(10,2),
  precio_catalogo NUMERIC(10,2),
  precio_oferta NUMERIC(10,2),
  descuento_porcentaje INTEGER,
  resumen TEXT,
  contenido TEXT,
  regalos TEXT[] DEFAULT '{}'::text[],
  imagen_principal TEXT,
  galeria_imagenes TEXT[] DEFAULT '{}'::text[],
  tags TEXT[] DEFAULT '{}'::text[],
  is_pack BOOLEAN DEFAULT FALSE,
  campaign_id TEXT,
  cost NUMERIC(10,2) DEFAULT 0,
  operating_cost NUMERIC(10,2) DEFAULT 0,
  profit_margin NUMERIC(5,2) DEFAULT 0,
  gender TEXT,
  age_group TEXT,
  seller_markup_percentage NUMERIC(5,2) DEFAULT 0,
  month_commission_amount NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT products_descuento_porcentaje_chk CHECK (descuento_porcentaje IS NULL OR (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_unique ON public.products (sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_active_stock ON public.products(active, stock, created_at DESC);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_select_all ON public.products FOR SELECT USING (true);
CREATE POLICY products_write_authenticated ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_products_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_products_updated_at();

-- ============================================================
-- 4. salespeople
-- ============================================================
CREATE TABLE IF NOT EXISTS public.salespeople (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  commission_percentage NUMERIC DEFAULT 10,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.salespeople ENABLE ROW LEVEL SECURITY;

CREATE POLICY salespeople_select_all ON public.salespeople FOR SELECT USING (true);
CREATE POLICY salespeople_write_authenticated ON public.salespeople FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 5. external_clients
-- ============================================================
CREATE TABLE IF NOT EXISTS public.external_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  salesperson_id UUID REFERENCES public.salespeople(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.external_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY external_clients_select_all ON public.external_clients FOR SELECT USING (true);
CREATE POLICY external_clients_write_authenticated ON public.external_clients FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 6. sales
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salesperson_id UUID REFERENCES public.salespeople(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  external_client_id UUID REFERENCES public.external_clients(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_received NUMERIC DEFAULT 0,
  commission_status TEXT DEFAULT 'pending',
  commission_amount NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY sales_select_all ON public.sales FOR SELECT USING (true);
CREATE POLICY sales_write_authenticated ON public.sales FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 7. sales_commissions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sales_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  salesperson_id UUID REFERENCES public.salespeople(id) ON DELETE SET NULL,
  commission_percentage NUMERIC DEFAULT 0,
  commission_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.sales_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY sales_commissions_select_all ON public.sales_commissions FOR SELECT USING (true);
CREATE POLICY sales_commissions_write_authenticated ON public.sales_commissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 8. orders
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pendiente',
  total NUMERIC,
  total_amount NUMERIC,
  channel TEXT,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pendiente',
  customer_name TEXT,
  delivery_method TEXT,
  shipping_amount NUMERIC(10,2),
  discount_amount NUMERIC(10,2),
  subtotal_amount NUMERIC(10,2),
  coupon_code TEXT,
  payment_reference TEXT,
  customer_document_type TEXT,
  customer_document_number TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  customer_note TEXT,
  items_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY orders_select_own ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY orders_insert_own ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY orders_service_all   ON public.orders FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 9. landing_pages
-- ============================================================
CREATE TABLE IF NOT EXISTS public.landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  image TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY landing_pages_select_all ON public.landing_pages FOR SELECT USING (true);
CREATE POLICY landing_pages_write_authenticated ON public.landing_pages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 10. insert_sale_with_commission function
-- ============================================================
CREATE OR REPLACE FUNCTION public.insert_sale_with_commission(
  p_salesperson_id UUID,
  p_product_id UUID,
  p_client_id UUID DEFAULT NULL,
  p_external_client_id UUID DEFAULT NULL,
  p_quantity INTEGER DEFAULT 1,
  p_unit_price NUMERIC DEFAULT 0,
  p_total_amount NUMERIC DEFAULT 0,
  p_payment_status TEXT DEFAULT 'pending',
  p_payment_received NUMERIC DEFAULT 0,
  p_commission_percentage NUMERIC DEFAULT 0,
  p_commission_amount NUMERIC DEFAULT 0,
  p_commission_status TEXT DEFAULT 'pending',
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_sale_id UUID;
BEGIN
  INSERT INTO public.sales (salesperson_id, product_id, client_id, external_client_id,
    quantity, unit_price, total_amount, payment_status, payment_received,
    commission_status, commission_amount, notes)
  VALUES (p_salesperson_id, p_product_id, p_client_id, p_external_client_id,
    p_quantity, p_unit_price, p_total_amount, p_payment_status, p_payment_received,
    p_commission_status, p_commission_amount, p_notes)
  RETURNING id INTO v_sale_id;

  IF p_commission_amount > 0 THEN
    INSERT INTO public.sales_commissions (sale_id, salesperson_id, commission_percentage, commission_amount, status)
    VALUES (v_sale_id, p_salesperson_id, p_commission_percentage, p_commission_amount, p_commission_status);
  END IF;

  RETURN v_sale_id;
END;
$$;

-- ============================================================
-- LISTO. Ahora ejecuta all-migrations.sql para el resto.
-- ============================================================
