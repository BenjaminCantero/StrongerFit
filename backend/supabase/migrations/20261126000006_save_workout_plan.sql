-- Plan de entrenamiento atómico (RF-05, RF-19, RNF-08): archiva el plan activo e inserta el
-- nuevo con sus días, ejercicios y la traza de la recomendación, en una transacción.
-- security invoker: corre con la RLS de quien llama (exige consentimiento vigente).
create function public.save_workout_plan(payload jsonb) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  new_plan_id uuid;
  new_day_id uuid;
  day jsonb;
begin
  update public.workout_plans set status = 'archived'
  where user_id = (select auth.uid()) and status = 'active';

  insert into public.workout_plans (rule_version, template_id, template_version, catalog_version, environment, level,
    days_per_week, session_minutes, equipment, zones, changes, warnings)
  values (
    payload ->> 'rule_version', payload ->> 'template_id', payload ->> 'template_version', payload ->> 'catalog_version',
    payload ->> 'environment', payload ->> 'level', (payload ->> 'days_per_week')::smallint, (payload ->> 'session_minutes')::smallint,
    array(select jsonb_array_elements_text(payload -> 'equipment')),
    array(select jsonb_array_elements_text(coalesce(payload -> 'zones', '[]'))),
    coalesce(payload -> 'changes', '[]'),
    array(select jsonb_array_elements_text(coalesce(payload -> 'warnings', '[]')))
  )
  returning id into new_plan_id;

  for day in select value from jsonb_array_elements(payload -> 'days') loop
    insert into public.workout_days (plan_id, position, weekday, name)
    values (new_plan_id, (day ->> 'position')::smallint, (day ->> 'weekday')::smallint, day ->> 'name')
    returning id into new_day_id;

    insert into public.workout_exercises (day_id, position, exercise_id, sets, reps_min, reps_max, rest_seconds, tempo, note)
    select new_day_id, e.position, e.exercise_id, e.sets, e.reps_min, e.reps_max, e.rest_seconds,
      case when e.tempo is null or jsonb_typeof(e.tempo) <> 'array' then null
        else array(select t::smallint from jsonb_array_elements_text(e.tempo) as t) end,
      e.note
    from jsonb_to_recordset(coalesce(day -> 'exercises', '[]')) as e (
      position smallint, exercise_id text, sets smallint, reps_min smallint, reps_max smallint,
      rest_seconds smallint, tempo jsonb, note text
    );
  end loop;

  insert into public.recommendation_runs (kind, rule_version, params, result_id)
  values ('workout-plan', payload ->> 'rule_version', payload - 'days', new_plan_id);

  return new_plan_id;
end $$;

revoke execute on function public.save_workout_plan(jsonb) from public, anon;
grant execute on function public.save_workout_plan(jsonb) to authenticated;
