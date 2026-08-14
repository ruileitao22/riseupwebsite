grant usage on schema public to anon, authenticated;

alter table public.join_applications enable row level security;
alter table public.contact_submissions enable row level security;

grant select, delete on public.join_applications to authenticated;
grant select, update, delete on public.contact_submissions to authenticated;

drop policy if exists "HR can read join applications" on public.join_applications;
create policy "HR can read join applications"
  on public.join_applications
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.user_profiles profile
      where profile.id = auth.uid()
        and profile.role in ('admin', 'coordinator', 'vice_coordinator', 'hr_team')
    )
  );

drop policy if exists "HR can delete join applications" on public.join_applications;
create policy "HR can delete join applications"
  on public.join_applications
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.user_profiles profile
      where profile.id = auth.uid()
        and profile.role in ('admin', 'coordinator', 'vice_coordinator', 'hr_team')
    )
  );

drop policy if exists "Communication can read contact submissions" on public.contact_submissions;
create policy "Communication can read contact submissions"
  on public.contact_submissions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.user_profiles profile
      where profile.id = auth.uid()
        and profile.role in ('admin', 'coordinator', 'vice_coordinator', 'communication_team', 'team_leader_communication', 'team_leader_commercial')
    )
  );

drop policy if exists "Communication can update contact submissions" on public.contact_submissions;
create policy "Communication can update contact submissions"
  on public.contact_submissions
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.user_profiles profile
      where profile.id = auth.uid()
        and profile.role in ('admin', 'coordinator', 'vice_coordinator', 'communication_team', 'team_leader_communication', 'team_leader_commercial')
    )
  )
  with check (
    exists (
      select 1
      from public.user_profiles profile
      where profile.id = auth.uid()
        and profile.role in ('admin', 'coordinator', 'vice_coordinator', 'communication_team', 'team_leader_communication', 'team_leader_commercial')
    )
  );

drop policy if exists "Communication can delete contact submissions" on public.contact_submissions;
create policy "Communication can delete contact submissions"
  on public.contact_submissions
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.user_profiles profile
      where profile.id = auth.uid()
        and profile.role in ('admin', 'coordinator', 'vice_coordinator', 'communication_team', 'team_leader_communication', 'team_leader_commercial')
    )
  );

select
  has_table_privilege('authenticated', 'public.join_applications', 'select') as authenticated_can_select_join_applications,
  has_table_privilege('authenticated', 'public.join_applications', 'delete') as authenticated_can_delete_join_applications,
  has_table_privilege('authenticated', 'public.contact_submissions', 'select') as authenticated_can_select_contact_submissions,
  has_table_privilege('authenticated', 'public.contact_submissions', 'update') as authenticated_can_update_contact_submissions,
  has_table_privilege('authenticated', 'public.contact_submissions', 'delete') as authenticated_can_delete_contact_submissions;
