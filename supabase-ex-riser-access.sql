-- Ex-Riser role and public visibility protection.
-- Applied to production via the Supabase migration on 2026-10-08.

alter table public.user_profiles drop constraint if exists user_profiles_role_check;
alter table public.user_profiles
  add constraint user_profiles_role_check
  check (role in (
    'admin', 'coordinator', 'vice_coordinator', 'member',
    'communication_team', 'projects_innovation_team', 'commercial_team', 'hr_team',
    'team_leader', 'team_leader_communication', 'team_leader_projects_innovation',
    'team_leader_commercial', 'team_leader_hr', 'ex_riser'
  ));

alter table public.team_members
  add column if not exists is_ex_riser boolean not null default false;

create index if not exists team_members_is_ex_riser_idx
  on public.team_members (is_ex_riser)
  where is_ex_riser = true;

drop policy if exists "Public can read active team members" on public.team_members;
create policy "Public can read active non ex-riser team members"
  on public.team_members
  for select
  to anon, authenticated
  using (
    (is_active = true and is_ex_riser = false)
    or public.can_manage_team()
    or public.can_manage_projects()
    or user_id = (select auth.uid())
  );
