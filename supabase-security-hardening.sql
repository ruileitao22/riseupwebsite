-- Rise Up security hardening.
-- Run this in the Supabase SQL editor after the base setup.

grant usage on schema public to anon, authenticated;

alter table public.contact_submissions enable row level security;
alter table public.join_applications enable row level security;
alter table public.team_members enable row level security;

revoke all on sequence public.contact_submissions_id_seq from anon, authenticated;
revoke all on sequence public.join_applications_id_seq from anon, authenticated;
grant usage on sequence public.contact_submissions_id_seq to anon, authenticated;
grant usage on sequence public.join_applications_id_seq to anon, authenticated;

revoke all on public.contact_submissions from anon, authenticated;
revoke all on public.join_applications from anon, authenticated;
grant insert on public.contact_submissions to anon, authenticated;
grant insert on public.join_applications to anon, authenticated;
grant select, delete on public.join_applications to authenticated;
grant select, update, delete on public.contact_submissions to authenticated;

drop policy if exists "Allow public inserts on contact_submissions" on public.contact_submissions;
create policy "Allow public inserts on contact_submissions"
  on public.contact_submissions
  for insert
  to anon, authenticated
  with check (
    status = 'new'
    and name is not null
    and email is not null
    and message is not null
  );

drop policy if exists "Allow public inserts on join_applications" on public.join_applications;
create policy "Allow public inserts on join_applications"
  on public.join_applications
  for insert
  to anon, authenticated
  with check (
    status = 'new'
    and name is not null
    and email is not null
    and phone_contact is not null
    and course is not null
    and study_year is not null
    and motivation is not null
  );

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

alter table public.contact_submissions
  drop constraint if exists contact_submissions_status_check,
  add constraint contact_submissions_status_check
    check (status in ('new', 'read', 'archived')) not valid,
  drop constraint if exists contact_submissions_email_check,
  add constraint contact_submissions_email_check
    check (email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$') not valid,
  drop constraint if exists contact_submissions_length_check,
  add constraint contact_submissions_length_check
    check (
      char_length(name) between 1 and 120
      and char_length(email) between 3 and 254
      and char_length(message) between 1 and 2000
      and (source_page is null or char_length(source_page) <= 80)
      and (page_url is null or char_length(page_url) <= 500)
      and (language is null or language in ('pt', 'en'))
      and (user_agent is null or char_length(user_agent) <= 300)
    ) not valid;

alter table public.join_applications
  drop constraint if exists join_applications_status_check,
  add constraint join_applications_status_check
    check (status in ('new', 'read', 'archived')) not valid,
  drop constraint if exists join_applications_email_check,
  add constraint join_applications_email_check
    check (email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$') not valid,
  drop constraint if exists join_applications_length_check,
  add constraint join_applications_length_check
    check (
      char_length(name) between 1 and 120
      and char_length(email) between 3 and 254
      and char_length(phone_contact) between 7 and 40
      and char_length(course) between 1 and 160
      and study_year in ('1', '2', '3', '4+')
      and char_length(motivation) between 1 and 3000
      and (linkedin is null or char_length(linkedin) <= 300)
      and (source_page is null or char_length(source_page) <= 80)
      and (page_url is null or char_length(page_url) <= 500)
      and (language is null or language in ('pt', 'en'))
      and (user_agent is null or char_length(user_agent) <= 300)
    ) not valid;

create or replace function public.clean_public_submission_text(value text, max_length integer, collapse_whitespace boolean default false)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  clean text;
begin
  clean := regexp_replace(coalesce(value, ''), '[[:cntrl:]]+', ' ', 'g');
  clean := btrim(clean);

  if collapse_whitespace then
    clean := regexp_replace(clean, '[[:space:]]+', ' ', 'g');
  end if;

  clean := left(clean, greatest(max_length, 0));
  return nullif(clean, '');
end;
$$;

create or replace function public.normalize_public_submission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.name := public.clean_public_submission_text(new.name, 120, true);
  new.email := lower(public.clean_public_submission_text(new.email, 254, true));
  new.source_page := public.clean_public_submission_text(new.source_page, 80, true);
  new.page_url := public.clean_public_submission_text(new.page_url, 500, true);
  new.language := case when new.language in ('pt', 'en') then new.language else 'pt' end;
  new.user_agent := public.clean_public_submission_text(new.user_agent, 300, true);
  new.status := 'new';
  new.submitted_at := now();

  if new.email is null or new.email !~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' then
    raise exception 'Invalid submission email' using errcode = '22000';
  end if;

  if TG_TABLE_NAME = 'contact_submissions' then
    new.message := public.clean_public_submission_text(new.message, 2000, false);

    if new.name is null or new.message is null then
      raise exception 'Invalid contact submission' using errcode = '22000';
    end if;
  elsif TG_TABLE_NAME = 'join_applications' then
    new.phone_contact := public.clean_public_submission_text(new.phone_contact, 40, true);
    new.course := public.clean_public_submission_text(new.course, 160, true);
    new.study_year := public.clean_public_submission_text(new.study_year, 8, true);
    new.motivation := public.clean_public_submission_text(new.motivation, 3000, false);
    new.linkedin := public.clean_public_submission_text(new.linkedin, 300, true);

    if new.name is null
      or new.phone_contact is null
      or new.phone_contact !~ '^\+?[0-9][0-9 .()/-]{6,24}$'
      or new.course is null
      or new.study_year not in ('1', '2', '3', '4+')
      or new.motivation is null
      or (new.linkedin is not null and new.linkedin !~* '^https://([a-z0-9-]+\.)?linkedin\.com/')
      or new.age is null
      or new.age < 16
      or new.age > 99 then
      raise exception 'Invalid join application' using errcode = '22000';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists normalize_contact_submission_before_insert on public.contact_submissions;
create trigger normalize_contact_submission_before_insert
  before insert on public.contact_submissions
  for each row
  execute function public.normalize_public_submission();

drop trigger if exists normalize_join_application_before_insert on public.join_applications;
create trigger normalize_join_application_before_insert
  before insert on public.join_applications
  for each row
  execute function public.normalize_public_submission();

create or replace function public.can_manage_team()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'coordinator', 'vice_coordinator', 'hr_team', 'team_leader_hr');
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
drop policy if exists "Admins and HR can update team members and members update own" on public.team_members;
create policy "Admins and HR can update team members and members update own"
  on public.team_members
  for update
  to authenticated
  using (public.can_manage_team() or user_id = auth.uid())
  with check (public.can_manage_team() or user_id = auth.uid());

create or replace function public.protect_team_member_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
    and new.role is distinct from old.role
    and not public.can_manage_team() then
    raise exception 'Only Human Resources and administrators can change member roles.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.protect_team_member_role() from public;

drop trigger if exists protect_team_member_role_before_update on public.team_members;
create trigger protect_team_member_role_before_update
  before update of role on public.team_members
  for each row
  execute function public.protect_team_member_role();

create or replace function public.sync_auth_user_backoffice_profile(
  target_user_id uuid,
  target_email text,
  target_meta jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text := coalesce(
    nullif(coalesce(target_meta, '{}'::jsonb)->>'name', ''),
    nullif(coalesce(target_meta, '{}'::jsonb)->>'full_name', ''),
    nullif(coalesce(target_meta, '{}'::jsonb)->>'display_name', ''),
    nullif(split_part(coalesce(target_email, ''), '@', 1), ''),
    'Novo membro'
  );
  default_team_role text := 'Membro da equipa';
begin
  insert into public.user_profiles (id, email, role)
  values (target_user_id, target_email, 'member')
  on conflict (id) do nothing;

  update public.team_members tm
  set
    user_id = target_user_id,
    name = coalesce(nullif(tm.name, ''), display_name),
    role = coalesce(nullif(tm.role, ''), default_team_role),
    email = coalesce(nullif(tm.email, ''), target_email)
  where tm.ctid = (
    select candidate.ctid
    from public.team_members candidate
    where candidate.user_id is null
      and target_email is not null
      and candidate.email is not null
      and lower(candidate.email) = lower(target_email)
    order by candidate.updated_at desc nulls last, candidate.created_at desc nulls last
    limit 1
  )
    and not exists (
      select 1
      from public.team_members existing
      where existing.user_id = target_user_id
    );

  insert into public.team_members (user_id, name, role, email, is_active)
  select target_user_id, display_name, default_team_role, target_email, false
  where not exists (
    select 1
    from public.team_members existing
    where existing.user_id = target_user_id
  );
end;
$$;
