-- Rise Up Legends
-- Execute this once in the Supabase SQL Editor before using the Legends option.

alter table public.team_members
  add column if not exists is_legend boolean not null default false;

create index if not exists team_members_is_legend_idx
  on public.team_members (is_legend)
  where is_legend = true;
