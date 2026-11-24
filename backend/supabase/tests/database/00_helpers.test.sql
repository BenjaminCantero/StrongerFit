-- Helpers compartidos por todas las pruebas. Este archivo corre primero (orden
-- alfabético) y hace COMMIT para que las funciones queden disponibles en los demás.
-- Solo existe en la base local o de CI: no es una migración.
begin;
create extension if not exists pgtap with schema extensions;

create schema if not exists tests;
grant usage on schema tests to anon, authenticated, service_role;

-- Crea una persona en auth.users y devuelve su id.
create or replace function tests.create_user(email text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare uid uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values (uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', email, '{}', '{}', now(), now());
  return uid;
end $$;

-- Actúa como la persona indicada, igual que una solicitud con su JWT.
create or replace function tests.as_user(uid uuid) returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;

create or replace function tests.as_anon() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  execute 'set local role anon';
end $$;

create or replace function tests.as_service() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
  execute 'set local role service_role';
end $$;

create or replace function tests.as_postgres() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
end $$;

-- Ejecuta una sentencia con el rol actual y devuelve cuántas filas afectó.
-- RLS no lanza error en UPDATE/DELETE ajenos: simplemente no ve las filas.
create or replace function tests.affected(statement text) returns integer language plpgsql as $$
declare n integer;
begin
  execute statement;
  get diagnostics n = row_count;
  return n;
end $$;

grant execute on all functions in schema tests to anon, authenticated, service_role;

select plan(1);
select has_schema('tests');
select * from finish();
commit;
