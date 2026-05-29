-- Migration: disable_old_sales_triggers
-- Drops legacy sales triggers that conflict with the current Emprende flow.
-- The application now handles stock and commission logic explicitly.

BEGIN;

DROP TRIGGER IF EXISTS create_commission_on_insert ON public.sales;
DROP TRIGGER IF EXISTS decrease_stock_on_sale ON public.sales;
DROP TRIGGER IF EXISTS restore_stock_on_sale_delete ON public.sales;
DROP TRIGGER IF EXISTS update_commission_on_payment_change ON public.sales;

COMMIT;
