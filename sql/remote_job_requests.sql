create table if not exists public.remote_job_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_type text not null,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'failed', 'cancelled')),
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  error text,
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  last_heartbeat_at timestamptz
);

create index if not exists remote_job_requests_user_status_idx
  on public.remote_job_requests (user_id, status, requested_at desc);

create index if not exists remote_job_requests_status_idx
  on public.remote_job_requests (status, requested_at asc);

alter table public.remote_job_requests enable row level security;

drop policy if exists "users manage own remote jobs" on public.remote_job_requests;

create policy "users manage own remote jobs"
on public.remote_job_requests
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'remote_job_requests'
  ) then
    alter publication supabase_realtime add table public.remote_job_requests;
  end if;
end $$;
