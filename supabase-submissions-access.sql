create or replace function public.can_manage_contacts()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'communication_team');
$$;

grant usage on schema public to anon, authenticated;
grant execute on function public.can_manage_hr() to authenticated;
grant execute on function public.can_manage_contacts() to authenticated;

alter table public.join_applications enable row level security;
alter table public.contact_submissions enable row level security;

grant select, delete on public.join_applications to authenticated;
grant select on public.contact_submissions to authenticated;

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
        and profile.role in ('admin', 'hr_team')
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
        and profile.role in ('admin', 'hr_team')
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
        and profile.role in ('admin', 'communication_team')
    )
  );

select
  has_table_privilege('authenticated', 'public.join_applications', 'select') as authenticated_can_select_join_applications,
  has_table_privilege('authenticated', 'public.join_applications', 'delete') as authenticated_can_delete_join_applications,
  has_table_privilege('authenticated', 'public.contact_submissions', 'select') as authenticated_can_select_contact_submissions;
