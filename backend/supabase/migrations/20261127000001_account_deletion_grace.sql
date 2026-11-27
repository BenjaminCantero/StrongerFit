-- Eliminación de cuenta con plazo de gracia de 4 días (RF-16, CU-08, CA-09).
-- Pedir eliminar crea una solicitud 'delete' con scheduled_for = requested_at + 4 días.
-- Dentro del plazo la persona puede cancelar; vencido, process_account_deletions() borra
-- la fila de auth.users (los datos caen en cascada) y deja la solicitud 'done' sin dueño.

alter table public.data_requests add column scheduled_for timestamptz;

-- Las solicitudes de eliminación previas (si las hubiera) heredan el mismo plazo.
update public.data_requests set scheduled_for = requested_at + interval '4 days' where kind = 'delete';

alter table public.data_requests
  add constraint data_requests_scheduled_for_check check ((kind = 'delete') = (scheduled_for is not null)),
  drop constraint data_requests_status_check,
  add constraint data_requests_status_check
    check (status in ('pending', 'processing', 'done', 'failed', 'cancelled'));

-- La fecha programada no la elige el cliente: siempre se calcula al insertar.
create function public.set_data_request_schedule() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.scheduled_for := case when new.kind = 'delete' then new.requested_at + interval '4 days' end;
  return new;
end $$;

create trigger data_requests_schedule before insert on public.data_requests
  for each row execute function public.set_data_request_schedule();

comment on table public.data_requests is
  'Solicitudes de exportación y eliminación (RF-16). Las de eliminación se ejecutan 4 días después (scheduled_for) y se pueden cancelar antes. Al borrar la cuenta la fila queda sin dueño como constancia (CA-09). Solo el servicio o las funciones definidas aquí cambian el estado.';

-- Pide eliminar la cuenta propia. Idempotente: si ya hay una abierta devuelve su fecha.
-- Es security invoker: el insert pasa por la RLS "crear propias" (status pending).
create function public.request_account_deletion() returns timestamptz
language plpgsql security invoker set search_path = '' as $$
declare due timestamptz;
begin
  insert into public.data_requests (kind) values ('delete')
  on conflict (user_id, kind) where status in ('pending', 'processing') do nothing
  returning scheduled_for into due;
  if due is null then
    select scheduled_for into due from public.data_requests
    where kind = 'delete' and status in ('pending', 'processing') and user_id = (select auth.uid());
  end if;
  return due;
end $$;

-- Cancela la solicitud pendiente propia. Devuelve false si no había ninguna.
-- security definer porque authenticated no tiene UPDATE sobre data_requests.
create function public.cancel_account_deletion() returns boolean
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  update public.data_requests set status = 'cancelled', completed_at = now()
  where user_id = (select auth.uid()) and kind = 'delete' and status = 'pending';
  get diagnostics n = row_count;
  return n > 0;
end $$;

-- Ejecuta las eliminaciones vencidas. Solo la llama el cron (rol postgres). Cada fila va en
-- su propio bloque: si un borrado falla queda 'failed' y se siguen procesando las demás.
create function public.process_account_deletions() returns integer
language plpgsql security definer set search_path = '' as $$
declare r record; done_count integer := 0;
begin
  for r in
    select id, user_id from public.data_requests
    where kind = 'delete' and status = 'pending' and scheduled_for <= now() and user_id is not null
    order by scheduled_for for update skip locked
  loop
    begin
      update public.data_requests set status = 'processing' where id = r.id;
      delete from auth.users where id = r.user_id;
      update public.data_requests set status = 'done', completed_at = now() where id = r.id;
      done_count := done_count + 1;
    exception when others then
      update public.data_requests set status = 'failed', completed_at = now() where id = r.id;
    end;
  end loop;
  return done_count;
end $$;

revoke execute on function public.request_account_deletion(), public.cancel_account_deletion(),
  public.process_account_deletions(), public.set_data_request_schedule() from public, anon;
revoke execute on function public.process_account_deletions() from authenticated;
grant execute on function public.request_account_deletion(), public.cancel_account_deletion() to authenticated;

-- Cron cada hora. Si pg_cron no está disponible (p. ej. base local sin la extensión) la
-- migración no falla: en ese caso programar a mano en el proyecto alojado:
--   select cron.schedule('process-account-deletions', '0 * * * *', 'select public.process_account_deletions()');
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('process-account-deletions', '0 * * * *', 'select public.process_account_deletions()');
exception when others then
  raise notice 'pg_cron no disponible (%): programar process_account_deletions() manualmente', sqlerrm;
end $$;
