-- Permite que asesor/admin publique mensajes de sistema en chat_messages

alter table public.chat_messages enable row level security;

drop policy if exists "chat_messages_admin_insert" on public.chat_messages;
create policy "chat_messages_admin_insert"
  on public.chat_messages
  for insert
  to authenticated
  with check (
    public.is_chat_admin()
    and sender in ('admin', 'system')
  );
