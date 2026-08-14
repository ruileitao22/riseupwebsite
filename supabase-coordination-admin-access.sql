-- Adds the executive coordination roles with the same administrative access as admin.
-- Safe to run on an existing Rise Up Supabase project.

alter table public.user_profiles drop constraint if exists user_profiles_role_check;
alter table public.user_profiles
  add constraint user_profiles_role_check
  check (role in (
    'admin', 'coordinator', 'vice_coordinator', 'member',
    'communication_team', 'projects_innovation_team', 'commercial_team', 'hr_team',
    'team_leader', 'team_leader_communication', 'team_leader_projects_innovation',
    'team_leader_commercial', 'team_leader_hr'
  ));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'coordinator', 'vice_coordinator');
$$;

create or replace function public.can_manage_projects()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'coordinator', 'vice_coordinator', 'projects_innovation_team', 'team_leader_projects_innovation');
$$;

create or replace function public.can_manage_communication()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'coordinator', 'vice_coordinator', 'communication_team', 'team_leader_communication');
$$;

create or replace function public.can_manage_hr()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'coordinator', 'vice_coordinator', 'hr_team', 'team_leader_hr');
$$;

create or replace function public.can_manage_team()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'coordinator', 'vice_coordinator', 'hr_team', 'team_leader_hr');
$$;

create or replace function public.can_lead_tasks()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'coordinator', 'vice_coordinator', 'team_leader', 'team_leader_communication', 'team_leader_projects_innovation', 'team_leader_commercial', 'team_leader_hr');
$$;

drop policy if exists "HR can read join applications" on public.join_applications;
create policy "HR can read join applications"
  on public.join_applications for select to authenticated
  using (public.can_manage_hr());

drop policy if exists "HR can delete join applications" on public.join_applications;
create policy "HR can delete join applications"
  on public.join_applications for delete to authenticated
  using (public.can_manage_hr());

drop policy if exists "Communication can read contact submissions" on public.contact_submissions;
create policy "Communication can read contact submissions"
  on public.contact_submissions for select to authenticated
  using (public.can_manage_communication());

drop policy if exists "Communication can update contact submissions" on public.contact_submissions;
create policy "Communication can update contact submissions"
  on public.contact_submissions for update to authenticated
  using (public.can_manage_communication())
  with check (public.can_manage_communication());

drop policy if exists "Communication can delete contact submissions" on public.contact_submissions;
create policy "Communication can delete contact submissions"
  on public.contact_submissions for delete to authenticated
  using (public.can_manage_communication());
