-- Direção pode ler, mover e eliminar fichas institucionais através do BackOffice.
-- As restantes pessoas continuam sem acesso ao arquivo reservado.

grant delete on table public.internal_document_records to authenticated;

drop policy if exists "Direction deletes internal document records" on public.internal_document_records;
create policy "Direction deletes internal document records"
  on public.internal_document_records for delete to authenticated
  using ((select public.is_admin()));

drop policy if exists "Direction reads institutional PDFs" on storage.objects;
create policy "Direction reads institutional PDFs"
  on storage.objects for select to authenticated
  using (bucket_id = 'internal-record-pdfs' and (select public.is_admin()));

drop policy if exists "Direction deletes institutional PDFs" on storage.objects;
create policy "Direction deletes institutional PDFs"
  on storage.objects for delete to authenticated
  using (bucket_id = 'internal-record-pdfs' and (select public.is_admin()));
