-- Confidential internal reporting channel. Reports are visible only to the Direction.

create table if not exists public.confidential_reports (
  id uuid primary key default gen_random_uuid(),
  report_type text not null default 'other',
  title text not null,
  description text not null,
  people_involved text,
  evidence_url text,
  is_anonymous boolean not null default false,
  submitted_by uuid references auth.users (id) on delete set null,
  status text not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint confidential_reports_type_check check (report_type in ('conduct', 'conflict', 'harassment', 'security', 'financial', 'other')),
  constraint confidential_reports_status_check check (status in ('submitted', 'reviewing', 'closed', 'archived')),
  constraint confidential_reports_title_length_check check (char_length(title) between 3 and 180),
  constraint confidential_reports_description_length_check check (char_length(description) between 10 and 5000),
  constraint confidential_reports_people_length_check check (people_involved is null or char_length(people_involved) <= 1000),
  constraint confidential_reports_evidence_length_check check (evidence_url is null or char_length(evidence_url) <= 2000),
  constraint confidential_reports_anonymous_submitter_check check ((is_anonymous and submitted_by is null) or (not is_anonymous and submitted_by is not null))
);

create index if not exists confidential_reports_created_at_idx on public.confidential_reports (created_at desc);
create index if not exists confidential_reports_status_idx on public.confidential_reports (status, created_at desc);

alter table public.confidential_reports enable row level security;
revoke all on table public.confidential_reports from anon, authenticated;
grant select, insert, update on table public.confidential_reports to authenticated;
grant all on table public.confidential_reports to service_role;

drop policy if exists "Members submit confidential reports" on public.confidential_reports;
create policy "Members submit confidential reports"
  on public.confidential_reports for insert to authenticated
  with check (
    ((not is_anonymous) and submitted_by = (select auth.uid()))
    or (is_anonymous and submitted_by is null)
  );

drop policy if exists "Direction reads confidential reports" on public.confidential_reports;
create policy "Direction reads confidential reports"
  on public.confidential_reports for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "Direction manages confidential reports" on public.confidential_reports;
create policy "Direction manages confidential reports"
  on public.confidential_reports for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop trigger if exists set_confidential_reports_updated_at on public.confidential_reports;
create trigger set_confidential_reports_updated_at
  before update on public.confidential_reports
  for each row execute function public.set_updated_at();
