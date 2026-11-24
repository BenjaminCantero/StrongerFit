-- Onboarding atómico (RF-02, RF-22, RF-30, CA-11): consentimiento, cuestionario, perfil,
-- meta, preferencias, lesiones, primer pesaje y objetivo de peso en una transacción.
-- security invoker: corre con la RLS de quien llama. El consentimiento se inserta primero,
-- así las demás políticas lo encuentran vigente.
-- Idempotente: si la persona ya tiene perfil devuelve false sin escribir (reintento tras
-- un corte de red). Un dato inválido aborta todo.
create function public.complete_onboarding(payload jsonb) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare
  p jsonb := payload -> 'profile';
  g jsonb := payload -> 'goal';
  prefs jsonb := payload -> 'preferences';
  w jsonb := payload -> 'weight';
  wg jsonb := payload -> 'weight_goal';
begin
  if exists (select 1 from public.profiles where user_id = (select auth.uid())) then
    return false;
  end if;

  insert into public.consents (kind, policy_version, action)
  values ('health-data', payload ->> 'consent_version', 'granted');

  insert into public.health_screenings (questionnaire_version, flags, disclaimer_accepted_at)
  values (
    payload ->> 'questionnaire_version',
    array(select jsonb_array_elements_text(coalesce(payload -> 'health_flags', '[]'))),
    (payload ->> 'disclaimer_accepted_at')::timestamptz
  );

  insert into public.profiles (display_name, sex, age_years, height_cm, activity)
  values (p ->> 'display_name', p ->> 'sex', (p ->> 'age_years')::smallint, (p ->> 'height_cm')::numeric, p ->> 'activity');

  insert into public.user_goals (goal, level, environment, equipment, days_per_week, session_minutes)
  values (
    g ->> 'goal', g ->> 'level', g ->> 'environment',
    array(select jsonb_array_elements_text(g -> 'equipment')),
    (g ->> 'days_per_week')::smallint, (g ->> 'session_minutes')::smallint
  );

  insert into public.user_preferences (meals_per_day, preferred_food_ids, disliked_food_ids, exclusions, diet_focus, training_day_targets)
  values (
    (prefs ->> 'meals_per_day')::smallint,
    array(select jsonb_array_elements_text(coalesce(prefs -> 'preferred_food_ids', '[]'))),
    array(select jsonb_array_elements_text(coalesce(prefs -> 'disliked_food_ids', '[]'))),
    array(select jsonb_array_elements_text(coalesce(prefs -> 'exclusions', '[]'))),
    coalesce(prefs ->> 'diet_focus', ''),
    coalesce((prefs ->> 'training_day_targets')::boolean, false)
  );

  insert into public.user_injuries (zone)
  select jsonb_array_elements_text(coalesce(payload -> 'injuries', '[]'));

  if w is not null and jsonb_typeof(w) = 'object' then
    insert into public.body_measurements (measured_on, weight_kg)
    values ((w ->> 'measured_on')::date, (w ->> 'weight_kg')::numeric)
    on conflict (user_id, measured_on) do update set weight_kg = excluded.weight_kg;
  end if;

  if wg is not null and jsonb_typeof(wg) = 'object' then
    insert into public.weight_goals (start_kg, target_kg, start_date, end_date, pace_confirmed)
    values ((wg ->> 'start_kg')::numeric, (wg ->> 'target_kg')::numeric, (wg ->> 'start_date')::date,
      (wg ->> 'end_date')::date, coalesce((wg ->> 'pace_confirmed')::boolean, false));
  end if;

  return true;
end $$;

-- Postgres concede EXECUTE a PUBLIC al crear una función; aquí solo authenticated llama
-- las funciones de la app y nadie llama directamente las funciones de trigger.
revoke execute on all functions in schema public from public, anon;
revoke execute on function public.audit_row(), public.set_updated_at() from authenticated;
grant execute on function public.complete_onboarding(jsonb) to authenticated;
