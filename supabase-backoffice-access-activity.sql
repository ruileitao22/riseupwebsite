-- Track visits to the BackOffice. Members update only their own timestamp;
-- Administration, Coordination and HR can read the whole team's activity.
create table if not exists public.backoffice_access_activity (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_access_at timestamptz
);

alter table public.backoffice_access_activity enable row level security;

revoke all on public.backoffice_access_activity from anon, authenticated;
grant select, insert, update on public.backoffice_access_activity to authenticated;

drop policy if exists "Members record own backoffice access" on public.backoffice_access_activity;
create policy "Members record own backoffice access"
  on public.backoffice_access_activity
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Members update own backoffice access" on public.backoffice_access_activity;
create policy "Members update own backoffice access"
  on public.backoffice_access_activity
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Members and team managers read backoffice access" on public.backoffice_access_activity;
create policy "Members and team managers read backoffice access"
  on public.backoffice_access_activity
  for select
  to authenticated
  using ((select auth.uid()) = user_id or (select public.can_manage_team()));

-- Give existing accounts an initial value until they next open the BackOffice.
insert into public.backoffice_access_activity (user_id, last_access_at)
select id, last_sign_in_at
from auth.users
on conflict (user_id) do nothing;
