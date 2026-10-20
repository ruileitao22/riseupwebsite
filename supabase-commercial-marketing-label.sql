-- Atualiza as designações antigas sem tocar nos identificadores de acesso.
update public.team_members
set role = case role
  when 'Comercial' then 'Comercial e Marketing'
  when 'Team Líder — Comercial' then 'Team Líder — Comercial e Marketing'
  else role
end
where role in ('Comercial', 'Team Líder — Comercial');
