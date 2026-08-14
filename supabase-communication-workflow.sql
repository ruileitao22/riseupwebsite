-- Comunicação: fluxo editorial leve (produção, revisão e associação a projetos)
alter table public.communication_posts
  add column if not exists copy text,
  add column if not exists review_notes text,
  add column if not exists reviewed_by uuid references auth.users (id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists project_id uuid references public.projects (id) on delete set null;

alter table public.communication_posts
  drop constraint if exists communication_posts_status_check;

alter table public.communication_posts
  add constraint communication_posts_status_check
  check (status in ('idea', 'draft', 'in_review', 'scheduled', 'published'));

create index if not exists communication_posts_project_status_idx
  on public.communication_posts (project_id, status);

alter table public.communication_posts
  add column if not exists retention_expires_at timestamptz;

create index if not exists communication_posts_retention_expires_at_idx
  on public.communication_posts (retention_expires_at)
  where retention_expires_at is not null;

create or replace function public.set_communication_post_retention()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.status in ('scheduled', 'published') then
    if tg_op = 'INSERT' or old.status is distinct from new.status or old.retention_expires_at is null then
      new.retention_expires_at := now() + interval '30 days';
    end if;
  else
    new.retention_expires_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists set_communication_post_retention on public.communication_posts;
create trigger set_communication_post_retention
before insert or update of status on public.communication_posts
for each row execute function public.set_communication_post_retention();

create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule(
  'purge-expired-communication-posts',
  '15 3 * * *',
  $$delete from public.communication_posts where retention_expires_at <= now()$$
);
