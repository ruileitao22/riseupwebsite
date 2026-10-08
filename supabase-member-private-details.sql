-- Private personnel details. These fields are never exposed through the public team profile.

create table if not exists public.member_private_details (
  team_member_id uuid primary key references public.team_members (id) on delete cascade,
  date_of_birth date,
  address text,
  citizen_card_number text,
  emergency_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_private_details_birth_date_check check (date_of_birth is null or date_of_birth <= current_date),
  constraint member_private_details_address_length_check check (address is null or char_length(address) <= 500),
  constraint member_private_details_citizen_card_length_check check (citizen_card_number is null or char_length(citizen_card_number) <= 50),
  constraint member_private_details_emergency_phone_length_check check (emergency_phone is null or char_length(emergency_phone) <= 50)
);

alter table public.member_private_details enable row level security;
revoke all on public.member_private_details from anon, authenticated;
grant select, insert, update on public.member_private_details to authenticated;

drop policy if exists "Members and team managers read private details" on public.member_private_details;
create policy "Members and team managers read private details"
  on public.member_private_details
  for select
  to authenticated
  using (
    public.can_manage_team()
    or exists (
      select 1
      from public.team_members member
      where member.id = member_private_details.team_member_id
        and member.user_id = (select auth.uid())
    )
  );

drop policy if exists "Members and team managers add private details" on public.member_private_details;
create policy "Members and team managers add private details"
  on public.member_private_details
  for insert
  to authenticated
  with check (
    public.can_manage_team()
    or exists (
      select 1
      from public.team_members member
      where member.id = member_private_details.team_member_id
        and member.user_id = (select auth.uid())
    )
  );

drop policy if exists "Members and team managers update private details" on public.member_private_details;
create policy "Members and team managers update private details"
  on public.member_private_details
  for update
  to authenticated
  using (
    public.can_manage_team()
    or exists (
      select 1
      from public.team_members member
      where member.id = member_private_details.team_member_id
        and member.user_id = (select auth.uid())
    )
  )
  with check (
    public.can_manage_team()
    or exists (
      select 1
      from public.team_members member
      where member.id = member_private_details.team_member_id
        and member.user_id = (select auth.uid())
    )
  );

drop trigger if exists set_member_private_details_updated_at on public.member_private_details;
create trigger set_member_private_details_updated_at
  before update on public.member_private_details
  for each row
  execute function public.set_updated_at();
