-- Campos comerciales para checkout: entrega, envio y cupones

alter table public.orders
  add column if not exists delivery_method text,
  add column if not exists shipping_amount numeric(10,2),
  add column if not exists discount_amount numeric(10,2),
  add column if not exists subtotal_amount numeric(10,2),
  add column if not exists coupon_code text;

create index if not exists idx_orders_delivery_method on public.orders(delivery_method);
create index if not exists idx_orders_coupon_code on public.orders(coupon_code);
