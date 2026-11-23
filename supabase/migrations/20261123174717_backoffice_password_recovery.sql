create schema if not exists backoffice_recovery;
revoke all on schema backoffice_recovery from public, anon, authenticated;
grant usage on schema backoffice_recovery to service_role;

create table backoffice_recovery.challenges (
  user_id uuid primary key references auth.users (id) on delete cascade,
  code_hash text,
  issued_at timestamptz not null,
  window_started_at timestamptz not null,
  send_count integer not null,
  attempts_left integer not null
);

alter table backoffice_recovery.challenges enable row level security;
revoke all on table backoffice_recovery.challenges from public, anon, authenticated, service_role;

create view backoffice_recovery.eligible_accounts as
select u.id, u.email
from auth.users u
join public.user_profiles p on p.id = u.id
where u.email_confirmed_at is not null
  and u.deleted_at is null
  and (u.banned_until is null or u.banned_until <= now())
  and not u.is_anonymous
  and not u.is_sso_user
  and p.role <> 'ex_riser'
  and not exists (
    select 1 from public.team_members m where m.user_id = u.id and m.is_ex_riser
  );

create function backoffice_recovery.issue(account_email text, proposed_hash text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with issued as (
    insert into backoffice_recovery.challenges as c
      (user_id, code_hash, issued_at, window_started_at, send_count, attempts_left)
    select a.id, proposed_hash, now(), now(), 1, 5
    from backoffice_recovery.eligible_accounts a
    where a.email = account_email
    on conflict (user_id) do update
    set code_hash = excluded.code_hash,
        issued_at = excluded.issued_at,
        window_started_at = case when c.window_started_at <= now() - interval '15 minutes'
          then excluded.window_started_at else c.window_started_at end,
        send_count = case when c.window_started_at <= now() - interval '15 minutes'
          then 1 else c.send_count + 1 end,
        attempts_left = excluded.attempts_left
    where c.issued_at <= now() - interval '1 minute'
      and (c.window_started_at <= now() - interval '15 minutes' or c.send_count < 3)
    returning 1
  )
  select exists (select 1 from issued);
$$;

create function backoffice_recovery.consume(account_email text, supplied_hash text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  challenge backoffice_recovery.challenges%rowtype;
  matches_code boolean;
begin
  select c.* into challenge
  from backoffice_recovery.challenges c
  join backoffice_recovery.eligible_accounts a on a.id = c.user_id
  where a.email = account_email
    and c.code_hash is not null
    and c.attempts_left > 0
    and c.issued_at > now() - interval '10 minutes'
  for update of c;

  if not found then
    return null;
  end if;

  matches_code := challenge.code_hash = supplied_hash;
  update backoffice_recovery.challenges
  set code_hash = case when matches_code or challenge.attempts_left = 1 then null else challenge.code_hash end,
      attempts_left = case when matches_code then 0 else challenge.attempts_left - 1 end
  where user_id = challenge.user_id;

  return case when matches_code then challenge.user_id else null end;
end;
$$;

create function public.issue_backoffice_recovery(account_email text, proposed_hash text)
returns boolean
language sql
set search_path = ''
as $$ select backoffice_recovery.issue(account_email, proposed_hash); $$;

create function public.consume_backoffice_recovery(account_email text, supplied_hash text)
returns uuid
language sql
set search_path = ''
as $$ select backoffice_recovery.consume(account_email, supplied_hash); $$;

revoke all on function backoffice_recovery.issue(text, text), backoffice_recovery.consume(text, text),
  public.issue_backoffice_recovery(text, text), public.consume_backoffice_recovery(text, text)
  from public, anon, authenticated;
grant execute on function backoffice_recovery.issue(text, text), backoffice_recovery.consume(text, text),
  public.issue_backoffice_recovery(text, text), public.consume_backoffice_recovery(text, text)
  to service_role;
