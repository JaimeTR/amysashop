-- Asegura columnas necesarias para gestión de pedidos y pagos
-- Ejecutar en Supabase SQL Editor

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS channel TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT,
  ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Estado por defecto para pedidos existentes sin payment_status
UPDATE public.orders
SET payment_status = 'pendiente'
WHERE payment_status IS NULL OR TRIM(payment_status) = '';

-- Índices recomendados para filtros en panel admin
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_channel ON public.orders(channel);
