-- Pedidos de comunicação — executar DEPOIS de supabase-communication-requests-setup.sql.

do $$
begin
  if to_regclass('public.communication_requests') is null then
    raise exception 'Falta criar public.communication_requests. Execute primeiro supabase-communication-requests-setup.sql por inteiro.';
  end if;
end;
$$;

create extension if not exists pg_cron with schema pg_catalog;

select cron.unschedule(jobid)
from cron.job
where jobname = 'complete-due-communication-requests';

select cron.schedule(
  'complete-due-communication-requests',
  '*/5 * * * *',
  $$select public.finish_due_communication_requests()$$
);

-- Deve devolver uma linha com o job e o horário */5 * * * *.
select jobname, schedule, command, active
from cron.job
where jobname = 'complete-due-communication-requests';
