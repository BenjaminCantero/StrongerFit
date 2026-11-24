-- Guarda global de RNF-04: toda tabla de public tiene RLS, figura en el manifiesto
-- de tablas con pruebas de acceso cruzado y es inaccesible para el rol anon.
-- Al agregar una tabla: escribir su prueba A≠B y sumarla a este manifiesto.
begin;
select * from no_plan();

create temp table manifest (name text primary key) on commit drop;
insert into manifest values
  ('audit_events'),
  ('profiles'), ('user_goals'), ('user_preferences'), ('user_injuries'), ('health_screenings'), ('consents'),
  ('workout_plans'), ('workout_days'), ('workout_exercises'), ('workout_sessions'), ('performed_sets'),
  ('load_suggestions'), ('timer_presets'), ('recommendation_runs'),
  ('nutrition_targets'), ('food_logs'), ('meal_plans'), ('planned_meals'), ('body_measurements'),
  ('weight_goals'), ('data_requests');
grant select on manifest to anon;

select set_eq(
  $$ select tablename::text from pg_tables where schemaname = 'public' $$,
  $$ select name from manifest $$,
  'Las tablas de public coinciden con el manifiesto probado'
);

select is_empty(
  $$ select tablename from pg_tables where schemaname = 'public' and not rowsecurity $$,
  'Todas las tablas de public tienen RLS'
);

-- Sin permisos para anon: cualquier lectura falla con 42501.
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    perform tests.as_anon();
    begin
      execute format('select 1 from public.%I limit 1', t);
      raise exception 'anon pudo leer %', t;
    exception when insufficient_privilege then null;
    end;
  end loop;
  perform tests.as_postgres();
end $$;
select pass('anon no puede leer ninguna tabla de public');

select is_empty(
  $$ select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute') $$,
  'anon no puede ejecutar funciones de public'
);

select * from finish();
rollback;
