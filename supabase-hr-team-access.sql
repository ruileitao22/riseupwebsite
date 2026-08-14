create or replace function public.can_manage_team()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'coordinator', 'vice_coordinator', 'hr_team');
$$;

drop policy if exists "Public can read active team members" on public.team_members;
create policy "Public can read active team members"
  on public.team_members
  for select
  to anon, authenticated
  using (
    is_active = true
    or public.can_manage_team()
    or public.can_manage_projects()
    or user_id = auth.uid()
  );

drop policy if exists "Admins can update all team members and members update own" on public.team_members;
create policy "Admins and HR can update team members and members update own"
  on public.team_members
  for update
  to authenticated
  using (public.can_manage_team() or user_id = auth.uid())
  with check (public.can_manage_team() or user_id = auth.uid());
