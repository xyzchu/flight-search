-- Add tracked_searches to the supabase_realtime publication so the local
-- scraper daemon can wake instantly on create/edit/toggle events instead of
-- polling. remote_job_requests was already added by remote_job_requests.sql.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'tracked_searches'
  ) then
    alter publication supabase_realtime add table public.tracked_searches;
  end if;
end $$;
