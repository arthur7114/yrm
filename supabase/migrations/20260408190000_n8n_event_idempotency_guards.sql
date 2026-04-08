begin;

do $$
begin
  if exists (
    select 1
    from public.messages
    where external_message_id is not null
    group by external_message_id
    having count(*) > 1
  ) then
    raise exception
      'Cannot create unique index for messages.external_message_id because duplicate values already exist.';
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from public.leads
    where external_session_id is not null
    group by user_id, external_session_id
    having count(*) > 1
  ) then
    raise exception
      'Cannot create unique index for leads(user_id, external_session_id) because duplicate values already exist.';
  end if;
end $$;

create unique index if not exists messages_external_message_id_unique_idx
  on public.messages(external_message_id)
  where external_message_id is not null;

create unique index if not exists leads_user_external_session_id_unique_idx
  on public.leads(user_id, external_session_id)
  where external_session_id is not null;

commit;
