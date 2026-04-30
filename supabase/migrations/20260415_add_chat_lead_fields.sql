-- Agrega campos para capturar datos de lead en el chat de AMYSA

alter table public.chat_sessions
  add column if not exists lead_name text,
  add column if not exists lead_phone text,
  add column if not exists lead_email text,
  add column if not exists lead_interest text,
  add column if not exists lead_category text,
  add column if not exists lead_brand text;

create index if not exists idx_chat_sessions_lead_email on public.chat_sessions(lead_email);
create index if not exists idx_chat_sessions_lead_phone on public.chat_sessions(lead_phone);
