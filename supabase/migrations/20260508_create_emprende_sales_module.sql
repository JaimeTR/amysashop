-- Create Emprende (Sales/Referrals) Module Tables

-- 1. SALESPEOPLE TABLE (Vendedoras)
CREATE TABLE IF NOT EXISTS salespeople (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  commission_percentage DECIMAL(5,2) DEFAULT 5.00 CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. EXTERNAL CLIENTS TABLE (Clientes externos)
CREATE TABLE IF NOT EXISTS external_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  address TEXT,
  salesperson_id UUID REFERENCES salespeople(id) ON DELETE RESTRICT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. SALES TABLE (Registro de ventas)
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salesperson_id UUID REFERENCES salespeople(id) ON DELETE RESTRICT NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
  client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  external_client_id UUID REFERENCES external_clients(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'completed')),
  payment_received DECIMAL(10,2) DEFAULT 0 CHECK (payment_received >= 0),
  commission_status TEXT DEFAULT 'pending' CHECK (commission_status IN ('pending', 'approved', 'paid')),
  commission_amount DECIMAL(10,2) DEFAULT 0 CHECK (commission_amount >= 0),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_client CHECK (
    (client_id IS NOT NULL AND external_client_id IS NULL) OR
    (client_id IS NULL AND external_client_id IS NOT NULL)
  ),
  CONSTRAINT valid_payment_received CHECK (
    payment_received <= total_amount
  )
);

-- 4. SALES COMMISSIONS HISTORY TABLE (Historial de comisiones)
CREATE TABLE IF NOT EXISTS sales_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE NOT NULL,
  salesperson_id UUID REFERENCES salespeople(id) ON DELETE RESTRICT NOT NULL,
  commission_percentage DECIMAL(5,2) NOT NULL CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  commission_amount DECIMAL(10,2) NOT NULL CHECK (commission_amount >= 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- CREATE INDEXES
CREATE INDEX idx_salespeople_user_id ON salespeople(user_id);
CREATE INDEX idx_salespeople_status ON salespeople(status);
CREATE INDEX idx_external_clients_salesperson ON external_clients(salesperson_id);
CREATE INDEX idx_sales_salesperson ON sales(salesperson_id);
CREATE INDEX idx_sales_product ON sales(product_id);
CREATE INDEX idx_sales_client ON sales(client_id);
CREATE INDEX idx_sales_external_client ON sales(external_client_id);
CREATE INDEX idx_sales_payment_status ON sales(payment_status);
CREATE INDEX idx_sales_commission_status ON sales(commission_status);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sales_commissions_sale ON sales_commissions(sale_id);
CREATE INDEX idx_sales_commissions_salesperson ON sales_commissions(salesperson_id);
CREATE INDEX idx_sales_commissions_status ON sales_commissions(status);

-- ENABLE RLS
ALTER TABLE salespeople ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_commissions ENABLE ROW LEVEL SECURITY;

-- SALESPEOPLE RLS POLICIES
-- Admin y superadmin pueden ver todos los vendedores
CREATE POLICY "Admin can view all salespeople"
  ON salespeople FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Vendedora puede ver su propio registro
CREATE POLICY "Salesperson can view own profile"
  ON salespeople FOR SELECT
  USING (user_id = auth.uid());

-- Admin puede crear, actualizar y eliminar vendedoras
CREATE POLICY "Admin can manage salespeople"
  ON salespeople FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- EXTERNAL CLIENTS RLS POLICIES
-- Admin puede ver todos los clientes externos
CREATE POLICY "Admin can view all external clients"
  ON external_clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Vendedora puede ver sus propios clientes externos
CREATE POLICY "Salesperson can view own external clients"
  ON external_clients FOR SELECT
  USING (
    salesperson_id = (
      SELECT id FROM salespeople WHERE user_id = auth.uid()
    )
  );

-- Vendedora puede crear clientes externos
CREATE POLICY "Salesperson can create external clients"
  ON external_clients FOR INSERT
  WITH CHECK (
    salesperson_id = (
      SELECT id FROM salespeople WHERE user_id = auth.uid()
    )
  );

-- Vendedora puede actualizar sus propios clientes externos
CREATE POLICY "Salesperson can update own external clients"
  ON external_clients FOR UPDATE
  USING (
    salesperson_id = (
      SELECT id FROM salespeople WHERE user_id = auth.uid()
    )
  );

-- SALES RLS POLICIES
-- Admin puede ver todas las ventas
CREATE POLICY "Admin can view all sales"
  ON sales FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Vendedora puede ver sus propias ventas
CREATE POLICY "Salesperson can view own sales"
  ON sales FOR SELECT
  USING (
    salesperson_id = (
      SELECT id FROM salespeople WHERE user_id = auth.uid()
    )
  );

-- Vendedora puede crear ventas
CREATE POLICY "Salesperson can create sales"
  ON sales FOR INSERT
  WITH CHECK (
    salesperson_id = (
      SELECT id FROM salespeople WHERE user_id = auth.uid()
    )
  );

-- Vendedora puede actualizar sus propias ventas
CREATE POLICY "Salesperson can update own sales"
  ON sales FOR UPDATE
  USING (
    salesperson_id = (
      SELECT id FROM salespeople WHERE user_id = auth.uid()
    )
  );

-- Admin puede actualizar todas las ventas
CREATE POLICY "Admin can update all sales"
  ON sales FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- SALES COMMISSIONS RLS POLICIES
-- Admin puede ver todas las comisiones
CREATE POLICY "Admin can view all commissions"
  ON sales_commissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Vendedora puede ver sus propias comisiones
CREATE POLICY "Salesperson can view own commissions"
  ON sales_commissions FOR SELECT
  USING (
    salesperson_id = (
      SELECT id FROM salespeople WHERE user_id = auth.uid()
    )
  );

-- Sistema puede crear comisiones (via triggers)
CREATE POLICY "System can create commissions"
  ON sales_commissions FOR INSERT
  WITH CHECK (true);

-- Admin puede actualizar comisiones
CREATE POLICY "Admin can update commissions"
  ON sales_commissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- TRIGGERS

-- Trigger para actualizar updated_at en salespeople
CREATE OR REPLACE FUNCTION update_salespeople_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER salespeople_updated_at_trigger
BEFORE UPDATE ON salespeople
FOR EACH ROW
EXECUTE FUNCTION update_salespeople_updated_at();

-- Trigger para actualizar updated_at en external_clients
CREATE OR REPLACE FUNCTION update_external_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER external_clients_updated_at_trigger
BEFORE UPDATE ON external_clients
FOR EACH ROW
EXECUTE FUNCTION update_external_clients_updated_at();

-- Trigger para actualizar updated_at en sales
CREATE OR REPLACE FUNCTION update_sales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sales_updated_at_trigger
BEFORE UPDATE ON sales
FOR EACH ROW
EXECUTE FUNCTION update_sales_updated_at();

-- Trigger para actualizar updated_at en sales_commissions
CREATE OR REPLACE FUNCTION update_sales_commissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sales_commissions_updated_at_trigger
BEFORE UPDATE ON sales_commissions
FOR EACH ROW
EXECUTE FUNCTION update_sales_commissions_updated_at();

-- Trigger para crear comisión cuando se registra una venta completa
CREATE OR REPLACE FUNCTION create_commission_on_sale()
RETURNS TRIGGER AS $$
DECLARE
  commission_pct DECIMAL(5,2);
  commission_amt DECIMAL(10,2);
BEGIN
  -- Solo crear comisión si el pago es completo
  IF NEW.payment_status = 'completed' THEN
    -- Obtener el porcentaje de comisión del vendedor
    SELECT commission_percentage INTO commission_pct
    FROM salespeople
    WHERE id = NEW.salesperson_id;

    -- Calcular monto de comisión
    commission_amt := NEW.total_amount * (commission_pct / 100);

    -- Crear registro de comisión
    INSERT INTO sales_commissions (
      sale_id,
      salesperson_id,
      commission_percentage,
      commission_amount,
      status
    ) VALUES (
      NEW.id,
      NEW.salesperson_id,
      commission_pct,
      commission_amt,
      'approved'
    );

    -- Actualizar commission_amount en la venta
    NEW.commission_amount := commission_amt;
    NEW.commission_status := 'approved';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_commission_on_insert
BEFORE INSERT ON sales
FOR EACH ROW
EXECUTE FUNCTION create_commission_on_sale();

-- Trigger para actualizar comisión cuando cambia el estado de pago
CREATE OR REPLACE FUNCTION update_commission_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  commission_pct DECIMAL(5,2);
  commission_amt DECIMAL(10,2);
BEGIN
  -- Si el pago cambió a completo y antes no era completo
  IF NEW.payment_status = 'completed' AND OLD.payment_status != 'completed' THEN
    -- Obtener el porcentaje de comisión
    SELECT commission_percentage INTO commission_pct
    FROM salespeople
    WHERE id = NEW.salesperson_id;

    -- Calcular monto de comisión
    commission_amt := NEW.total_amount * (commission_pct / 100);

    -- Si no existe comisión, crear una
    IF NOT EXISTS (SELECT 1 FROM sales_commissions WHERE sale_id = NEW.id) THEN
      INSERT INTO sales_commissions (
        sale_id,
        salesperson_id,
        commission_percentage,
        commission_amount,
        status
      ) VALUES (
        NEW.id,
        NEW.salesperson_id,
        commission_pct,
        commission_amt,
        'approved'
      );
    ELSE
      -- Si existe, actualizar
      UPDATE sales_commissions
      SET commission_amount = commission_amt,
          status = 'approved',
          updated_at = NOW()
      WHERE sale_id = NEW.id;
    END IF;

    NEW.commission_amount := commission_amt;
    NEW.commission_status := 'approved';
  END IF;

  -- Si el pago cambió a pendiente o parcial
  IF (NEW.payment_status = 'pending' OR NEW.payment_status = 'partial') 
     AND OLD.payment_status = 'completed' THEN
    NEW.commission_amount := 0;
    NEW.commission_status := 'pending';
    
    DELETE FROM sales_commissions WHERE sale_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_commission_on_payment_change
BEFORE UPDATE ON sales
FOR EACH ROW
EXECUTE FUNCTION update_commission_on_payment();

-- Trigger para decrementar stock cuando se registra una venta
CREATE OR REPLACE FUNCTION decrease_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET stock = stock - NEW.quantity
  WHERE id = NEW.product_id
  AND stock >= NEW.quantity;

  -- Si no hay suficiente stock, lanzar error
  IF NOT FOUND OR (SELECT stock FROM products WHERE id = NEW.product_id) < 0 THEN
    RAISE EXCEPTION 'Insufficient stock for product %', NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decrease_stock_on_sale
AFTER INSERT ON sales
FOR EACH ROW
EXECUTE FUNCTION decrease_product_stock();

-- Trigger para restaurar stock si se elimina una venta
CREATE OR REPLACE FUNCTION restore_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET stock = stock + OLD.quantity
  WHERE id = OLD.product_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER restore_stock_on_sale_delete
AFTER DELETE ON sales
FOR EACH ROW
EXECUTE FUNCTION restore_product_stock();
