-- DB-03: nutrición y progreso. Acceso cruzado, BR-16, BR-17, BR-19, BR-20, BR-07 y
-- solicitudes de exportación y eliminación (CA-09).
begin;
select * from no_plan();

select set_config('t.a', tests.create_user('a@test.dev')::text, true);
select set_config('t.b', tests.create_user('b@test.dev')::text, true);
select set_config('t.target', gen_random_uuid()::text, true);
select set_config('t.meal_plan', gen_random_uuid()::text, true);

select tests.as_user(current_setting('t.b')::uuid);
insert into public.consents (kind, policy_version, action) values ('health-data', 'v0.1', 'granted');

select tests.as_user(current_setting('t.a')::uuid);
insert into public.consents (kind, policy_version, action) values ('health-data', 'v0.1', 'granted');
insert into public.health_screenings (questionnaire_version, flags, disclaimer_accepted_at) values ('aptitud-v0.1', '{}', now());

-- Metas nutricionales con snapshot de entradas (RF-09, RNF-07).
select lives_ok(
  format($$ insert into public.nutrition_targets (id, sex, age_years, height_cm, weight_kg, activity, direction, adjustment, protein_per_kg, fat_share,
              bmr_kcal, tdee_kcal, target_kcal, protein_g, carbs_g, fat_g, warnings, formula, rule_version)
            values (%L, 'female', 30, 165, 70, 'moderate', 'deficit', 0.15, 1.6, 0.25, 1420, 2200, 1870, 112, 222, 52, '{}', 'mifflin-st-jeor', 'nutricion-0.1') $$,
    current_setting('t.target')),
  'A guarda su meta'
);
select throws_ok(
  $$ insert into public.nutrition_targets (sex, age_years, height_cm, weight_kg, activity, direction, adjustment, protein_per_kg, fat_share,
       bmr_kcal, tdee_kcal, target_kcal, protein_g, carbs_g, fat_g, formula, rule_version)
     values ('female', 30, 165, 70, 'moderate', 'deficit', 0.25, 1.6, 0.25, 1420, 2200, 1650, 112, 180, 46, 'mifflin-st-jeor', 'nutricion-0.1') $$,
  '23514', null, 'Déficit sobre 20 % rechazado (BR-17)'
);
select throws_ok(
  $$ insert into public.nutrition_targets (sex, age_years, height_cm, weight_kg, activity, direction, adjustment, protein_per_kg, fat_share,
       bmr_kcal, tdee_kcal, target_kcal, protein_g, carbs_g, fat_g, formula, rule_version)
     values ('unspecified', 30, 165, 70, 'sedentary', 'deficit', 0.2, 1.6, 0.25, 1300, 1600, 1280, 112, 150, 36, 'mifflin-st-jeor', 'nutricion-0.1') $$,
  '23514', null, 'Meta bajo el piso de seguridad rechazada (BR-16)'
);
select throws_ok($$ update public.nutrition_targets set target_kcal = 1900 $$, '42501', null, 'nutrition_targets es append-only');

-- Con riesgo declarado no hay metas de déficit (BR-19).
insert into public.health_screenings (questionnaire_version, flags, disclaimer_accepted_at) values ('aptitud-v0.1', array['eating-disorder'], now());
select throws_ok(
  $$ insert into public.nutrition_targets (sex, age_years, height_cm, weight_kg, activity, direction, adjustment, protein_per_kg, fat_share,
       bmr_kcal, tdee_kcal, target_kcal, protein_g, carbs_g, fat_g, formula, rule_version)
     values ('female', 30, 165, 70, 'moderate', 'deficit', 0.1, 1.6, 0.25, 1420, 2200, 1980, 112, 250, 55, 'mifflin-st-jeor', 'nutricion-0.1') $$,
  '42501', null, 'Riesgo declarado bloquea el déficit (BR-19)'
);
select lives_ok(
  $$ insert into public.nutrition_targets (sex, age_years, height_cm, weight_kg, activity, direction, adjustment, protein_per_kg, fat_share,
       bmr_kcal, tdee_kcal, target_kcal, protein_g, carbs_g, fat_g, warnings, formula, rule_version)
     values ('female', 30, 165, 70, 'moderate', 'maintenance', 0, 1.6, 0.25, 1420, 2200, 2200, 112, 300, 61, array['risk-no-deficit'], 'mifflin-st-jeor', 'nutricion-0.1') $$,
  'Con riesgo, mantenimiento sí se guarda'
);

-- Registro alimentario con snapshot y procedencia (RF-11, BR-07).
select lives_ok(
  $$ insert into public.food_logs (entry_id, logged_on, meal, food_id, food_name, grams, kcal, protein_g, carbs_g, fat_g, source, source_version, license, catalog_version)
     values (gen_random_uuid(), '2026-11-24', 'lunch', 'usda-171077', 'Pechuga de pollo', 150, 248, 46.5, 0, 5.4, 'USDA FoodData Central', 'SR Legacy 2018', 'CC0-1.0', 'alimentos-0.3') $$,
  'A registra un alimento'
);
select throws_ok(
  $$ insert into public.food_logs (entry_id, logged_on, meal, food_id, food_name, grams, kcal, protein_g, carbs_g, fat_g, source, source_version, license, catalog_version)
     values (gen_random_uuid(), '2026-11-24', 'lunch', 'x', 'X', 150, 100, 1, 1, 1, '', 'v', 'CC0-1.0', 'alimentos-0.3') $$,
  '23514', null, 'Sin procedencia no se registra (BR-07)'
);
select is(tests.affected($$ update public.food_logs set grams = 200, kcal = 330 $$), 1, 'A edita su registro');
select is(tests.affected($$ delete from public.food_logs $$), 1, 'A borra su registro');
select is((select count(*)::int from public.audit_events where table_name = 'food_logs'), 2, 'Edición y borrado quedan auditados');
insert into public.food_logs (entry_id, logged_on, meal, food_id, food_name, grams, kcal, protein_g, carbs_g, fat_g, source, source_version, license, catalog_version)
  values (gen_random_uuid(), '2026-11-24', 'dinner', 'usda-1', 'Arroz', 100, 130, 2.7, 28, 0.3, 'USDA FoodData Central', 'SR Legacy 2018', 'CC0-1.0', 'alimentos-0.3');

-- Minuta semanal e intercambios (RF-12, RF-13).
select lives_ok(
  format($$ insert into public.meal_plans (id, rule_version, catalog_version, nutrition_target_id, week_start, meals_per_day, params)
            values (%L, 'minuta-0.3', 'alimentos-0.3', %L, '2026-11-23', 4, '{}') $$, current_setting('t.meal_plan'), current_setting('t.target')),
  'A guarda su minuta'
);
select lives_ok(
  format($$ insert into public.planned_meals (plan_id, day, slot, day_type, target_kcal, target_protein_g, items)
            values (%L, 0, 'lunch', 'training', 650, 40, '[{"foodId": "usda-171077", "grams": 150}]') $$, current_setting('t.meal_plan')),
  'A guarda una comida planificada'
);
select throws_ok(
  format($$ insert into public.planned_meals (plan_id, day, slot, target_kcal, target_protein_g, items) values (%L, 0, 'brunch', 650, 40, '[]') $$, current_setting('t.meal_plan')),
  '23514', null, 'Franja fuera de la lista'
);
select is(tests.affected($$ update public.planned_meals set items = '[{"foodId": "usda-1", "grams": 200}]' $$), 1, 'A intercambia un alimento');
select is((select count(*)::int from public.audit_events where table_name = 'planned_meals'), 1, 'El intercambio queda auditado');
select throws_ok($$ update public.meal_plans set rule_version = 'x' $$, '42501', null, 'La minuta es inmutable salvo su estado');

-- Pesajes y objetivo de peso (RF-15, RF-29, BR-20).
select lives_ok($$ insert into public.body_measurements (measured_on, weight_kg) values ('2026-11-24', 70.4) $$, 'A registra un pesaje');
select throws_ok($$ insert into public.body_measurements (measured_on, weight_kg) values ('2026-11-24', 70.1) $$, '23505', null, 'Un pesaje por día');
select throws_ok($$ insert into public.body_measurements (measured_on) values ('2026-11-25') $$, '23514', null, 'Una medición tiene al menos un valor');
select throws_ok(
  $$ insert into public.weight_goals (start_kg, target_kg, start_date, end_date) values (80, 70, '2026-11-24', '2027-01-19') $$,
  '23514', null, 'Ritmo sobre 1 % semanal sin confirmar rechazado (BR-20)'
);
select lives_ok(
  $$ insert into public.weight_goals (start_kg, target_kg, start_date, end_date, pace_confirmed) values (80, 70, '2026-11-24', '2027-01-19', true) $$,
  'Con confirmación se guarda'
);
select throws_ok(
  $$ insert into public.weight_goals (start_kg, target_kg, start_date, end_date) values (80, 78, '2026-11-24', '2027-03-01') $$,
  '23505', null, 'Un solo objetivo activo'
);

-- Solicitudes de exportación y eliminación (RF-16).
select lives_ok($$ insert into public.data_requests (kind) values ('export') $$, 'A pide exportar sus datos');
select throws_ok($$ insert into public.data_requests (kind) values ('export') $$, '23505', null, 'Una solicitud abierta por tipo');
select throws_ok($$ update public.data_requests set status = 'done' $$, '42501', null, 'A no cambia el estado de su solicitud');
select throws_ok($$ insert into public.data_requests (kind, status) values ('delete', 'done') $$, '42501', null, 'Una solicitud nace pendiente');

-- B no ve ni altera nada de A.
select tests.as_user(current_setting('t.b')::uuid);
select is((select count(*)::int from public.nutrition_targets), 0, 'B no ve metas de A');
select is((select count(*)::int from public.food_logs), 0, 'B no ve registros de A');
select is((select count(*)::int from public.meal_plans), 0, 'B no ve minutas de A');
select is((select count(*)::int from public.planned_meals), 0, 'B no ve comidas de A');
select is((select count(*)::int from public.body_measurements), 0, 'B no ve pesajes de A');
select is((select count(*)::int from public.weight_goals), 0, 'B no ve objetivos de A');
select is((select count(*)::int from public.data_requests), 0, 'B no ve solicitudes de A');
select is(tests.affected($$ update public.food_logs set grams = 1 $$), 0, 'B no edita registros de A');
select is(tests.affected($$ delete from public.food_logs $$), 0, 'B no borra registros de A');
select is(tests.affected($$ update public.planned_meals set items = '[]' $$), 0, 'B no edita comidas de A');
select is(tests.affected($$ delete from public.body_measurements $$), 0, 'B no borra pesajes de A');
select is(tests.affected($$ update public.weight_goals set status = 'abandoned' $$), 0, 'B no edita objetivos de A');
select throws_ok(
  format($$ insert into public.planned_meals (plan_id, day, slot, target_kcal, target_protein_g, items) values (%L, 1, 'dinner', 500, 30, '[]') $$, current_setting('t.meal_plan')),
  '23503', null, 'B no agrega comidas a la minuta de A'
);
select throws_ok(
  format($$ insert into public.meal_plans (rule_version, catalog_version, nutrition_target_id, week_start, meals_per_day, params) values ('m', 'c', %L, '2026-11-23', 4, '{}') $$, current_setting('t.target')),
  '23503', null, 'B no usa la meta de A'
);

-- Ejercer derechos no requiere consentimiento vigente.
insert into public.consents (kind, policy_version, action) values ('health-data', 'v0.1', 'withdrawn');
select lives_ok($$ insert into public.data_requests (kind) values ('delete') $$, 'Sin consentimiento igual se pide eliminar');

-- El servicio procesa la solicitud; al borrar la cuenta queda la constancia (CA-09).
select tests.as_service();
select is(tests.affected($$ update public.data_requests set status = 'done', completed_at = now() where kind = 'export' $$), 1, 'El servicio cierra la solicitud');
select tests.as_postgres();
delete from auth.users where id = current_setting('t.a')::uuid;
select is((select count(*)::int from public.food_logs), 0, 'Cascada: registros eliminados');
select is((select count(*)::int from public.nutrition_targets), 0, 'Cascada: metas eliminadas');
select is((select count(*)::int from public.data_requests where user_id is null and kind = 'export'), 1, 'La solicitud queda como constancia sin dueño');

select * from finish();
rollback;
