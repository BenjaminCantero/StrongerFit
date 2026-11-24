-- complete_onboarding: guarda todo el onboarding en una transacción (RF-02, RF-22, CA-11).
begin;
select * from no_plan();

select set_config('t.a', tests.create_user('a@test.dev')::text, true);
select set_config('t.b', tests.create_user('b@test.dev')::text, true);
select set_config('t.payload', $json${
  "consent_version": "consentimiento-salud-v0.1",
  "questionnaire_version": "aptitud-v0.1",
  "health_flags": ["injury"],
  "disclaimer_accepted_at": "2026-11-24T10:00:00Z",
  "profile": {"display_name": "Ana", "sex": "female", "age_years": 30, "height_cm": 165, "activity": "moderate"},
  "goal": {"goal": "strength", "level": "beginner", "environment": "small-gym", "equipment": ["bodyweight", "dumbbells"], "days_per_week": 3, "session_minutes": 45},
  "preferences": {"meals_per_day": 4, "preferred_food_ids": [], "disliked_food_ids": ["usda-1"], "exclusions": ["mani"], "diet_focus": "", "training_day_targets": false},
  "injuries": ["knee", "wrist"],
  "weight": {"measured_on": "2026-11-24", "weight_kg": 70.5},
  "weight_goal": {"start_kg": 70.5, "target_kg": 66, "start_date": "2026-11-24", "end_date": "2027-03-16", "pace_confirmed": false}
}$json$, true);

select tests.as_user(current_setting('t.a')::uuid);
select is(public.complete_onboarding(current_setting('t.payload')::jsonb), true, 'A completa el onboarding');
select ok(public.has_health_consent(), 'Queda el consentimiento otorgado');
select is((select count(*)::int from public.profiles), 1, 'Perfil creado');
select is((select count(*)::int from public.user_goals), 1, 'Meta creada');
select is((select count(*)::int from public.user_preferences), 1, 'Preferencias creadas');
select is((select array_agg(zone order by zone) from public.user_injuries), array['knee', 'wrist'], 'Lesiones creadas');
select is((select flags from public.health_screenings), array['injury'], 'Cuestionario guardado');
select is((select weight_kg from public.body_measurements), 70.5::numeric, 'Primer pesaje guardado');
select is((select target_kg from public.weight_goals), 66::numeric, 'Objetivo de peso guardado');

select is(public.complete_onboarding(current_setting('t.payload')::jsonb), false, 'Reintentar no duplica nada');
select is((select count(*)::int from public.user_goals), 1, 'Sigue una sola meta');
select is((select count(*)::int from public.consents), 1, 'Sigue un solo consentimiento');

-- Atomicidad: un dato inválido no deja filas a medias.
select tests.as_user(current_setting('t.b')::uuid);
select throws_ok(
  format('select public.complete_onboarding(%L::jsonb)', jsonb_set(current_setting('t.payload')::jsonb, '{goal,days_per_week}', '9')),
  '23514', null, 'Un dato fuera de rango aborta todo'
);
select is((select count(*)::int from public.consents), 0, 'No quedó consentimiento suelto');
select is((select count(*)::int from public.profiles), 0, 'No quedó perfil suelto');

select throws_ok(
  format('select public.complete_onboarding(%L::jsonb)', current_setting('t.payload')::jsonb - 'consent_version'),
  '23502', null, 'Sin versión de consentimiento no avanza (CA-11)'
);

select lives_ok(
  format('select public.complete_onboarding(%L::jsonb)', current_setting('t.payload')::jsonb - 'weight_goal' || '{"injuries": [], "health_flags": []}'),
  'Sin objetivo de peso ni lesiones también se completa'
);
select is((select count(*)::int from public.weight_goals), 0, 'Sin objetivo de peso no se crea');
select is((select count(*)::int from public.profiles), 1, 'B solo ve su perfil');

select tests.as_anon();
select throws_ok(
  format('select public.complete_onboarding(%L::jsonb)', current_setting('t.payload')),
  '42501', null, 'anon no puede completar onboarding'
);

select * from finish();
rollback;
