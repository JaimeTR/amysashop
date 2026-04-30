-- AMYSA AI: conversaciones de clientes + trazabilidad de leads para admin

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'lead', 'closed')),
  lead_stage text not null default 'nuevo' check (lead_stage in ('nuevo', 'contactado', 'en_seguimiento', 'cerrado', 'descartado')),
  lead_score integer not null default 0,
  lead_summary text,
  source text not null default 'amysa_ai',
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  sender text not null check (sender in ('client', 'assistant', 'admin', 'system')),
  content text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_sessions_client_id on public.chat_sessions(client_id);
create index if not exists idx_chat_sessions_last_message_at on public.chat_sessions(last_message_at desc);
create index if not exists idx_chat_messages_session_id_created_at on public.chat_messages(session_id, created_at);

alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "chat_sessions_select_own" on public.chat_sessions;
create policy "chat_sessions_select_own"
  on public.chat_sessions
  for select
  to authenticated
  using (auth.uid() = client_id);

drop policy if exists "chat_sessions_insert_own" on public.chat_sessions;
create policy "chat_sessions_insert_own"
  on public.chat_sessions
  for insert
  to authenticated
  with check (auth.uid() = client_id);

drop policy if exists "chat_sessions_update_own" on public.chat_sessions;
create policy "chat_sessions_update_own"
  on public.chat_sessions
  for update
  to authenticated
  using (auth.uid() = client_id)
  with check (auth.uid() = client_id);

drop policy if exists "chat_messages_select_own_session" on public.chat_messages;
create policy "chat_messages_select_own_session"
  on public.chat_messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.chat_sessions sessions
      where sessions.id = chat_messages.session_id
        and sessions.client_id = auth.uid()
    )
  );

drop policy if exists "chat_messages_insert_client_own_session" on public.chat_messages;
create policy "chat_messages_insert_client_own_session"
  on public.chat_messages
  for insert
  to authenticated
  with check (
    sender = 'client'
    and exists (
      select 1
      from public.chat_sessions sessions
      where sessions.id = chat_messages.session_id
        and sessions.client_id = auth.uid()
    )
  );
