-- Rise Up BackOffice workspace modules
-- Run after supabase-setup.sql in the Supabase SQL editor.

create extension if not exists pgcrypto;

alter table public.user_profiles drop constraint if exists user_profiles_role_check;
alter table public.user_profiles
  add constraint user_profiles_role_check
  check (role in ('admin', 'coordinator', 'vice_coordinator', 'member', 'communication_team', 'projects_innovation_team', 'commercial_team', 'hr_team', 'team_leader', 'team_leader_communication', 'team_leader_projects_innovation', 'team_leader_commercial', 'team_leader_hr'));

create or replace function public.can_manage_projects()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'coordinator', 'vice_coordinator', 'projects_innovation_team', 'team_leader_projects_innovation');
$$;

create or replace function public.can_manage_communication()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'coordinator', 'vice_coordinator', 'communication_team', 'team_leader_communication');
$$;

create or replace function public.can_manage_hr()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'coordinator', 'vice_coordinator', 'hr_team', 'team_leader_hr');
$$;

create or replace function public.can_manage_team()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'coordinator', 'vice_coordinator', 'hr_team', 'team_leader_hr');
$$;

alter table public.projects
  add column if not exists client_name text,
  add column if not exists responsible_id uuid references public.team_members (id) on delete set null,
  add column if not exists deadline date;

alter table public.project_members
  add column if not exists is_responsible boolean not null default false;

insert into public.project_members (project_id, team_member_id, is_responsible)
select project.id, project.responsible_id, true
from public.projects project
where project.responsible_id is not null
on conflict (project_id, team_member_id)
do update set is_responsible = true;

create or replace function public.can_lead_tasks()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'coordinator', 'vice_coordinator', 'team_leader', 'team_leader_communication', 'team_leader_projects_innovation', 'team_leader_commercial', 'team_leader_hr');
$$;

create table if not exists public.workspace_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  priority text not null default 'medium',
  status text not null default 'todo',
  due_date date,
  created_by uuid not null references auth.users (id) on delete cascade,
  assigned_to uuid references auth.users (id) on delete set null,
  project_id uuid references public.projects (id) on delete cascade,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_tasks_priority_check check (priority in ('low', 'medium', 'high', 'urgent')),
  constraint workspace_tasks_status_check check (status in ('todo', 'in_progress', 'done')),
  constraint workspace_tasks_title_check check (char_length(trim(title)) between 1 and 180),
  constraint workspace_tasks_description_check check (description is null or char_length(description) <= 2000)
);

create table if not exists public.workspace_task_assignees (
  task_id uuid not null references public.workspace_tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  assigned_by uuid references auth.users (id) on delete set null,
  assigned_at timestamptz not null default now(),
  primary key (task_id, user_id)
);

insert into public.workspace_task_assignees (task_id, user_id, assigned_by)
select id, assigned_to, created_by
from public.workspace_tasks
where assigned_to is not null
on conflict (task_id, user_id) do nothing;

create table if not exists public.workspace_notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience text not null default 'all',
  created_by uuid references auth.users (id) on delete set null,
  published_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_type text not null default 'event',
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_events_type_check check (event_type in ('event', 'meeting', 'hr', 'editorial'))
);

create table if not exists public.communication_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  channel text,
  status text not null default 'idea',
  scheduled_for timestamptz,
  asset_url text,
  copy text,
  notes text,
  review_notes text,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  project_id uuid references public.projects (id) on delete set null,
  retention_expires_at timestamptz,
  owner_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint communication_posts_status_check check (status in ('idea', 'draft', 'in_review', 'scheduled', 'published'))
);

create table if not exists public.workspace_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  file_url text not null,
  project_id uuid references public.projects (id) on delete cascade,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_documents_category_check check (category in ('statutes', 'regulations', 'templates', 'minutes', 'guides', 'brand', 'project'))
);

create table if not exists public.commercial_opportunities (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  origin text not null default 'manual',
  service_interest text,
  stage text not null default 'new',
  owner_id uuid references auth.users (id) on delete set null,
  next_action text,
  next_action_at timestamptz,
  estimated_value numeric(12, 2),
  notes text,
  contact_submission_id bigint references public.contact_submissions (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commercial_opportunities_stage_check check (stage in ('new', 'qualified', 'meeting', 'proposal', 'negotiation', 'won', 'lost')),
  constraint commercial_opportunities_value_check check (estimated_value is null or estimated_value >= 0)
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.workspace_events (id) on delete cascade,
  member_id uuid not null references public.team_members (id) on delete cascade,
  status text not null default 'present',
  notes text,
  recorded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_records_unique unique (event_id, member_id),
  constraint attendance_records_status_check check (status in ('present', 'absent', 'justified'))
);

create table if not exists public.role_history (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.team_members (id) on delete cascade,
  role_title text not null,
  started_on date not null,
  ended_on date,
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint role_history_dates_check check (ended_on is null or ended_on >= started_on)
);

create table if not exists public.organization_chart_nodes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  member_id uuid references public.team_members (id) on delete set null,
  parent_id uuid references public.organization_chart_nodes (id) on delete set null,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_chart_title_check check (char_length(trim(title)) between 1 and 120),
  constraint organization_chart_sort_check check (sort_order > 0),
  constraint organization_chart_no_self_parent check (parent_id is null or parent_id <> id)
);

create table if not exists public.project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  body text not null,
  author_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_comments_body_check check (char_length(trim(body)) between 1 and 3000)
);

create index if not exists workspace_tasks_assigned_to_idx on public.workspace_tasks (assigned_to, status, due_date);
create index if not exists workspace_tasks_project_id_idx on public.workspace_tasks (project_id);
create index if not exists workspace_task_assignees_user_idx on public.workspace_task_assignees (user_id, task_id);
create index if not exists workspace_events_starts_at_idx on public.workspace_events (starts_at);
create index if not exists communication_posts_scheduled_for_idx on public.communication_posts (scheduled_for);
create index if not exists communication_posts_project_status_idx on public.communication_posts (project_id, status);
create index if not exists communication_posts_retention_expires_at_idx on public.communication_posts (retention_expires_at) where retention_expires_at is not null;
create index if not exists workspace_documents_category_idx on public.workspace_documents (category, created_at desc);
create index if not exists commercial_opportunities_stage_idx on public.commercial_opportunities (stage, next_action_at);
create index if not exists commercial_opportunities_owner_idx on public.commercial_opportunities (owner_id, next_action_at);
create index if not exists role_history_member_id_idx on public.role_history (member_id, started_on desc);
create index if not exists organization_chart_parent_idx on public.organization_chart_nodes (parent_id, sort_order);
create index if not exists project_comments_project_id_idx on public.project_comments (project_id, created_at);

drop trigger if exists set_workspace_tasks_updated_at on public.workspace_tasks;
create trigger set_workspace_tasks_updated_at before update on public.workspace_tasks for each row execute function public.set_updated_at();
drop trigger if exists set_workspace_notices_updated_at on public.workspace_notices;
create trigger set_workspace_notices_updated_at before update on public.workspace_notices for each row execute function public.set_updated_at();
drop trigger if exists set_workspace_events_updated_at on public.workspace_events;
create trigger set_workspace_events_updated_at before update on public.workspace_events for each row execute function public.set_updated_at();
drop trigger if exists set_communication_posts_updated_at on public.communication_posts;
create trigger set_communication_posts_updated_at before update on public.communication_posts for each row execute function public.set_updated_at();
drop trigger if exists set_workspace_documents_updated_at on public.workspace_documents;
create trigger set_workspace_documents_updated_at before update on public.workspace_documents for each row execute function public.set_updated_at();
drop trigger if exists set_commercial_opportunities_updated_at on public.commercial_opportunities;
create trigger set_commercial_opportunities_updated_at before update on public.commercial_opportunities for each row execute function public.set_updated_at();
drop trigger if exists set_attendance_records_updated_at on public.attendance_records;
create trigger set_attendance_records_updated_at before update on public.attendance_records for each row execute function public.set_updated_at();
drop trigger if exists set_role_history_updated_at on public.role_history;
create trigger set_role_history_updated_at before update on public.role_history for each row execute function public.set_updated_at();
drop trigger if exists set_organization_chart_updated_at on public.organization_chart_nodes;
create trigger set_organization_chart_updated_at before update on public.organization_chart_nodes for each row execute function public.set_updated_at();
drop trigger if exists set_project_comments_updated_at on public.project_comments;
create trigger set_project_comments_updated_at before update on public.project_comments for each row execute function public.set_updated_at();

alter table public.workspace_tasks enable row level security;
alter table public.workspace_task_assignees enable row level security;
alter table public.workspace_notices enable row level security;
alter table public.workspace_events enable row level security;
alter table public.communication_posts enable row level security;
alter table public.workspace_documents enable row level security;
alter table public.commercial_opportunities enable row level security;
alter table public.attendance_records enable row level security;
alter table public.role_history enable row level security;
alter table public.organization_chart_nodes enable row level security;
alter table public.project_comments enable row level security;

grant select, insert, update, delete on public.workspace_tasks to authenticated;
grant select, insert, update, delete on public.workspace_task_assignees to authenticated;
grant select, insert, update, delete on public.workspace_notices to authenticated;
grant select, insert, update, delete on public.workspace_events to authenticated;
grant select, insert, update, delete on public.communication_posts to authenticated;
grant select, insert, update, delete on public.workspace_documents to authenticated;
grant select, insert, update, delete on public.commercial_opportunities to authenticated;
grant select, insert, update, delete on public.attendance_records to authenticated;
grant select, insert, update, delete on public.role_history to authenticated;
grant select, insert, update, delete on public.organization_chart_nodes to authenticated;
grant select, insert, update, delete on public.project_comments to authenticated;

drop policy if exists "Members read workspace tasks" on public.workspace_tasks;
drop policy if exists "Members create tasks" on public.workspace_tasks;
drop policy if exists "Task owners and leaders update tasks" on public.workspace_tasks;
drop policy if exists "Task creators and leaders delete tasks" on public.workspace_tasks;
drop policy if exists "Members read task assignees" on public.workspace_task_assignees;
drop policy if exists "Task creators and leaders assign members" on public.workspace_task_assignees;
drop policy if exists "Task creators and leaders remove assignees" on public.workspace_task_assignees;
drop policy if exists "Members read notices" on public.workspace_notices;
drop policy if exists "Coordination manages notices" on public.workspace_notices;
drop policy if exists "Members read events" on public.workspace_events;
drop policy if exists "Coordination and HR manage events" on public.workspace_events;
drop policy if exists "Members read communication posts" on public.communication_posts;
drop policy if exists "Communication manages posts" on public.communication_posts;
drop policy if exists "Commercial manages opportunities" on public.commercial_opportunities;
drop policy if exists "Members read documents" on public.workspace_documents;
drop policy if exists "Members upload documents" on public.workspace_documents;
drop policy if exists "Leaders read documents" on public.workspace_documents;
drop policy if exists "Leaders upload documents" on public.workspace_documents;
drop policy if exists "Uploaders and admins manage documents" on public.workspace_documents;
drop policy if exists "Uploaders and admins delete documents" on public.workspace_documents;
drop policy if exists "Members read attendance" on public.attendance_records;
drop policy if exists "HR manages attendance" on public.attendance_records;
drop policy if exists "Members read role history" on public.role_history;
drop policy if exists "HR manages role history" on public.role_history;
drop policy if exists "HR reads organization chart" on public.organization_chart_nodes;
drop policy if exists "HR manages organization chart" on public.organization_chart_nodes;
drop policy if exists "Members read project comments" on public.project_comments;
drop policy if exists "Members create project comments" on public.project_comments;
drop policy if exists "Authors manage project comments" on public.project_comments;
drop policy if exists "Authors delete project comments" on public.project_comments;

create policy "Members read workspace tasks" on public.workspace_tasks for select to authenticated using (true);
create policy "Members create tasks" on public.workspace_tasks for insert to authenticated
  with check (created_by = auth.uid() and (assigned_to = auth.uid() or public.can_lead_tasks()));
create policy "Task owners and leaders update tasks" on public.workspace_tasks for update to authenticated
  using (created_by = auth.uid() or assigned_to = auth.uid() or public.can_lead_tasks()
    or exists (select 1 from public.workspace_task_assignees assignment where assignment.task_id = id and assignment.user_id = auth.uid()))
  with check (created_by = auth.uid() or assigned_to = auth.uid() or public.can_lead_tasks()
    or exists (select 1 from public.workspace_task_assignees assignment where assignment.task_id = id and assignment.user_id = auth.uid()));
create policy "Task creators and leaders delete tasks" on public.workspace_tasks for delete to authenticated
  using (created_by = auth.uid() or public.can_lead_tasks());

create policy "Members read task assignees" on public.workspace_task_assignees for select to authenticated using (true);
create policy "Task creators and leaders assign members" on public.workspace_task_assignees for insert to authenticated
  with check (
    assigned_by = auth.uid()
    and (user_id = auth.uid() or public.can_lead_tasks())
    and exists (
      select 1 from public.workspace_tasks task
      where task.id = task_id and (task.created_by = auth.uid() or public.can_lead_tasks())
    )
  );
create policy "Task creators and leaders remove assignees" on public.workspace_task_assignees for delete to authenticated
  using (
    exists (
      select 1 from public.workspace_tasks task
      where task.id = task_id and (task.created_by = auth.uid() or public.can_lead_tasks())
    )
  );

create policy "Members read notices" on public.workspace_notices for select to authenticated using (true);
create policy "Coordination manages notices" on public.workspace_notices for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Members read events" on public.workspace_events for select to authenticated using (true);
create policy "Coordination and HR manage events" on public.workspace_events for all to authenticated
  using (public.is_admin() or public.can_manage_hr()) with check (public.is_admin() or public.can_manage_hr());

create policy "Members read communication posts" on public.communication_posts for select to authenticated using (true);
create policy "Communication manages posts" on public.communication_posts for all to authenticated
  using (public.can_manage_communication()) with check (public.can_manage_communication());
create policy "Commercial manages opportunities" on public.commercial_opportunities for all to authenticated
  using ((select public.current_user_role()) in ('admin', 'coordinator', 'vice_coordinator', 'commercial_team', 'team_leader_commercial'))
  with check ((select public.current_user_role()) in ('admin', 'coordinator', 'vice_coordinator', 'commercial_team', 'team_leader_commercial'));

create policy "Leaders read documents" on public.workspace_documents for select to authenticated
  using (public.can_lead_tasks());
create policy "Leaders upload documents" on public.workspace_documents for insert to authenticated
  with check (public.can_lead_tasks() and uploaded_by = auth.uid());
create policy "Uploaders and admins manage documents" on public.workspace_documents for update to authenticated
  using (public.can_lead_tasks() and (uploaded_by = auth.uid() or public.is_admin()))
  with check (public.can_lead_tasks() and (uploaded_by = auth.uid() or public.is_admin()));
create policy "Uploaders and admins delete documents" on public.workspace_documents for delete to authenticated
  using (public.can_lead_tasks() and (uploaded_by = auth.uid() or public.is_admin()));

create policy "Members read attendance" on public.attendance_records for select to authenticated using (true);
create policy "HR manages attendance" on public.attendance_records for all to authenticated
  using (public.can_manage_hr()) with check (public.can_manage_hr());

create policy "Members read role history" on public.role_history for select to authenticated using (true);
create policy "HR manages role history" on public.role_history for all to authenticated
  using (public.can_manage_hr()) with check (public.can_manage_hr());

create policy "HR reads organization chart" on public.organization_chart_nodes for select to authenticated
  using (public.can_manage_hr());
create policy "HR manages organization chart" on public.organization_chart_nodes for all to authenticated
  using (public.can_manage_hr()) with check (public.can_manage_hr());

create policy "Members read project comments" on public.project_comments for select to authenticated using (true);
create policy "Members create project comments" on public.project_comments for insert to authenticated
  with check (author_id = auth.uid());
create policy "Authors manage project comments" on public.project_comments for update to authenticated
  using (author_id = auth.uid() or public.is_admin()) with check (author_id = auth.uid() or public.is_admin());
create policy "Authors delete project comments" on public.project_comments for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

drop policy if exists "Authenticated members read internal projects" on public.projects;
create policy "Authenticated members read internal projects" on public.projects for select to authenticated using (true);

insert into storage.buckets (id, name, public)
values ('workspace-documents', 'workspace-documents', false), ('communication-assets', 'communication-assets', false)
on conflict (id) do nothing;

drop policy if exists "Members read workspace files" on storage.objects;
drop policy if exists "Members upload workspace files" on storage.objects;
drop policy if exists "Leaders read workspace files" on storage.objects;
drop policy if exists "Leaders upload workspace files" on storage.objects;
drop policy if exists "Members read communication assets" on storage.objects;
drop policy if exists "Communication uploads assets" on storage.objects;
drop policy if exists "Owners manage workspace files" on storage.objects;
drop policy if exists "Owners delete workspace files" on storage.objects;

create policy "Leaders read workspace files" on storage.objects for select to authenticated
  using (bucket_id = 'workspace-documents' and public.can_lead_tasks());
create policy "Leaders upload workspace files" on storage.objects for insert to authenticated
  with check (bucket_id = 'workspace-documents' and public.can_lead_tasks() and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Members read communication assets" on storage.objects for select to authenticated
  using (bucket_id = 'communication-assets');
create policy "Communication uploads assets" on storage.objects for insert to authenticated
  with check (bucket_id = 'communication-assets' and public.can_manage_communication() and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Owners manage workspace files" on storage.objects for update to authenticated
  using (owner_id = auth.uid()::text and ((bucket_id = 'workspace-documents' and public.can_lead_tasks()) or (bucket_id = 'communication-assets' and public.can_manage_communication())))
  with check (owner_id = auth.uid()::text and ((bucket_id = 'workspace-documents' and public.can_lead_tasks()) or (bucket_id = 'communication-assets' and public.can_manage_communication())));
create policy "Owners delete workspace files" on storage.objects for delete to authenticated
  using (owner_id = auth.uid()::text and ((bucket_id = 'workspace-documents' and public.can_lead_tasks()) or (bucket_id = 'communication-assets' and public.can_manage_communication())));
