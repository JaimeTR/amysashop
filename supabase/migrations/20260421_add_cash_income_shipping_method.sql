-- Agrega metodo de envio a los ingresos de Caja AMYSA

ALTER TABLE public.amysa_cash_income
ADD COLUMN IF NOT EXISTS shipping_method text NOT NULL DEFAULT 'shipping_lima';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'amysa_cash_income_shipping_method_check'
      AND conrelid = 'public.amysa_cash_income'::regclass
  ) THEN
    ALTER TABLE public.amysa_cash_income
      ADD CONSTRAINT amysa_cash_income_shipping_method_check
      CHECK (shipping_method IN ('pickup_lima_points', 'shipping_lima', 'shipping_provincia'));
  END IF;
END $$;

COMMENT ON COLUMN public.amysa_cash_income.shipping_method IS 'Metodo de envio asociado al ingreso de venta.';