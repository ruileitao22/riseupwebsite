-- Private personnel details. These fields are never exposed through the public team profile.

create table if not exists public.member_private_details (
  team_member_id uuid primary key references public.team_members (id) on delete cascade,
  date_of_birth date,
  address text,
  address_street text,
  address_postal_code text,
  address_city text,
  address_parish text,
  citizen_card_number text,
  emergency_phone text,
  emergency_contact_name text,
  emergency_contact_relationship text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_private_details_birth_date_check check (date_of_birth is null or date_of_birth <= current_date),
  constraint member_private_details_address_length_check check (address is null or char_length(address) <= 500),
  constraint member_private_details_address_street_length_check check (address_street is null or char_length(address_street) <= 300),
  constraint member_private_details_address_postal_code_length_check check (address_postal_code is null or char_length(address_postal_code) <= 20),
  constraint member_private_details_address_city_length_check check (address_city is null or char_length(address_city) <= 120),
  constraint member_private_details_address_parish_length_check check (address_parish is null or char_length(address_parish) <= 120),
  constraint member_private_details_citizen_card_length_check check (citizen_card_number is null or char_length(citizen_card_number) <= 50),
  constraint member_private_details_emergency_phone_length_check check (emergency_phone is null or char_length(emergency_phone) <= 50),
  constraint member_private_details_emergency_contact_name_length_check check (emergency_contact_name is null or char_length(emergency_contact_name) <= 120),
  constraint member_private_details_emergency_contact_relationship_length_check check (emergency_contact_relationship is null or char_length(emergency_contact_relationship) <= 80)
);

alter table public.member_private_details
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_relationship text,
  add column if not exists address_street text,
  add column if not exists address_postal_code text,
  add column if not exists address_city text,
  add column if not exists address_parish text;

update public.member_private_details
set address_street = address
where address_street is null and address is not null;

alter table public.member_private_details
  drop constraint if exists member_private_details_address_street_length_check,
  drop constraint if exists member_private_details_address_postal_code_length_check,
  drop constraint if exists member_private_details_address_city_length_check,
  drop constraint if exists member_private_details_address_parish_length_check;

alter table public.member_private_details
  add constraint member_private_details_address_street_length_check check (address_street is null or char_length(address_street) <= 300),
  add constraint member_private_details_address_postal_code_length_check check (address_postal_code is null or char_length(address_postal_code) <= 20),
  add constraint member_private_details_address_city_length_check check (address_city is null or char_length(address_city) <= 120),
  add constraint member_private_details_address_parish_length_check check (address_parish is null or char_length(address_parish) <= 120);

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
