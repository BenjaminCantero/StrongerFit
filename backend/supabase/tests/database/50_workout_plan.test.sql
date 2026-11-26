-- save_workout_plan: guarda el plan completo en una transacción y archiva el anterior
-- (RF-05, RF-19, RNF-08, decisión 4 de la spec de persistencia).
begin;
select * from no_plan();

select set_config('t.a', tests.create_user('a@test.dev')::text, true);
select set_config('t.b', tests.create_user('b@test.dev')::text, true);
select set_config('t.payload', $json${
  "rule_version": "entrenamiento-0.2", "template_id": "small-gym-beginner-3", "template_version": "plantillas-0.1",
  "catalog_version": "catalogo-0.2", "environment": "small-gym", "level": "beginner", "days_per_week": 2, "session_minutes": 45,
  "equipment": ["bodyweight", "dumbbells"], "zones": ["knee"],
  "changes": [{"day": 0, "exerciseId": "back-squat", "action": "substituted", "reason": "equipment", "replacementId": "goblet-squat"}],
  "warnings": ["injury-review"],
  "days": [
    {"position": 0, "weekday": 1, "name": "Día A", "exercises": [
      {"position": 0, "exercise_id": "goblet-squat", "sets": 3, "reps_min": 8, "reps_max": 12, "rest_seconds": 90, "tempo": [3, 1, 1], "note": null},
      {"position": 1, "exercise_id": "push-up", "sets": 3, "reps_min": 6, "reps_max": 10, "rest_seconds": 60, "tempo": null, "note": "Rodillas apoyadas"}
    ]},
    {"position": 1, "weekday": 4, "name": "Día B", "exercises": [
      {"position": 0, "exercise_id": "db-row", "sets": 3, "reps_min": 8, "reps_max": 12, "rest_seconds": 90, "tempo": null, "note": null}
    ]}
  ]
}$json$, true);

select tests.as_user(current_setting('t.a')::uuid);
select throws_ok(
  format('select public.save_workout_plan(%L::jsonb)', current_setting('t.payload')),
  '42501', null, 'Sin consentimiento no se guarda el plan'
);
insert into public.consents (kind, policy_version, action) values ('health-data', 'v0.1', 'granted');

select set_config('t.first', public.save_workout_plan(current_setting('t.payload')::jsonb)::text, true);
select is((select count(*)::int from public.workout_plans where status = 'active'), 1, 'Queda un plan activo');
select is((select count(*)::int from public.workout_days), 2, 'Se guardan los dos días');
select is((select count(*)::int from public.workout_exercises), 3, 'Se guardan los tres ejercicios');
select is((select tempo from public.workout_exercises where exercise_id = 'goblet-squat'), array[3, 1, 1]::smallint[], 'Guarda el tempo');
select is((select tempo from public.workout_exercises where exercise_id = 'push-up'), null::smallint[], 'Tempo nulo queda nulo');
select is((select note from public.workout_exercises where exercise_id = 'push-up'), 'Rodillas apoyadas', 'Guarda la nota');
select is((select zones from public.workout_plans), array['knee'], 'Guarda las zonas');
select is((select jsonb_array_length(changes) from public.workout_plans), 1, 'Guarda los cambios');
select is(
  (select result_id from public.recommendation_runs where kind = 'workout-plan'),
  current_setting('t.first')::uuid, 'Deja la traza de la recomendación (RNF-08)'
);

select lives_ok(format('select public.save_workout_plan(%L::jsonb)', current_setting('t.payload')), 'Un plan nuevo reemplaza al activo');
select is((select status from public.workout_plans where id = current_setting('t.first')::uuid), 'archived', 'El anterior queda archivado');
select is((select count(*)::int from public.workout_plans where status = 'active'), 1, 'Sigue habiendo un solo plan activo');

select throws_ok(
  format('select public.save_workout_plan(%L::jsonb)', jsonb_set(current_setting('t.payload')::jsonb, '{days,0,exercises,0,reps_min}', '20')),
  '23514', null, 'Un ejercicio inválido aborta todo'
);
select is((select count(*)::int from public.workout_plans), 2, 'El intento fallido no deja plan suelto');

select tests.as_user(current_setting('t.b')::uuid);
select is((select count(*)::int from public.workout_plans), 0, 'B no ve los planes de A');

select tests.as_anon();
select throws_ok(
  format('select public.save_workout_plan(%L::jsonb)', current_setting('t.payload')),
  '42501', null, 'anon no puede guardar planes'
);

select * from finish();
rollback;
