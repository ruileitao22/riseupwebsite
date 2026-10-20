-- Private archive for the institutional PDFs created from confidential reports and conflict declarations.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('internal-record-pdfs', 'internal-record-pdfs', false, 5242880, array['application/pdf'])
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['application/pdf'];

create table if not exists public.internal_document_records (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('confidential_report', 'conflict_declaration')),
  source_id uuid not null,
  title text not null check (char_length(title) between 3 and 240),
  classification text not null default 'confidencial' check (classification in ('confidencial', 'reservado')),
  storage_path text not null unique,
  created_at timestamptz not null default now(),
  email_sent_at timestamptz,
  email_error text,
  unique (source_type, source_id)
);

create index if not exists internal_document_records_created_at_idx
  on public.internal_document_records (created_at desc);

alter table public.internal_document_records enable row level security;
revoke all on table public.internal_document_records from anon, authenticated;
grant select on table public.internal_document_records to authenticated;
grant all on table public.internal_document_records to service_role;

drop policy if exists "Direction reads internal document records" on public.internal_document_records;
create policy "Direction reads internal document records"
  on public.internal_document_records for select to authenticated
  using ((select public.is_admin()));

-- Permite ao endpoint local, autenticado, arquivar PDFs gerados pelo próprio fluxo.
-- A leitura continua exclusiva da Direção.
drop policy if exists "Authenticated archive institutional PDFs" on storage.objects;
create policy "Authenticated archive institutional PDFs"
on storage.objects for insert to authenticated
with check (bucket_id = 'internal-record-pdfs' and (storage.foldername(name))[1] in ('confidential_report', 'conflict_declaration'));

drop policy if exists "Authenticated create internal document records" on public.internal_document_records;
grant insert on public.internal_document_records to authenticated;
create policy "Authenticated create internal document records"
on public.internal_document_records for insert to authenticated
with check (source_type in ('confidential_report', 'conflict_declaration'));
