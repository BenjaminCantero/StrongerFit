-- Base común: auditoría de cambios, updated_at y permisos por defecto.
-- Convenciones del esquema: docs/superpowers/specs/2026-11-24-database-rls-design.md

-- Las tablas nuevas no se exponen a anon. Cada tabla concede a authenticated solo lo
-- que sus políticas permiten.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated, public;

-- Historial de cambios de las tablas editables (RF-03, BR-05). Solo escribe audit_row().
create table public.audit_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  table_name text not null,
  row_id text not null,
  action text not null check (action in ('UPDATE', 'DELETE')),
  old_row jsonb not null,
  new_row jsonb,
  at timestamptz not null default now()
);
create index audit_events_user_idx on public.audit_events (user_id, at desc);
alter table public.audit_events enable row level security;
grant select on public.audit_events to authenticated;
create policy "audit_events: leer propios" on public.audit_events
  for select to authenticated using ((select auth.uid()) = user_id);

-- Trigger AFTER UPDATE OR DELETE. Durante el borrado en cascada de una cuenta el usuario
-- ya no existe: no se audita, porque sus eventos también se eliminan.
create function public.audit_row() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  owner uuid := (to_jsonb(old) ->> 'user_id')::uuid;
begin
  if not exists (select 1 from auth.users where id = owner) then
    return null;
  end if;
  insert into public.audit_events (user_id, table_name, row_id, action, old_row, new_row)
  values (
    owner, tg_table_name,
    coalesce(to_jsonb(old) ->> 'id', owner::text),
    tg_op, to_jsonb(old),
    case when tg_op = 'UPDATE' then to_jsonb(new) end
  );
  return null;
end $$;

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;
