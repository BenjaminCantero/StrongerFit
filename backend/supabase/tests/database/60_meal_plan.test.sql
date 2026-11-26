-- save_meal_plan: guarda la minuta con sus comidas en una transacción y archiva la anterior
-- (RF-12, RNF-08). food_logs.position conserva el orden de los alimentos de un registro.
begin;
select * from no_plan();

select set_config('t.a', tests.create_user('a@test.dev')::text, true);
select set_config('t.b', tests.create_user('b@test.dev')::text, true);

select tests.as_user(current_setting('t.a')::uuid);
insert into public.consents (kind, policy_version, action) values ('health-data', 'v0.1', 'granted');
insert into public.nutrition_targets (sex, age_years, height_cm, weight_kg, activity, direction, adjustment, protein_per_kg, fat_share,
  bmr_kcal, tdee_kcal, target_kcal, protein_g, carbs_g, fat_g, formula, rule_version)
values ('female', 30, 165, 70, 'moderate', 'maintenance', 0, 1.6, 0.25, 1400, 2170, 2170, 112, 270, 60, 'mifflin-st-jeor', 'nutricion-0.1');

select set_config('t.payload', jsonb_build_object(
  'rule_version', 'minuta-0.2', 'catalog_version', 'usda-sr-2018-04-cl-1',
  'nutrition_target_id', (select id from public.nutrition_targets), 'week_start', '2026-11-23', 'meals_per_day', 3,
  'params', '{"tolerance": 0.1}'::jsonb,
  'meals', '[
    {"day": 0, "slot": "breakfast", "day_type": null, "target_kcal": 500, "target_protein_g": 30, "items": [{"foodId": "oats"}]},
    {"day": 0, "slot": "lunch", "day_type": null, "target_kcal": 800, "target_protein_g": 45, "items": [{"foodId": "chicken"}]},
    {"day": 0, "slot": "dinner", "day_type": null, "target_kcal": 700, "target_protein_g": 37, "items": [{"foodId": "eggs"}]}
  ]'::jsonb)::text, true);

select set_config('t.first', public.save_meal_plan(current_setting('t.payload')::jsonb)::text, true);
select is((select count(*)::int from public.meal_plans where status = 'active'), 1, 'Queda una minuta activa');
select is((select count(*)::int from public.planned_meals), 3, 'Se guardan sus comidas');
select is((select result_id from public.recommendation_runs where kind = 'meal-plan'), current_setting('t.first')::uuid, 'Deja la traza (RNF-08)');

select lives_ok(format('select public.save_meal_plan(%L::jsonb)', current_setting('t.payload')), 'Una minuta nueva reemplaza a la activa');
select is((select status from public.meal_plans where id = current_setting('t.first')::uuid), 'archived', 'La anterior queda archivada');

select lives_ok($$ update public.planned_meals set items = '[{"foodId": "tofu"}]' where slot = 'lunch' $$, 'Un intercambio actualiza items');
select throws_ok($$ update public.planned_meals set target_kcal = 1 $$, '42501', null, 'Solo items es editable');

select throws_ok(
  format('select public.save_meal_plan(%L::jsonb)', jsonb_set(current_setting('t.payload')::jsonb, '{meals,0,slot}', '"brunch"')),
  '23514', null, 'Una comida inválida aborta todo'
);
select is((select count(*)::int from public.meal_plans), 2, 'El intento fallido no deja minuta suelta');

select lives_ok($$ insert into public.food_logs (entry_id, logged_on, meal, food_id, food_name, grams, kcal, protein_g, carbs_g, fat_g,
  source, source_version, license, catalog_version, position)
  values (gen_random_uuid(), '2026-11-26', 'lunch', 'rice', 'Arroz', 150, 195, 4, 42, 0.4, 'USDA FoodData Central', 'SR Legacy', 'CC0-1.0', 'usda-sr-2018-04-cl-1', 1) $$,
  'food_logs guarda la posición del alimento');
select throws_ok($$ insert into public.food_logs (entry_id, logged_on, meal, food_id, food_name, grams, kcal, protein_g, carbs_g, fat_g,
  source, source_version, license, catalog_version, position)
  values (gen_random_uuid(), '2026-11-26', 'lunch', 'rice', 'Arroz', 150, 195, 4, 42, 0.4, 'x', 'x', 'x', 'x', 99) $$,
  '23514', null, 'La posición tiene un límite');

select tests.as_user(current_setting('t.b')::uuid);
select is((select count(*)::int from public.meal_plans), 0, 'B no ve las minutas de A');

select tests.as_anon();
select throws_ok(format('select public.save_meal_plan(%L::jsonb)', current_setting('t.payload')), '42501', null, 'anon no puede guardar minutas');

select * from finish();
rollback;
