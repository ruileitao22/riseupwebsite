create or replace function public.can_manage_contacts()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'communication_team');
$$;

grant select on public.join_applications to authenticated;
grant select on public.contact_submissions to authenticated;

drop policy if exists "HR can read join applications" on public.join_applications;
create policy "HR can read join applications"
  on public.join_applications
  for select
  to authenticated
  using (public.can_manage_hr());

drop policy if exists "Communication can read contact submissions" on public.contact_submissions;
create policy "Communication can read contact submissions"
  on public.contact_submissions
  for select
  to authenticated
  using (public.can_manage_contacts());
