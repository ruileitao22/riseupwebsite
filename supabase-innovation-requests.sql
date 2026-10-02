-- Banco de Ideias e Problemas. Run once in the Supabase SQL editor if the
-- migration has not been applied through the project's deployment process.
create table if not exists public.innovation_requests (
  id uuid primary key default gen_random_uuid(),
  request_type text not null check (request_type in ('idea', 'problem')),
  title text not null check (char_length(trim(title)) between 1 and 180),
  description text not null check (char_length(trim(description)) between 1 and 4000),
  status text not null default 'new' check (status in ('new', 'reviewing', 'planned', 'resolved', 'archived')),
  submitted_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists innovation_requests_created_at_idx on public.innovation_requests (created_at desc);
create index if not exists innovation_requests_status_idx on public.innovation_requests (status);
alter table public.innovation_requests enable row level security;
grant select, insert, update on public.innovation_requests to authenticated;

drop policy if exists "Members can submit innovation requests" on public.innovation_requests;
create policy "Members can submit innovation requests" on public.innovation_requests for insert to authenticated with check ((select auth.uid()) = submitted_by);
drop policy if exists "Members can read their own innovation requests" on public.innovation_requests;
create policy "Members can read their own innovation requests" on public.innovation_requests for select to authenticated using ((select auth.uid()) = submitted_by);
drop policy if exists "Innovation team can manage innovation requests" on public.innovation_requests;
create policy "Innovation team can manage innovation requests" on public.innovation_requests for all to authenticated using (public.can_manage_projects()) with check (public.can_manage_projects());
