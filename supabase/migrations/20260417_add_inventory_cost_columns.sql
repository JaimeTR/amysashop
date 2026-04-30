-- Agregar columnas de costo e inventario a la tabla products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS cost NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS operating_cost NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit_margin NUMERIC(5, 2) DEFAULT 0;

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_products_cost ON products(cost);
CREATE INDEX IF NOT EXISTS idx_products_operating_cost ON products(operating_cost);
CREATE INDEX IF NOT EXISTS idx_products_profit_margin ON products(profit_margin);
