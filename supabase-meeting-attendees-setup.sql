-- Meeting audience and notification support for existing Rise Up BackOffice installations.
-- Run once in the Supabase SQL editor.

alter table public.workspace_events
  add column if not exists attendee_ids uuid[] not null default '{}';

drop policy if exists "Members read events" on public.workspace_events;
drop policy if exists "Members read relevant events" on public.workspace_events;

create policy "Members read relevant events" on public.workspace_events for select to authenticated
  using (
    event_type <> 'meeting'
    or cardinality(attendee_ids) = 0
    or (select auth.uid()) = any(attendee_ids)
    or (select public.can_lead_tasks())
  );
