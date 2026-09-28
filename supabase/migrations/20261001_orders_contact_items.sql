-- Pedidos de la tienda: guardar contacto y productos, permitir compras sin cuenta
-- y arreglar el borrado de usuarios. Idempotente.
--
-- Antes: orders.user_id era NOT NULL (los pedidos de invitados fallaban) y faltaban las
-- columnas de contacto/productos, así que la API guardaba solo nombre y total.

-- 1. Compras sin cuenta
alter table public.orders alter column user_id drop not null;

-- 2. Datos del cliente y del pedido
alter table public.orders
  add column if not exists customer_email text,
  add column if not exists customer_phone text,
  add column if not exists customer_address text,
  add column if not exists customer_note text,
  add column if not exists customer_document_type text,
  add column if not exists customer_document_number text,
  add column if not exists payment_reference text,
  add column if not exists items_json jsonb not null default '[]'::jsonb;

-- 3. Borrado de usuarios (Admin → Usuarios): antes fallaba si el usuario tenía pedidos,
--    favoritos o chats porque las claves foráneas no tenían regla ON DELETE.
alter table public.orders drop constraint if exists orders_user_id_fkey;
alter table public.orders
  add constraint orders_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;

alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles
  add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;

alter table public.sales drop constraint if exists sales_client_id_fkey;
alter table public.sales
  add constraint sales_client_id_fkey foreign key (client_id) references public.profiles(id) on delete set null;

alter table public.favorites drop constraint if exists favorites_user_id_fkey;
alter table public.favorites
  add constraint favorites_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.chat_sessions drop constraint if exists chat_sessions_client_id_fkey;
alter table public.chat_sessions
  add constraint chat_sessions_client_id_fkey foreign key (client_id) references auth.users(id) on delete cascade;

alter table public.chat_sessions drop constraint if exists chat_sessions_joined_by_admin_id_fkey;
alter table public.chat_sessions
  add constraint chat_sessions_joined_by_admin_id_fkey foreign key (joined_by_admin_id) references auth.users(id) on delete set null;

-- 4. Índices de apoyo
create index if not exists idx_orders_customer_email on public.orders(lower(customer_email));
create index if not exists idx_favorites_user_id on public.favorites(user_id);
create index if not exists idx_chat_sessions_joined_by_admin_id on public.chat_sessions(joined_by_admin_id);
