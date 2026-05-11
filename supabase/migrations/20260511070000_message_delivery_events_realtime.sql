-- Add delivery callback events to Supabase Realtime so open request details
-- refresh when Twilio status callbacks arrive.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'message_delivery_events'
  ) then
    alter publication supabase_realtime add table public.message_delivery_events;
  end if;
end $$;

alter table public.message_delivery_events replica identity full;
