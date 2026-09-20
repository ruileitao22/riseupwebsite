-- Allow students, professors, Rise Up Legends and external participants in Open Day registrations.
alter table public.open_day_registrations
  add column if not exists participant_type text not null default 'student',
  add column if not exists organization text not null default '';
alter table public.open_day_registrations drop constraint if exists open_day_registrations_course_check;
alter table public.open_day_registrations drop constraint if exists open_day_registrations_participant_type_check;
alter table public.open_day_registrations drop constraint if exists open_day_registrations_organization_check;
alter table public.open_day_registrations drop constraint if exists open_day_registrations_student_course_check;
alter table public.open_day_registrations drop constraint if exists open_day_registrations_profile_fields_check;
alter table public.open_day_registrations
  add constraint open_day_registrations_course_check check (char_length(course) <= 160),
  add constraint open_day_registrations_participant_type_check check (participant_type in ('student', 'professor', 'legend', 'external')),
  add constraint open_day_registrations_organization_check check (char_length(organization) <= 160),
  add constraint open_day_registrations_student_course_check check (participant_type <> 'student' or char_length(btrim(course)) >= 1),
  add constraint open_day_registrations_profile_fields_check check (
    (participant_type = 'student' and organization = '') or
    (participant_type = 'professor' and student_number = '' and course = '') or
    (participant_type = 'external' and student_number = '' and course = '') or
    (participant_type = 'legend' and organization = '' and student_number = '' and course = '')
  );
revoke insert, update on public.open_day_registrations from anon, authenticated;
grant insert (name, participant_type, organization, student_number, course, email, phone, lunch, dietary_requirements) on public.open_day_registrations to anon;
grant update (name, participant_type, organization, student_number, course, email, phone, lunch, dietary_requirements) on public.open_day_registrations to authenticated;
