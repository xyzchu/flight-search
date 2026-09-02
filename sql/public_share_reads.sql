-- Allow anonymous (no-login) read access to searches that have a share token
-- and to their price snapshots. Rows stay invisible to anon until the owner
-- generates a share link (share_token set) and remain revocable.
-- Writes are unaffected: anon can never insert/update/delete.

drop policy if exists "anon read shared tracked searches" on public.tracked_searches;

create policy "anon read shared tracked searches"
on public.tracked_searches
for select
to anon
using (share_token is not null);

drop policy if exists "anon read snapshots of shared searches" on public.price_snapshots;

create policy "anon read snapshots of shared searches"
on public.price_snapshots
for select
to anon
using (
  exists (
    select 1
    from public.tracked_searches ts
    where ts.id = tracked_search_id
      and ts.share_token is not null
  )
);
