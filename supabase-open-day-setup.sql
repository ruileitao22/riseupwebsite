-- Open Day 18 September 2026. Public submissions close at 15:00 in Lisbon on 17 September.
create table if not exists public.open_day_registrations (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 name text not null check (char_length(btrim(name)) between 2 and 160),
 student_number text not null default '' check (char_length(student_number) <= 40),
 course text not null check (char_length(btrim(course)) between 1 and 160),
 email text not null check (char_length(email) <= 254 and email = lower(btrim(email)) and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 phone text not null check (phone ~ '^\+?[0-9][0-9[:space:]().-]{6,24}$'),
 lunch boolean not null,
 dietary_requirements text not null default '' check (char_length(dietary_requirements) <= 500),
 check (lunch or dietary_requirements = '')
);
create unique index if not exists open_day_registrations_email_idx on public.open_day_registrations (lower(email));
alter table public.open_day_registrations enable row level security;
revoke all on public.open_day_registrations from anon, authenticated;
grant insert (name, student_number, course, email, phone, lunch, dietary_requirements) on public.open_day_registrations to anon;
grant select, delete on public.open_day_registrations to authenticated;
grant update (name, student_number, course, email, phone, lunch, dietary_requirements) on public.open_day_registrations to authenticated;
drop policy if exists open_day_submit on public.open_day_registrations;
create policy open_day_submit on public.open_day_registrations for insert to anon
 with check (now() < timestamptz '2026-09-17 14:00:00+00');
drop policy if exists open_day_select on public.open_day_registrations;
create policy open_day_select on public.open_day_registrations for select to authenticated
 using ((select public.current_user_role()) in ('coordinator', 'vice_coordinator', 'team_leader', 'team_leader_communication', 'team_leader_projects_innovation', 'team_leader_commercial', 'team_leader_hr'));
drop policy if exists open_day_update on public.open_day_registrations;
create policy open_day_update on public.open_day_registrations for update to authenticated
 using ((select public.current_user_role()) in ('coordinator', 'vice_coordinator', 'team_leader', 'team_leader_communication', 'team_leader_projects_innovation', 'team_leader_commercial', 'team_leader_hr'))
 with check ((select public.current_user_role()) in ('coordinator', 'vice_coordinator', 'team_leader', 'team_leader_communication', 'team_leader_projects_innovation', 'team_leader_commercial', 'team_leader_hr'));
drop policy if exists open_day_delete on public.open_day_registrations;
create policy open_day_delete on public.open_day_registrations for delete to authenticated
 using ((select public.current_user_role()) in ('coordinator', 'vice_coordinator', 'team_leader', 'team_leader_communication', 'team_leader_projects_innovation', 'team_leader_commercial', 'team_leader_hr'));
