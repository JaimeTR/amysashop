-- Habilita modo asesor en tiempo real (admin/vendedora) para chats de AMYSA AI

alter table public.chat_sessions
  add column if not exists joined_by_admin_id uuid references auth.users(id),
  add column if not exists joined_at timestamptz;

create or replace function public.is_chat_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and (
          coalesce(lower(p.role), '') in ('superadmin', 'administrador', 'duena', 'dueña', 'vendedora', 'socia')
          or coalesce(p.is_admin, false) = true
        )
    )
    or coalesce(lower(auth.jwt() -> 'user_metadata' ->> 'role'), '') in ('superadmin', 'administrador', 'admin', 'duena', 'dueña', 'vendedora', 'socia');
$$;

grant execute on function public.is_chat_admin() to authenticated;

drop policy if exists "chat_sessions_admin_select_all" on public.chat_sessions;
create policy "chat_sessions_admin_select_all"
  on public.chat_sessions
  for select
  to authenticated
  using (public.is_chat_admin());

drop policy if exists "chat_sessions_admin_update_all" on public.chat_sessions;
create policy "chat_sessions_admin_update_all"
  on public.chat_sessions
  for update
  to authenticated
  using (public.is_chat_admin())
  with check (public.is_chat_admin());

drop policy if exists "chat_messages_admin_select_all" on public.chat_messages;
create policy "chat_messages_admin_select_all"
  on public.chat_messages
  for select
  to authenticated
  using (public.is_chat_admin());

drop policy if exists "chat_messages_admin_insert" on public.chat_messages;
create policy "chat_messages_admin_insert"
  on public.chat_messages
  for insert
  to authenticated
  with check (
    public.is_chat_admin()
    and sender = 'admin'
  );

alter table public.chat_sessions replica identity full;
alter table public.chat_messages replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.chat_sessions;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.chat_messages;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end;
$$;
