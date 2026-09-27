-- Tienda de productos digitales (plantillas, libros, cursos, packs) en la base principal.
-- Ejecutar en Supabase → SQL Editor. Es idempotente (se puede correr más de una vez).

-- ============================================================
-- Productos
-- ============================================================
create table if not exists public.digital_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  subtitle text,
  description text not null default '',
  product_type text not null default 'plantilla'
    check (product_type in ('plantilla', 'libro', 'curso', 'guia', 'pack', 'otro')),
  features jsonb not null default '[]'::jsonb,        -- lista "qué incluye"
  ideal_for text,
  price numeric(10,2) not null default 0 check (price >= 0),          -- soles (PEN)
  price_before numeric(10,2) check (price_before is null or price_before >= 0),
  cover_url text,                                      -- imagen pública (bucket digital-public)
  preview_images jsonb not null default '[]'::jsonb,   -- páginas de muestra públicas
  active boolean not null default true,
  featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Archivos que recibe el comprador (bucket privado digital-files).
-- storage_path "local:<ruta>" = archivo incluido en el proyecto (private/digital/files/<ruta>).
create table if not exists public.digital_product_files (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.digital_products(id) on delete cascade,
  name text not null,
  description text,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists digital_product_files_product_idx on public.digital_product_files(product_id);

-- Packs: un producto tipo "pack" incluye los archivos de otros productos.
create table if not exists public.digital_pack_items (
  pack_id uuid not null references public.digital_products(id) on delete cascade,
  product_id uuid not null references public.digital_products(id) on delete cascade,
  primary key (pack_id, product_id),
  check (pack_id <> product_id)
);

-- ============================================================
-- Pedidos (pago manual: Yape, Plin, transferencia o WhatsApp)
-- ============================================================
create table if not exists public.digital_orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  product_id uuid not null references public.digital_products(id) on delete restrict,
  customer_name text not null,
  email text not null,
  phone text,
  payment_method text not null default 'whatsapp'
    check (payment_method in ('yape', 'plin', 'transferencia', 'whatsapp', 'otro')),
  payment_reference text,
  amount numeric(10,2) not null,
  currency text not null default 'PEN',
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  source text not null default 'web',                  -- web | whatsapp | manual | legacy
  download_token uuid not null unique default gen_random_uuid(),
  download_count int not null default 0,
  admin_note text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);
create index if not exists digital_orders_email_idx on public.digital_orders(lower(email));
create index if not exists digital_orders_status_idx on public.digital_orders(status, created_at desc);

-- ============================================================
-- updated_at automático
-- ============================================================
create or replace function public.digital_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists digital_products_touch on public.digital_products;
create trigger digital_products_touch before update on public.digital_products
  for each row execute function public.digital_touch_updated_at();

-- ============================================================
-- RLS: el público solo lee productos activos y packs. Archivos y pedidos
-- se manejan únicamente desde el servidor (service role).
-- ============================================================
alter table public.digital_products enable row level security;
alter table public.digital_product_files enable row level security;
alter table public.digital_pack_items enable row level security;
alter table public.digital_orders enable row level security;

drop policy if exists digital_products_public_read on public.digital_products;
create policy digital_products_public_read on public.digital_products
  for select to anon, authenticated using (active = true);

-- La lista de archivos (nombre, tipo, tamaño) se muestra en la página pública como "qué incluye".
-- El contenido sigue protegido: el bucket es privado y la descarga exige un pedido confirmado.
drop policy if exists digital_product_files_public_read on public.digital_product_files;
create policy digital_product_files_public_read on public.digital_product_files
  for select to anon, authenticated
  using (exists (select 1 from public.digital_products p where p.id = product_id and p.active = true));

drop policy if exists digital_pack_items_public_read on public.digital_pack_items;
create policy digital_pack_items_public_read on public.digital_pack_items
  for select to anon, authenticated using (true);

-- ============================================================
-- Storage
-- digital-files  (privado, 50 MB): archivos que se venden
-- digital-public (público, 10 MB): portadas y páginas de muestra
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('digital-files', 'digital-files', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('digital-public', 'digital-public', true, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'application/pdf'])
on conflict (id) do update set public = true, file_size_limit = 10485760,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'application/pdf'];

-- ============================================================
-- Productos iniciales: las 3 plantillas que ya se vendían.
-- Sus archivos están en el proyecto (private/digital/files) y se pueden
-- reemplazar desde el admin subiendo nuevas versiones.
-- ============================================================
insert into public.digital_products (slug, name, subtitle, description, product_type, features, ideal_for, price, sort_order)
values
(
  'mi-catalogo-al-dia', 'Mi Catálogo al Día', 'Plantilla de Excel · Nivel básico',
  'Ordena tus ventas y clientes sin complicarte. Una plantilla lista para usar que te ayuda a llevar el control de tu inventario, ventas diarias y pagos de clientes.',
  'plantilla',
  '["14 hojas listas para usar","Inventario de hasta 50 productos con precios","Registro de ventas diarias, mes a mes (enero a diciembre)","Control de clientes, productos, pagos y estado de pedidos","Totales mensuales automáticos","Guía de uso en PDF"]',
  'Emprendedoras que recién comienzan y necesitan tener control básico de sus ventas y clientes.',
  18, 1
),
(
  'gestion-de-ventas-por-catalogo', 'Gestión de Ventas por Catálogo', 'Plantilla de Excel · Nivel intermedio',
  'Conoce tu ganancia real y controla comisiones. Inventario inteligente, calculadora de campaña y resumen anual con gráficos.',
  'plantilla',
  '["16 hojas profesionales","Inventario inteligente que calcula automáticamente precio, ganancia y comisión","Calculadora de campaña para conocer tu ganancia al instante","Control de comisiones para tus vendedoras","Resumen anual con dashboard y gráficos","Ganancia real por producto","Compatible con todos los catálogos","Guía de uso en PDF"]',
  'Consultoras y líderes que manejan campañas por catálogo y desean conocer exactamente cuánto ganan.',
  35, 2
),
(
  'gestion-de-ventas-pro', 'Gestión de Ventas PRO', 'Plantilla de Excel · Nivel PRO',
  'El sistema completo para escalar tu negocio: costos, precios, inventario, campañas, facturas y cuánto te pagas realmente.',
  'plantilla',
  '["19 hojas profesionales","Calculadora de costo unitario (costos fijos + variables + empaque)","Gestión de precios e inventario con cálculo de inversión y margen de ganancia","Calculadora automática de campañas","Módulo ¿Cuánto me pago? para calcular tu sueldo real y rentabilidad","Monitoreo por catálogo: facturación, ventas y ganancia neta","Control de facturas","Guía de uso en PDF"]',
  'Emprendedoras, líderes de equipos y negocios que buscan escalar, controlar costos y medir su rentabilidad real.',
  55, 3
)
on conflict (slug) do nothing;

insert into public.digital_product_files (product_id, name, description, storage_path, mime_type, sort_order)
select p.id, f.name, f.description, f.storage_path, f.mime_type, f.sort_order
from (values
  ('mi-catalogo-al-dia', 'Mi Catálogo al Día.xlsx', 'Plantilla de Excel', 'local:basico/Mi Catálogo al Día.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 1),
  ('mi-catalogo-al-dia', 'Guía de uso básico.pdf', 'Instrucciones paso a paso', 'local:basico/Guía de uso básico.pdf', 'application/pdf', 2),
  ('gestion-de-ventas-por-catalogo', 'Gestión de Ventas por Catálogo.xlsx', 'Plantilla de Excel', 'local:intermedio/Gestión de Ventas por Catálogo.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 1),
  ('gestion-de-ventas-por-catalogo', 'Guía de uso intermedio.pdf', 'Manual de uso completo', 'local:intermedio/Guía de uso intermedio.pdf', 'application/pdf', 2),
  ('gestion-de-ventas-pro', 'Gestión de Ventas PRO.xlsx', 'Plantilla de Excel', 'local:pro/Gestión de Ventas PRO.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 1),
  ('gestion-de-ventas-pro', 'Guía de uso PRO.pdf', 'Manual completo del sistema', 'local:pro/Guía de uso PRO.pdf', 'application/pdf', 2)
) as f(slug, name, description, storage_path, mime_type, sort_order)
join public.digital_products p on p.slug = f.slug
where not exists (
  select 1 from public.digital_product_files x where x.product_id = p.id and x.name = f.name
);
