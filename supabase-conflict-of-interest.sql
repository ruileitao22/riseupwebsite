-- Conflict-of-interest declarations. Members see only their own declarations; Direction manages all records.

create table if not exists public.conflict_of_interest_declarations (
  id uuid primary key default gen_random_uuid(),
  declarant_id uuid not null references auth.users (id) on delete cascade,
  category text not null default 'other',
  subject text not null,
  related_party text,
  description text not null,
  proposed_mitigation text,
  status text not null default 'declared',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conflict_declarations_category_check check (category in ('financial', 'family_personal', 'professional', 'institutional', 'other')),
  constraint conflict_declarations_status_check check (status in ('declared', 'reviewing', 'resolved', 'archived')),
  constraint conflict_declarations_subject_length_check check (char_length(subject) between 3 and 180),
  constraint conflict_declarations_description_length_check check (char_length(description) between 10 and 5000),
  constraint conflict_declarations_related_party_length_check check (related_party is null or char_length(related_party) <= 1000),
  constraint conflict_declarations_mitigation_length_check check (proposed_mitigation is null or char_length(proposed_mitigation) <= 3000)
);

create index if not exists conflict_declarations_declarant_created_idx on public.conflict_of_interest_declarations (declarant_id, created_at desc);
create index if not exists conflict_declarations_status_created_idx on public.conflict_of_interest_declarations (status, created_at desc);

alter table public.conflict_of_interest_declarations enable row level security;
revoke all on table public.conflict_of_interest_declarations from anon, authenticated;
grant select, insert, update on table public.conflict_of_interest_declarations to authenticated;
grant all on table public.conflict_of_interest_declarations to service_role;

drop policy if exists "Members declare conflicts of interest" on public.conflict_of_interest_declarations;
create policy "Members declare conflicts of interest"
  on public.conflict_of_interest_declarations for insert to authenticated
  with check (declarant_id = (select auth.uid()));

drop policy if exists "Members read own conflicts; Direction reads all" on public.conflict_of_interest_declarations;
create policy "Members read own conflicts; Direction reads all"
  on public.conflict_of_interest_declarations for select to authenticated
  using (declarant_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Direction manages conflicts of interest" on public.conflict_of_interest_declarations;
create policy "Direction manages conflicts of interest"
  on public.conflict_of_interest_declarations for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop trigger if exists set_conflict_declarations_updated_at on public.conflict_of_interest_declarations;
create trigger set_conflict_declarations_updated_at
  before update on public.conflict_of_interest_declarations
  for each row execute function public.set_updated_at();
