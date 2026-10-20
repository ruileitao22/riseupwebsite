-- Keep warnings private to Coordination and Human Resources, while allowing
-- Coordination and Team Leaders to manage public events and meetings.

alter table public.workspace_notices enable row level security;
alter table public.workspace_events enable row level security;

revoke all on table public.workspace_notices from anon;
revoke all on table public.workspace_events from anon;
grant select, insert, update, delete on table public.workspace_notices to authenticated;
grant select, insert, update, delete on table public.workspace_events to authenticated;
grant all on table public.workspace_notices to service_role;
grant all on table public.workspace_events to service_role;

drop policy if exists "Members read notices" on public.workspace_notices;
drop policy if exists "Coordination manages notices" on public.workspace_notices;
drop policy if exists "Coordination and HR read private warnings" on public.workspace_notices;
drop policy if exists "Coordination and HR create private warnings" on public.workspace_notices;
drop policy if exists "Coordination and HR update private warnings" on public.workspace_notices;
drop policy if exists "Coordination and HR delete private warnings" on public.workspace_notices;

create policy "Coordination and HR read private warnings"
  on public.workspace_notices for select to authenticated
  using ((select public.can_manage_hr()));

create policy "Coordination and HR create private warnings"
  on public.workspace_notices for insert to authenticated
  with check ((select public.can_manage_hr()));

create policy "Coordination and HR update private warnings"
  on public.workspace_notices for update to authenticated
  using ((select public.can_manage_hr()))
  with check ((select public.can_manage_hr()));

create policy "Coordination and HR delete private warnings"
  on public.workspace_notices for delete to authenticated
  using ((select public.can_manage_hr()));

drop policy if exists "Coordination and HR manage events" on public.workspace_events;
drop policy if exists "Leaders create events and meetings" on public.workspace_events;
drop policy if exists "Leaders update events and meetings" on public.workspace_events;
drop policy if exists "Leaders delete events and meetings" on public.workspace_events;

create policy "Leaders create events and meetings"
  on public.workspace_events for insert to authenticated
  with check (
    (event_type = 'hr' and (select public.can_manage_hr()))
    or (event_type in ('event', 'meeting', 'editorial') and (select public.can_lead_tasks()))
  );

create policy "Leaders update events and meetings"
  on public.workspace_events for update to authenticated
  using (
    (event_type = 'hr' and (select public.can_manage_hr()))
    or (event_type in ('event', 'meeting', 'editorial') and (select public.can_lead_tasks()))
  )
  with check (
    (event_type = 'hr' and (select public.can_manage_hr()))
    or (event_type in ('event', 'meeting', 'editorial') and (select public.can_lead_tasks()))
  );

create policy "Leaders delete events and meetings"
  on public.workspace_events for delete to authenticated
  using (
    (event_type = 'hr' and (select public.can_manage_hr()))
    or (event_type in ('event', 'meeting', 'editorial') and (select public.can_lead_tasks()))
  );
