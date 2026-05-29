-- Migration: insert_sale_with_commission
-- Creates a stored function that inserts a sale and its commission atomically.
-- Run this in your Supabase SQL editor or apply as a migration.

BEGIN;

/*
Function: insert_sale_with_commission
Inserts a row into public.sales and, when applicable, a related row into public.sales_commissions
in a single transaction to avoid foreign-key races.
*/
DROP FUNCTION IF EXISTS public.insert_sale_with_commission(
  uuid,
  uuid,
  uuid,
  uuid,
  integer,
  numeric,
  numeric,
  text,
  numeric,
  numeric,
  numeric,
  text,
  text
);

CREATE OR REPLACE FUNCTION public.insert_sale_with_commission(
  p_salesperson_id uuid,
  p_product_id uuid,
  p_client_id uuid DEFAULT NULL,
  p_external_client_id uuid DEFAULT NULL,
  p_quantity integer DEFAULT 1,
  p_unit_price numeric DEFAULT 0,
  p_total_amount numeric DEFAULT 0,
  p_payment_status text DEFAULT 'pending',
  p_payment_received numeric DEFAULT 0,
  p_commission_percentage numeric DEFAULT 0,
  p_commission_amount numeric DEFAULT 0,
  p_commission_status text DEFAULT 'pending',
  p_notes text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_sale_id uuid;
BEGIN
  INSERT INTO public.sales (
    salesperson_id, product_id, client_id, external_client_id, quantity,
    unit_price, total_amount, payment_status, payment_received, commission_status,
    commission_amount, notes
  ) VALUES (
    p_salesperson_id, p_product_id, p_client_id, p_external_client_id, p_quantity,
    p_unit_price, p_total_amount, p_payment_status, p_payment_received, p_commission_status,
    p_commission_amount, p_notes
  )
  RETURNING id INTO v_sale_id;

    IF p_commission_amount > 0 THEN
    INSERT INTO public.sales_commissions (
      sale_id, salesperson_id, commission_percentage, commission_amount, status
    ) VALUES (
      v_sale_id, p_salesperson_id, p_commission_percentage, p_commission_amount, p_commission_status
    );
  END IF;

  RETURN v_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
