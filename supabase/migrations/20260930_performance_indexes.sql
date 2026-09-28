-- Optimización de consultas: índices faltantes y políticas RLS más eficientes.
-- Idempotente. Ejecutar en Supabase → SQL Editor.

-- ============================================================
-- 1. Claves foráneas sin índice
--    (joins, filtros por relación y borrados en cascada/SET NULL sin escanear toda la tabla)
-- ============================================================
create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_sales_salesperson_created on public.sales(salesperson_id, created_at desc);
create index if not exists idx_sales_product_id on public.sales(product_id);
create index if not exists idx_sales_client_id on public.sales(client_id);
create index if not exists idx_sales_external_client_id on public.sales(external_client_id);
create index if not exists idx_sales_commissions_sale_id on public.sales_commissions(sale_id);
create index if not exists idx_sales_commissions_salesperson_id on public.sales_commissions(salesperson_id);
create index if not exists idx_external_clients_salesperson_id on public.external_clients(salesperson_id);
create index if not exists idx_landing_pages_product_id on public.landing_pages(product_id);
create index if not exists idx_digital_orders_product_id on public.digital_orders(product_id);
create index if not exists idx_digital_pack_items_product_id on public.digital_pack_items(product_id);

-- ============================================================
-- 2. Listados del admin ordenados por fecha
-- ============================================================
create index if not exists idx_products_created_at on public.products(created_at desc);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_sales_created_at on public.sales(created_at desc);

-- ============================================================
-- 3. Búsqueda de productos por nombre (ILIKE '%texto%' en el admin y el buscador)
-- ============================================================
-- pg_trgm puede estar instalada en "public" o en "extensions" según el proyecto:
-- se usa el esquema donde realmente está.
create extension if not exists pg_trgm with schema extensions;

do $$
declare
  trgm_schema text;
begin
  select n.nspname into trgm_schema
  from pg_extension e
  join pg_namespace n on n.oid = e.extnamespace
  where e.extname = 'pg_trgm';

  execute format(
    'create index if not exists idx_products_name_trgm on public.products using gin (name %I.gin_trgm_ops)',
    trgm_schema
  );
end
$$;

-- ============================================================
-- 4. RLS de profiles: (select auth.uid()) se evalúa una vez por consulta en vez de por fila
--    (recomendación del Performance Advisor de Supabase). Misma lógica que antes.
-- ============================================================
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- ============================================================
-- 5. Actualizar estadísticas para que el planificador use los índices nuevos
-- ============================================================
analyze public.products;
analyze public.orders;
analyze public.sales;
analyze public.sales_commissions;
analyze public.profiles;
