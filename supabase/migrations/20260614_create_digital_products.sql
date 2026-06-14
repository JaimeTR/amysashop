-- Digital products landing + purchase verification system

create table if not exists public.digital_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  subtitle text,
  description text not null,
  features jsonb not null default '[]'::jsonb,
  ideal_for text,
  price_usd numeric(10,2) not null,
  price_pen numeric(10,2) not null,
  paypal_link text not null,
  culqi_link text not null,
  file_urls jsonb not null default '[]'::jsonb,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.digital_products enable row level security;

create table if not exists public.digital_purchases (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  customer_name text not null,
  product_id uuid not null references public.digital_products(id),
  payment_method text not null,
  amount numeric(10,2) not null,
  currency text not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  download_token uuid default gen_random_uuid()
);

alter table public.digital_purchases enable row level security;

create or replace view public.digital_purchase_view as
select
  dp.id,
  dp.email,
  dp.customer_name,
  dp.product_id,
  dpl.name as product_name,
  dpl.slug as product_slug,
  dp.payment_method,
  dp.amount,
  dp.currency,
  dp.status,
  dp.created_at,
  dp.confirmed_at,
  dp.download_token
from public.digital_purchases dp
left join public.digital_products dpl on dpl.id = dp.product_id;

-- Seed products with files (excel + guias de uso)
insert into public.digital_products (name, slug, subtitle, description, features, ideal_for, price_usd, price_pen, paypal_link, culqi_link, file_urls, sort_order) values
(
  'Mi Catálogo al Día',
  'basico',
  'NIVEL BÁSICO',
  'Ordena tus ventas y clientes sin complicarte',
  '["14 hojas listas para usar","Inventario de hasta 50 productos con precios","Registro de ventas diarias, mes a mes (enero a diciembre)","Control de clientes, productos, pagos y estado de pedidos","Totales mensuales automáticos"]',
  'Emprendedoras que recién comienzan y necesitan tener control básico de sus ventas y clientes.',
  6, 18,
  'https://www.paypal.com/ncp/payment/CFRCBPCMBYMWJ',
  'https://express.culqi.com/pago/C049DDA931',
  '[{"name":"Mi Catálogo al Día.xlsx","description":"Plantilla de Excel","url":"","type":"excel"},{"name":"Guía de uso básico.pdf","description":"Instrucciones paso a paso","url":"","type":"pdf"}]',
  1
),
(
  'Gestión de Ventas por Catálogo',
  'intermedio',
  'NIVEL INTERMEDIO',
  'Conoce tu ganancia real y controla comisiones',
  '["16 hojas profesionales","Inventario inteligente que calcula automáticamente precio, ganancia y comisión","Calculadora de campaña para conocer tu ganancia al instante","Control de comisiones para tus vendedoras","Resumen anual con dashboard y gráficos","Ganancia real por producto","Compatible con todos los catálogos"]',
  'Consultoras y líderes que manejan campañas por catálogo y desean conocer exactamente cuánto ganan.',
  11, 35,
  'https://www.paypal.com/ncp/payment/ZD6XAMR8VS94E',
  'https://express.culqi.com/pago/9B49AFCF52',
  '[{"name":"Gestión de Ventas por Catálogo.xlsx","description":"Plantilla de Excel","url":"","type":"excel"},{"name":"Guía de uso intermedio.pdf","description":"Manual de uso completo","url":"","type":"pdf"},{"name":"Video tutorial.mp4","description":"Video explicativo de funciones","url":"","type":"video"}]',
  2
),
(
  'Gestión de Ventas PRO',
  'pro',
  'NIVEL PRO',
  'El sistema completo para escalar tu negocio',
  '["19 hojas profesionales","Calculadora de costo unitario (costos fijos + variables + empaque)","Gestión de precios e inventario con cálculo de inversión y margen de ganancia","Calculadora automática de campañas","Módulo ¿Cuánto me pago? para calcular tu sueldo real y rentabilidad","Monitoreo por catálogo: facturación, ventas y ganancia neta","Control de facturas","Resumen anual con gráficos y métricas","Sistema integral para gestionar tu negocio como una profesional"]',
  'Emprendedoras, líderes de equipos y negocios que buscan escalar, controlar costos y medir su rentabilidad real.',
  17, 55,
  'https://www.paypal.com/ncp/payment/RFRK4CMTZENZQ',
  'https://express.culqi.com/pago/B11C573E1D',
  '[{"name":"Gestión de Ventas PRO.xlsx","description":"Plantilla de Excel","url":"","type":"excel"},{"name":"Guía de uso PRO.pdf","description":"Manual completo del sistema","url":"","type":"pdf"},{"name":"Guía de rentabilidad.pdf","description":"Cómo calcular tu sueldo y margen","url":"","type":"pdf"},{"name":"Video tutorial PRO.mp4","description":"Video completo del sistema","url":"","type":"video"}]',
  3
);
