-- Biblioteca interna por departamento: acesso limitado à primeira pasta de cada ficheiro.
-- A Direção (admin, coordinator e vice_coordinator) mantém acesso integral.

drop policy if exists "Leaders read workspace files" on storage.objects;
drop policy if exists "Leaders upload workspace files" on storage.objects;
drop policy if exists "Owners manage workspace files" on storage.objects;
drop policy if exists "Owners delete workspace files" on storage.objects;
drop policy if exists "Department members read workspace documents" on storage.objects;
drop policy if exists "Department members upload workspace documents" on storage.objects;
drop policy if exists "Department members update workspace documents" on storage.objects;
drop policy if exists "Direction deletes workspace documents" on storage.objects;

create policy "Department members read workspace documents"
on storage.objects for select to authenticated
using (
  bucket_id = 'workspace-documents'
  and (
    public.current_user_role() in ('admin', 'coordinator', 'vice_coordinator')
    or ((storage.foldername(name))[1] = 'comercial-marketing' and public.current_user_role() in ('commercial_team', 'team_leader_commercial'))
    or ((storage.foldername(name))[1] = 'recursos-humanos' and public.current_user_role() in ('hr_team', 'team_leader_hr'))
    or ((storage.foldername(name))[1] = 'comunicacao' and public.current_user_role() in ('communication_team', 'team_leader_communication'))
    or ((storage.foldername(name))[1] = 'inovacao-projetos' and public.current_user_role() in ('projects_innovation_team', 'team_leader_projects_innovation'))
  )
);

create policy "Department members upload workspace documents"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'workspace-documents'
  and (
    public.current_user_role() in ('admin', 'coordinator', 'vice_coordinator')
    or ((storage.foldername(name))[1] = 'comercial-marketing' and public.current_user_role() in ('commercial_team', 'team_leader_commercial'))
    or ((storage.foldername(name))[1] = 'recursos-humanos' and public.current_user_role() in ('hr_team', 'team_leader_hr'))
    or ((storage.foldername(name))[1] = 'comunicacao' and public.current_user_role() in ('communication_team', 'team_leader_communication'))
    or ((storage.foldername(name))[1] = 'inovacao-projetos' and public.current_user_role() in ('projects_innovation_team', 'team_leader_projects_innovation'))
  )
);

create policy "Department members update workspace documents"
on storage.objects for update to authenticated
using (
  bucket_id = 'workspace-documents'
  and (
    public.current_user_role() in ('admin', 'coordinator', 'vice_coordinator')
    or ((storage.foldername(name))[1] = 'comercial-marketing' and public.current_user_role() in ('commercial_team', 'team_leader_commercial'))
    or ((storage.foldername(name))[1] = 'recursos-humanos' and public.current_user_role() in ('hr_team', 'team_leader_hr'))
    or ((storage.foldername(name))[1] = 'comunicacao' and public.current_user_role() in ('communication_team', 'team_leader_communication'))
    or ((storage.foldername(name))[1] = 'inovacao-projetos' and public.current_user_role() in ('projects_innovation_team', 'team_leader_projects_innovation'))
  )
)
with check (
  bucket_id = 'workspace-documents'
  and (
    public.current_user_role() in ('admin', 'coordinator', 'vice_coordinator')
    or ((storage.foldername(name))[1] = 'comercial-marketing' and public.current_user_role() in ('commercial_team', 'team_leader_commercial'))
    or ((storage.foldername(name))[1] = 'recursos-humanos' and public.current_user_role() in ('hr_team', 'team_leader_hr'))
    or ((storage.foldername(name))[1] = 'comunicacao' and public.current_user_role() in ('communication_team', 'team_leader_communication'))
    or ((storage.foldername(name))[1] = 'inovacao-projetos' and public.current_user_role() in ('projects_innovation_team', 'team_leader_projects_innovation'))
  )
);

create policy "Direction deletes workspace documents"
on storage.objects for delete to authenticated
using (
  bucket_id = 'workspace-documents'
  and public.current_user_role() in ('admin', 'coordinator', 'vice_coordinator')
);
