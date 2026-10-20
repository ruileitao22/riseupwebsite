-- Public-facing roles can be independent from the BackOffice access role.
-- A member may hold one or more responsibilities (for example, Treasurer and Team Leader).

create table if not exists public.team_member_public_roles (
  id uuid primary key default gen_random_uuid(),
  team_member_id uuid not null references public.team_members (id) on delete cascade,
  group_key text not null check (group_key in ('coordination', 'commercial_marketing', 'human_resources', 'communication', 'innovation_projects')),
  title text not null check (char_length(btrim(title)) between 2 and 120),
  sort_order integer not null default 100 check (sort_order between 0 and 9999),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_member_id, group_key, title)
);

create index if not exists team_member_public_roles_member_idx
  on public.team_member_public_roles (team_member_id, sort_order, title);

alter table public.team_member_public_roles enable row level security;

revoke all on public.team_member_public_roles from anon, authenticated;
grant select on public.team_member_public_roles to anon, authenticated;
grant insert, update, delete on public.team_member_public_roles to authenticated;

drop policy if exists "Public can read current team public roles" on public.team_member_public_roles;
create policy "Public can read current team public roles"
  on public.team_member_public_roles for select to anon, authenticated
  using (
    public.can_manage_team()
    or exists (
      select 1 from public.team_members member
      where member.id = team_member_id
        and member.is_active = true
        and coalesce(member.is_legend, false) = false
        and coalesce(member.is_ex_riser, false) = false
    )
  );

drop policy if exists "Team managers manage public roles" on public.team_member_public_roles;
create policy "Team managers manage public roles"
  on public.team_member_public_roles for all to authenticated
  using (public.can_manage_team())
  with check (public.can_manage_team());

drop trigger if exists set_team_member_public_roles_updated_at on public.team_member_public_roles;
create trigger set_team_member_public_roles_updated_at
  before update on public.team_member_public_roles
  for each row execute function public.set_updated_at();

insert into public.team_member_public_roles (team_member_id, group_key, title, sort_order)
select member.id, seed.group_key, seed.title, seed.sort_order
from public.team_members member
join (
  values
    ('Rui Leitão', 'coordination', 'Coordenador', 10),
    ('Carina Silva', 'coordination', 'Vice-Coordenadora', 20),
    ('Gabriel Vaz', 'coordination', 'Tesoureiro', 30),
    ('Gabriel Vaz', 'commercial_marketing', 'Team Líder', 10),
    ('Sofia Monteiro', 'human_resources', 'Team Líder', 10),
    ('Sílvia Alves', 'human_resources', 'Recursos Humanos', 20),
    ('Mariana Postiga', 'communication', 'Team Líder', 10),
    ('Eduarda Martins', 'communication', 'Social Media Manager', 20),
    ('Guilherme Ribeiro', 'communication', 'Comunicação', 30),
    ('João Barbosa', 'innovation_projects', 'Team Líder', 10)
) as seed(member_name, group_key, title, sort_order)
  on member.name = seed.member_name
on conflict (team_member_id, group_key, title)
  do update set sort_order = excluded.sort_order;
