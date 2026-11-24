-- DB-01: identidad. Acceso cruzado (A≠B), consentimiento (CA-11), append-only,
-- auditoría y borrado en cascada.
begin;
select * from no_plan();

select set_config('t.a', tests.create_user('a@test.dev')::text, true);
select set_config('t.b', tests.create_user('b@test.dev')::text, true);

-- Sin consentimiento no se guardan datos de salud.
select tests.as_user(current_setting('t.a')::uuid);
select throws_ok(
  $$ insert into public.profiles (display_name, sex, age_years, height_cm, activity) values ('Ana', 'female', 30, 165, 'moderate') $$,
  '42501', null, 'Sin consentimiento no se crea el perfil'
);

select lives_ok(
  $$ insert into public.consents (kind, policy_version, action) values ('health-data', 'consentimiento-salud-v0.1', 'granted') $$,
  'A otorga consentimiento'
);
select ok(public.has_health_consent(), 'has_health_consent() es verdadero tras otorgarlo');

select lives_ok($$ insert into public.profiles (display_name, sex, age_years, height_cm, activity) values ('Ana', 'female', 30, 165, 'moderate') $$, 'A crea su perfil');
select lives_ok($$ insert into public.user_goals (goal, level, environment, equipment, days_per_week, session_minutes) values ('strength', 'beginner', 'small-gym', array['bodyweight', 'dumbbells'], 3, 45) $$, 'A crea su meta');
select lives_ok($$ insert into public.user_preferences (meals_per_day, exclusions) values (4, array['mani']) $$, 'A crea sus preferencias');
select lives_ok($$ insert into public.user_injuries (zone) values ('knee') $$, 'A declara lesión de rodilla');
select lives_ok($$ insert into public.health_screenings (questionnaire_version, flags, disclaimer_accepted_at) values ('aptitud-v0.1', array['pregnancy'], now()) $$, 'A responde el cuestionario');

select is((select has_risk from public.current_health_screening), true, 'Embarazo marca riesgo (BR-19)');
select is((select goal from public.current_user_goals), 'strength', 'La vista entrega la meta vigente');

-- Restricciones de dominio.
select throws_ok($$ insert into public.user_injuries (zone) values ('knee') $$, '23505', null, 'Una sola lesión activa por zona');
select throws_ok($$ insert into public.user_injuries (zone) values ('neck') $$, '23514', null, 'Zona fuera de la lista');
select throws_ok($$ insert into public.user_goals (goal, level, environment, equipment, days_per_week, session_minutes) values ('strength', 'beginner', 'none', array['bodyweight'], 8, 45) $$, '23514', null, 'Días fuera de rango');
select throws_ok($$ insert into public.user_goals (goal, level, environment, equipment, days_per_week, session_minutes) values ('strength', 'beginner', 'none', array['kettlebell'], 3, 45) $$, '23514', null, 'Equipo fuera de la lista');
select throws_ok($$ update public.profiles set age_years = 17 $$, '23514', null, 'Menores de 18 fuera del alcance (RNF-18)');

-- Append-only.
select throws_ok($$ update public.user_goals set days_per_week = 4 $$, '42501', null, 'user_goals no admite UPDATE');
select throws_ok($$ delete from public.consents $$, '42501', null, 'consents no admite DELETE');
select throws_ok($$ update public.health_screenings set flags = '{}' $$, '42501', null, 'health_screenings no admite UPDATE');

-- Auditoría de tablas editables.
select is(tests.affected($$ update public.profiles set height_cm = 166 $$), 1, 'A edita su perfil');
select is((select count(*)::int from public.audit_events where table_name = 'profiles'), 1, 'La edición queda en audit_events');
select throws_ok($$ insert into public.audit_events (user_id, table_name, row_id, action, old_row) values (auth.uid(), 'x', 'x', 'UPDATE', '{}') $$, '42501', null, 'audit_events no se escribe desde la app');

-- B no ve ni altera nada de A.
select tests.as_user(current_setting('t.b')::uuid);
select is((select count(*)::int from public.profiles), 0, 'B no ve el perfil de A');
select is((select count(*)::int from public.user_goals), 0, 'B no ve metas de A');
select is((select count(*)::int from public.user_preferences), 0, 'B no ve preferencias de A');
select is((select count(*)::int from public.user_injuries), 0, 'B no ve lesiones de A');
select is((select count(*)::int from public.health_screenings), 0, 'B no ve cuestionarios de A');
select is((select count(*)::int from public.consents), 0, 'B no ve consentimientos de A');
select is((select count(*)::int from public.audit_events), 0, 'B no ve auditoría de A');
select is(tests.affected($$ update public.profiles set display_name = 'x' $$), 0, 'B no edita el perfil de A');
select is(tests.affected($$ update public.user_preferences set meals_per_day = 3 $$), 0, 'B no edita preferencias de A');
select is(tests.affected($$ update public.user_injuries set resolved_at = now() $$), 0, 'B no edita lesiones de A');
select throws_ok(
  format($$ insert into public.consents (user_id, kind, policy_version, action) values (%L, 'health-data', 'v', 'withdrawn') $$, current_setting('t.a')),
  '42501', null, 'B no inserta a nombre de A'
);

-- Retirar el consentimiento detiene nuevos tratamientos (CA-11).
select tests.as_user(current_setting('t.a')::uuid);
select lives_ok($$ insert into public.consents (kind, policy_version, action) values ('health-data', 'consentimiento-salud-v0.1', 'withdrawn') $$, 'A retira el consentimiento');
select ok(not public.has_health_consent(), 'has_health_consent() es falso tras retirarlo');
select throws_ok($$ insert into public.user_goals (goal, level, environment, equipment, days_per_week, session_minutes) values ('health', 'beginner', 'none', array['bodyweight'], 3, 30) $$, '42501', null, 'Sin consentimiento no se crean metas');
select throws_ok($$ update public.profiles set height_cm = 167 $$, '42501', null, 'Sin consentimiento no se edita el perfil');
select is((select count(*)::int from public.profiles), 1, 'Los datos previos siguen visibles para su dueña');

-- Borrar la cuenta elimina sus datos.
select tests.as_postgres();
delete from auth.users where id = current_setting('t.a')::uuid;
select is((select count(*)::int from public.profiles where user_id = current_setting('t.a')::uuid), 0, 'Cascada: perfil eliminado');
select is((select count(*)::int from public.consents where user_id = current_setting('t.a')::uuid), 0, 'Cascada: consentimientos eliminados');
select is((select count(*)::int from public.audit_events where user_id = current_setting('t.a')::uuid), 0, 'Cascada: auditoría eliminada');

select * from finish();
rollback;
