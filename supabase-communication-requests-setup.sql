-- Pedidos de comunicação — executar PRIMEIRO no Supabase SQL Editor.
-- Este ficheiro cria a tabela, validações, triggers, grants e políticas RLS.

create extension if not exists pgcrypto;

create table if not exists public.communication_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null,
  channels text[] not null default '{}',
  desired_publish_at timestamptz,
  asset_url text,
  status text not null default 'pending',
  scheduled_for timestamptz,
  rejection_reason text,
  decided_by uuid references auth.users (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint communication_requests_status_check check (status in ('pending', 'scheduled', 'rejected', 'completed')),
  constraint communication_requests_channels_check check (cardinality(channels) > 0),
  constraint communication_requests_decision_check check (
    (status = 'pending' and scheduled_for is null and rejection_reason is null)
    or (status in ('scheduled', 'completed') and scheduled_for is not null and rejection_reason is null)
    or (status = 'rejected' and nullif(btrim(rejection_reason), '') is not null and scheduled_for is null)
  )
);

create index if not exists communication_requests_requester_idx
  on public.communication_requests (requester_id, created_at desc);
create index if not exists communication_requests_status_schedule_idx
  on public.communication_requests (status, scheduled_for);

create or replace function public.prepare_communication_request_write()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if tg_op = 'UPDATE' then
    if new.requester_id is distinct from old.requester_id or new.created_at is distinct from old.created_at then
      raise exception 'The communication request author cannot be changed.';
    end if;
    new.updated_at := now();
  end if;

  if new.status = 'scheduled' and new.scheduled_for <= now() then
    new.status := 'completed';
  end if;
  return new;
end;
$$;

revoke all on function public.prepare_communication_request_write() from public;
drop trigger if exists prepare_communication_request_before_write on public.communication_requests;
create trigger prepare_communication_request_before_write
before insert or update on public.communication_requests
for each row execute function public.prepare_communication_request_write();

create or replace function public.finish_due_communication_requests()
returns integer
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  affected integer;
begin
  update public.communication_requests
  set status = 'completed'
  where status = 'scheduled' and scheduled_for <= now();
  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.finish_due_communication_requests() from public, anon, authenticated;

alter table public.communication_requests enable row level security;
grant select, insert, update on public.communication_requests to authenticated;

drop policy if exists "Members read own communication requests" on public.communication_requests;
drop policy if exists "Members create communication requests" on public.communication_requests;
drop policy if exists "Communication reads all communication requests" on public.communication_requests;
drop policy if exists "Communication decides communication requests" on public.communication_requests;

create policy "Members read own communication requests"
on public.communication_requests for select to authenticated
using (requester_id = (select auth.uid()));

create policy "Members create communication requests"
on public.communication_requests for insert to authenticated
with check (
  requester_id = (select auth.uid())
  and status = 'pending'
  and scheduled_for is null
  and rejection_reason is null
  and decided_by is null
  and decided_at is null
);

create policy "Communication reads all communication requests"
on public.communication_requests for select to authenticated
using ((select public.can_manage_communication()));

create policy "Communication decides communication requests"
on public.communication_requests for update to authenticated
using ((select public.can_manage_communication()))
with check ((select public.can_manage_communication()));

-- Deve devolver uma linha com table_name = communication_requests e rls_enabled = true.
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'communication_requests';
