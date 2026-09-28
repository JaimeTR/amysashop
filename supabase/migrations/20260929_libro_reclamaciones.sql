-- Libro de Reclamaciones virtual (Ley N.° 29571 y D.S. N.° 011-2011-PCM y modificatorias).
-- Cada hoja tiene un número correlativo; se conserva al menos 2 años. Solo el servidor lee/escribe.

create sequence if not exists public.complaints_number_seq;

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  number bigint not null unique default nextval('public.complaints_number_seq'),
  code text generated always as ('LR-' || lpad(number::text, 6, '0')) stored,
  -- Consumidor
  consumer_name text not null,
  document_type text not null default 'DNI',
  document_number text not null,
  address text not null,
  phone text,
  email text not null,
  is_minor boolean not null default false,
  guardian_name text,
  -- Bien contratado
  item_type text not null check (item_type in ('producto', 'servicio')),
  item_description text not null,
  amount numeric(10,2),
  order_reference text,
  -- Detalle
  complaint_type text not null check (complaint_type in ('reclamo', 'queja')),
  detail text not null,
  consumer_request text not null,
  -- Proveedor
  status text not null default 'pending' check (status in ('pending', 'answered')),
  provider_response text,
  responded_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists complaints_created_idx on public.complaints(created_at desc);

alter table public.complaints enable row level security;
-- Sin políticas: el acceso es exclusivamente con service role (API del servidor y admin).
