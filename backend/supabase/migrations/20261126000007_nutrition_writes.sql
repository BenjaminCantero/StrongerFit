-- SY-04 · Escrituras de nutrición.
-- 1. Orden de los alimentos de un registro del diario: el primero es el principal y los
--    demás sus acompañamientos. Se insertan juntos, así que created_at no los ordena.
alter table public.food_logs add column position smallint not null default 0 check (position between 0 and 20);

-- 2. Minuta atómica (RF-12, RNF-08): archiva la activa e inserta la nueva con sus comidas y
--    la traza de la recomendación. security invoker: corre con la RLS de quien llama.
create function public.save_meal_plan(payload jsonb) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  new_plan_id uuid;
begin
  update public.meal_plans set status = 'archived'
  where user_id = (select auth.uid()) and status = 'active';

  insert into public.meal_plans (rule_version, catalog_version, nutrition_target_id, week_start, meals_per_day, params)
  values (
    payload ->> 'rule_version', payload ->> 'catalog_version', (payload ->> 'nutrition_target_id')::uuid,
    (payload ->> 'week_start')::date, (payload ->> 'meals_per_day')::smallint, coalesce(payload -> 'params', '{}')
  )
  returning id into new_plan_id;

  insert into public.planned_meals (plan_id, day, slot, day_type, target_kcal, target_protein_g, items)
  select new_plan_id, m.day, m.slot, m.day_type, m.target_kcal, m.target_protein_g, m.items
  from jsonb_to_recordset(coalesce(payload -> 'meals', '[]')) as m (
    day smallint, slot text, day_type text, target_kcal integer, target_protein_g integer, items jsonb
  );

  insert into public.recommendation_runs (kind, rule_version, params, result_id)
  values ('meal-plan', payload ->> 'rule_version', payload - 'meals' - 'params', new_plan_id);

  return new_plan_id;
end $$;

revoke execute on function public.save_meal_plan(jsonb) from public, anon;
grant execute on function public.save_meal_plan(jsonb) to authenticated;
