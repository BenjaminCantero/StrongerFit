-- DB-02: entrenamiento. Acceso cruzado, jerarquía plan → día → ejercicio, sesión
-- histórica (BR-05), envío idempotente (CA-03, BR-13) y sugerencias de carga.
begin;
select * from no_plan();

select set_config('t.a', tests.create_user('a@test.dev')::text, true);
select set_config('t.b', tests.create_user('b@test.dev')::text, true);
select set_config('t.plan', gen_random_uuid()::text, true);
select set_config('t.day', gen_random_uuid()::text, true);
select set_config('t.client', gen_random_uuid()::text, true);

select tests.as_user(current_setting('t.b')::uuid);
insert into public.consents (kind, policy_version, action) values ('health-data', 'v0.1', 'granted');

select tests.as_user(current_setting('t.a')::uuid);
select throws_ok(
  format($$ insert into public.workout_plans (id, rule_version, template_id, template_version, catalog_version, environment, level, days_per_week, session_minutes, equipment, zones)
            values (%L, 'entrenamiento-0.2', 'small-gym-beginner-3', 'plantillas-0.1', 'catalogo-0.2', 'small-gym', 'beginner', 3, 45, array['bodyweight'], '{}') $$, current_setting('t.plan')),
  '42501', null, 'Sin consentimiento no se guarda el plan'
);
insert into public.consents (kind, policy_version, action) values ('health-data', 'v0.1', 'granted');

-- Plan generado con sus versiones (RF-19, BR-11).
select lives_ok(
  format($$ insert into public.workout_plans (id, rule_version, template_id, template_version, catalog_version, environment, level, days_per_week, session_minutes, equipment, zones, changes, warnings)
            values (%L, 'entrenamiento-0.2', 'small-gym-beginner-3', 'plantillas-0.1', 'catalogo-0.2', 'small-gym', 'beginner', 3, 45, array['bodyweight', 'dumbbells'], array['knee'], '[]', '{}') $$, current_setting('t.plan')),
  'A guarda su plan'
);
select lives_ok(format($$ insert into public.workout_days (id, plan_id, position, weekday, name) values (%L, %L, 0, 1, 'Día A') $$, current_setting('t.day'), current_setting('t.plan')), 'A guarda un día');
select lives_ok(format($$ insert into public.workout_exercises (day_id, position, exercise_id, sets, reps_min, reps_max, rest_seconds, tempo) values (%L, 0, 'goblet-squat', 3, 8, 12, 90, array[3, 1, 1]) $$, current_setting('t.day')), 'A guarda un ejercicio');
select throws_ok(format($$ insert into public.workout_exercises (day_id, position, exercise_id, sets, reps_min, reps_max, rest_seconds) values (%L, 1, 'row', 3, 12, 8, 90) $$, current_setting('t.day')), '23514', null, 'reps_min no supera reps_max');
select throws_ok(format($$ insert into public.workout_exercises (day_id, position, exercise_id, sets, reps_min, reps_max, rest_seconds, tempo) values (%L, 1, 'row', 3, 8, 12, 90, array[3, 1]) $$, current_setting('t.day')), '23514', null, 'tempo tiene 3 valores');
select throws_ok(
  $$ insert into public.workout_plans (rule_version, template_id, template_version, catalog_version, environment, level, days_per_week, session_minutes, equipment, zones)
     values ('entrenamiento-0.2', 'x', 'plantillas-0.1', 'catalogo-0.2', 'none', 'beginner', 3, 45, array['bodyweight'], '{}') $$,
  '23505', null, 'Un solo plan activo'
);
select throws_ok($$ update public.workout_plans set rule_version = 'otra' $$, '42501', null, 'El plan es inmutable salvo su estado');

-- Edición de rutina auditada (RF-06).
select is(tests.affected($$ update public.workout_exercises set sets = 4 $$), 1, 'A edita un ejercicio');
select is((select count(*)::int from public.audit_events where table_name = 'workout_exercises'), 1, 'La edición queda auditada');

-- Envío único de la sesión (CA-03).
select set_config('t.payload', jsonb_build_object(
  'client_id', current_setting('t.client'), 'plan_id', current_setting('t.plan'), 'day_id', current_setting('t.day'),
  'title', 'Día A', 'started_at', '2026-11-24T10:00:00Z', 'finished_at', '2026-11-24T10:50:00Z',
  'sets', jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid(), 'exercise_id', 'goblet-squat', 'exercise_position', 0, 'set_number', 1, 'weight_kg', 20, 'reps', 10, 'completed', true, 'kind', 'calibration', 'reserve', 2),
    jsonb_build_object('id', gen_random_uuid(), 'exercise_id', 'goblet-squat', 'exercise_position', 0, 'set_number', 2, 'weight_kg', 22, 'reps', 10, 'completed', true, 'estimated', true),
    jsonb_build_object('id', gen_random_uuid(), 'exercise_id', 'plank', 'exercise_position', 1, 'set_number', 1, 'duration_seconds', 30, 'completed', true)
  ))::text, true);
select set_config('t.session', public.submit_session(current_setting('t.payload')::jsonb)::text, true);
select is(public.submit_session(current_setting('t.payload')::jsonb)::text, current_setting('t.session'), 'El reintento devuelve la misma sesión');
select is((select count(*)::int from public.workout_sessions), 1, 'Una sola sesión tras reintentar');
select is((select count(*)::int from public.performed_sets), 3, 'Las series no se duplican');
select is((select kind from public.performed_sets where set_number = 2 and exercise_position = 0), 'work', 'El tipo de serie por defecto es work');

-- Sesión histórica: se corrige con auditoría, no se borra (BR-05).
select is(tests.affected($$ update public.performed_sets set reps = 9 where set_number = 2 and exercise_position = 0 $$), 1, 'A corrige una serie');
select is((select count(*)::int from public.audit_events where table_name = 'performed_sets'), 1, 'La corrección queda auditada');
select throws_ok($$ delete from public.workout_sessions $$, '42501', null, 'La sesión no se borra');
select throws_ok($$ delete from public.performed_sets $$, '42501', null, 'Las series no se borran');
select throws_ok(format($$ insert into public.performed_sets (session_id, exercise_id, exercise_position, set_number, completed) values (%L, 'x', 2, 1, true) $$, current_setting('t.session')), '23514', null, 'Una serie registra repeticiones o duración');

-- Sugerencias de carga (RF-32, RF-33, BR-24) y temporizadores (RF-25).
select lives_ok($$ insert into public.load_suggestions (exercise_id, kind, suggested_kg, rule_version) values ('goblet-squat', 'overload', 24, 'cargas-0.1') $$, 'A guarda una sugerencia');
select throws_ok($$ update public.load_suggestions set decision = 'applied' $$, '23514', null, 'Aplicar exige la carga aplicada');
select is(tests.affected($$ update public.load_suggestions set decision = 'applied', applied_kg = 24, decided_at = now() $$), 1, 'A aplica la sugerencia');
select lives_ok($$ insert into public.timer_presets (exercise_id, kind, rest_seconds, hold_seconds) values ('plank', 'hold', 60, 30) $$, 'A guarda un temporizador');
select throws_ok($$ insert into public.timer_presets (exercise_id, kind, rest_seconds) values ('burpee', 'interval', 60) $$, '23514', null, 'Un intervalo exige trabajo, descanso y rondas');
select lives_ok(format($$ insert into public.recommendation_runs (kind, rule_version, params, result_id) values ('workout-plan', 'entrenamiento-0.2', '{"days": 3}', %L) $$, current_setting('t.plan')), 'A registra la ejecución (RNF-08)');
select throws_ok($$ update public.recommendation_runs set rule_version = 'x' $$, '42501', null, 'recommendation_runs es append-only');

-- B no ve ni altera nada de A.
select tests.as_user(current_setting('t.b')::uuid);
select is((select count(*)::int from public.workout_plans), 0, 'B no ve planes de A');
select is((select count(*)::int from public.workout_days), 0, 'B no ve días de A');
select is((select count(*)::int from public.workout_exercises), 0, 'B no ve ejercicios de A');
select is((select count(*)::int from public.workout_sessions), 0, 'B no ve sesiones de A');
select is((select count(*)::int from public.performed_sets), 0, 'B no ve series de A');
select is((select count(*)::int from public.load_suggestions), 0, 'B no ve sugerencias de A');
select is((select count(*)::int from public.timer_presets), 0, 'B no ve temporizadores de A');
select is((select count(*)::int from public.recommendation_runs), 0, 'B no ve ejecuciones de A');
select is(tests.affected($$ update public.workout_plans set status = 'archived' $$), 0, 'B no archiva el plan de A');
select is(tests.affected($$ update public.workout_exercises set sets = 1 $$), 0, 'B no edita ejercicios de A');
select is(tests.affected($$ delete from public.workout_exercises $$), 0, 'B no borra ejercicios de A');
select is(tests.affected($$ update public.performed_sets set reps = 1 $$), 0, 'B no edita series de A');
select is(tests.affected($$ update public.load_suggestions set decision = 'ignored' $$), 0, 'B no decide sugerencias de A');
select is(tests.affected($$ delete from public.timer_presets $$), 0, 'B no borra temporizadores de A');
select throws_ok(
  format($$ insert into public.workout_days (plan_id, position, weekday, name) values (%L, 5, 2, 'Intruso') $$, current_setting('t.plan')),
  '23503', null, 'B no cuelga un día del plan de A'
);
select throws_ok(
  format($$ insert into public.performed_sets (session_id, exercise_id, exercise_position, set_number, reps, completed) values (%L, 'x', 0, 9, 5, true) $$, current_setting('t.session')),
  '23503', null, 'B no agrega series a la sesión de A'
);
select throws_ok(
  $$ select public.submit_session(jsonb_set(current_setting('t.payload')::jsonb, '{sets}', '[]')) $$,
  '23503', null, 'B no registra una sesión sobre el plan de A'
);
select isnt(
  public.submit_session(current_setting('t.payload')::jsonb - 'plan_id' - 'day_id' - 'sets')::text, current_setting('t.session'),
  'El mismo client_id de otra persona crea una sesión aparte'
);

select * from finish();
rollback;
