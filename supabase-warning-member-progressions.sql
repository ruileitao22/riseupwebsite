-- Associate private HR warnings with a member and support the 12-month progression window.

alter table public.workspace_notices
  add column if not exists member_id uuid references public.team_members (id) on delete set null,
  add column if not exists warning_type text not null default 'informal';

alter table public.workspace_notices drop constraint if exists workspace_notices_warning_type_check;
alter table public.workspace_notices
  add constraint workspace_notices_warning_type_check
  check (warning_type in ('informal', 'first', 'second', 'third', 'serious'));

create index if not exists workspace_notices_member_published_idx
  on public.workspace_notices (member_id, published_at desc)
  where audience = 'hr';
