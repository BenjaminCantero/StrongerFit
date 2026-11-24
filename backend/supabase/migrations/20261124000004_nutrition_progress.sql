-- DB-03 · Nutrición y progreso: metas nutricionales, registro alimentario, minuta,
-- mediciones, objetivo de peso y solicitudes de exportación y eliminación.
-- RF-09 a RF-16, RF-29, BR-07, BR-16, BR-17, BR-19, BR-20, CA-09.
-- food_id apunta al catálogo empaquetado en @strongerfit/nutrition-engine; por eso cada
-- registro guarda un snapshot de nutrientes y su procedencia (BR-07).
-- Los límites de BR-16 y BR-17 son la referencia inicial del SRS 8.5: si la revisión
-- profesional los cambia, se ajustan con una migración nueva.

-- Verdadero si el cuestionario vigente de quien consulta declara riesgo (BR-19).
create function public.has_health_risk() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((
    select h.has_risk from public.health_screenings h
    where h.user_id = (select auth.uid())
    order by h.id desc limit 1
  ), false)
$$;
grant execute on function public.has_health_risk() to authenticated;

-- Metas nutricionales: append-only, con las entradas usadas en el cálculo (RNF-07).
create table public.nutrition_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  sex text not null check (sex in ('female', 'male', 'unspecified')),
  age_years smallint not null check (age_years between 18 and 100),
  height_cm numeric(5, 1) not null check (height_cm between 120 and 230),
  weight_kg numeric(5, 2) not null check (weight_kg between 30 and 300),
  activity text not null check (activity in ('sedentary', 'light', 'moderate', 'high', 'very-high')),
  direction text not null check (direction in ('deficit', 'maintenance', 'surplus')),
  adjustment numeric(4, 3) not null,
  protein_per_kg numeric(3, 2) not null check (protein_per_kg between 0.8 and 3),
  fat_share numeric(3, 2) not null check (fat_share between 0.15 and 0.45),
  bmr_kcal integer not null check (bmr_kcal between 500 and 5000),
  tdee_kcal integer not null check (tdee_kcal between 500 and 8000),
  target_kcal integer not null,
  protein_g integer not null check (protein_g >= 0),
  carbs_g integer not null check (carbs_g >= 0),
  fat_g integer not null check (fat_g >= 0),
  training_day_kcal integer,
  rest_day_kcal integer,
  warnings text[] not null default '{}',
  formula text not null check (length(formula) between 1 and 64),
  rule_version text not null check (length(rule_version) between 1 and 64),
  created_at timestamptz not null default clock_timestamp(),
  unique (id, user_id),
  -- BR-17: déficit hasta 20 % y superávit hasta 15 % del gasto estimado.
  check ((direction = 'maintenance' and adjustment = 0)
    or (direction = 'deficit' and adjustment between 0 and 0.2)
    or (direction = 'surplus' and adjustment between 0 and 0.15)),
  -- BR-16: piso de 1 200 kcal (mujer) o 1 500 kcal (hombre o sin declarar).
  check (target_kcal >= case sex when 'female' then 1200 else 1500 end),
  check (training_day_kcal is null or training_day_kcal >= case sex when 'female' then 1200 else 1500 end),
  check (rest_day_kcal is null or rest_day_kcal >= case sex when 'female' then 1200 else 1500 end)
);
create index nutrition_targets_user_idx on public.nutrition_targets (user_id, created_at desc);

create view public.current_nutrition_targets with (security_invoker = on) as
  select distinct on (user_id) * from public.nutrition_targets order by user_id, created_at desc;

-- Registro alimentario (RF-11): entry_id agrupa el alimento y sus acompañamientos.
create table public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_id uuid not null,
  logged_on date not null,
  meal text not null check (meal in ('breakfast', 'lunch', 'snack', 'dinner')),
  food_id text not null check (length(food_id) between 1 and 120),
  food_name text not null check (length(food_name) between 1 and 120),
  grams numeric(6, 1) not null check (grams between 1 and 2000),
  kcal numeric(7, 1) not null check (kcal >= 0),
  protein_g numeric(6, 1) not null check (protein_g >= 0),
  carbs_g numeric(6, 1) not null check (carbs_g >= 0),
  fat_g numeric(6, 1) not null check (fat_g >= 0),
  source text not null check (length(source) between 1 and 120),
  source_version text not null check (length(source_version) between 1 and 64),
  license text not null check (length(license) between 1 and 64),
  catalog_version text not null check (length(catalog_version) between 1 and 64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index food_logs_user_day_idx on public.food_logs (user_id, logged_on);

-- Minuta semanal: inmutable salvo su estado; una activa por persona (RF-12).
create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  rule_version text not null check (length(rule_version) between 1 and 64),
  catalog_version text not null check (length(catalog_version) between 1 and 64),
  nutrition_target_id uuid not null,
  week_start date not null,
  meals_per_day smallint not null check (meals_per_day between 3 and 6),
  params jsonb not null default '{}' check (jsonb_typeof(params) = 'object'),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (nutrition_target_id, user_id) references public.nutrition_targets (id, user_id) on delete cascade
);
create unique index meal_plans_one_active on public.meal_plans (user_id) where status = 'active';

-- Comidas de la minuta; los intercambios (RF-13) reemplazan items y quedan auditados.
create table public.planned_meals (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null,
  user_id uuid not null default auth.uid(),
  day smallint not null check (day between 0 and 6),
  slot text not null check (slot in ('breakfast', 'morning-snack', 'lunch', 'snack', 'evening-snack', 'dinner')),
  day_type text check (day_type in ('training', 'rest')),
  target_kcal integer not null check (target_kcal between 0 and 5000),
  target_protein_g integer not null check (target_protein_g between 0 and 500),
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  updated_at timestamptz not null default now(),
  unique (plan_id, day, slot),
  foreign key (plan_id, user_id) references public.meal_plans (id, user_id) on delete cascade
);

-- Mediciones (RF-15): una por día; al menos un valor.
create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  measured_on date not null,
  weight_kg numeric(5, 2) check (weight_kg between 30 and 300),
  waist_cm numeric(5, 1) check (waist_cm between 40 and 250),
  hip_cm numeric(5, 1) check (hip_cm between 40 and 250),
  body_fat_pct numeric(4, 1) check (body_fat_pct between 2 and 70),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, measured_on),
  check (num_nonnulls(weight_kg, waist_cm, hip_cm, body_fat_pct) > 0)
);

-- Objetivo de peso (RF-29): uno activo. BR-20: si el ritmo supera 1 % del peso
-- inicial por semana, exige confirmación explícita.
create table public.weight_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  start_kg numeric(5, 2) not null check (start_kg between 30 and 300),
  target_kg numeric(5, 2) not null check (target_kg between 30 and 300),
  start_date date not null,
  end_date date not null,
  pace_confirmed boolean not null default false,
  status text not null default 'active' check (status in ('active', 'achieved', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_date < end_date),
  check (pace_confirmed or abs(target_kg - start_kg) * 700 <= start_kg * (end_date - start_date))
);
create unique index weight_goals_one_active on public.weight_goals (user_id) where status = 'active';

-- Solicitudes de exportación y eliminación (RF-16). Al borrar la cuenta la fila queda
-- sin dueño como constancia (CA-09). Solo el servicio cambia el estado.
create table public.data_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  kind text not null check (kind in ('export', 'delete')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'failed')),
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  check (completed_at is null or completed_at >= requested_at)
);
create unique index data_requests_one_open on public.data_requests (user_id, kind) where status in ('pending', 'processing');

-- Permisos.
grant select, insert on public.nutrition_targets, public.meal_plans, public.planned_meals,
  public.weight_goals, public.data_requests to authenticated;
grant select, insert, update, delete on public.food_logs, public.body_measurements to authenticated;
grant update (status) on public.meal_plans, public.weight_goals to authenticated;
grant update (items) on public.planned_meals to authenticated;
grant select on public.current_nutrition_targets to authenticated;

-- RLS con consentimiento vigente para crear y editar datos de salud.
do $$
declare t text;
begin
  foreach t in array array['nutrition_targets', 'food_logs', 'meal_plans', 'planned_meals',
    'body_measurements', 'weight_goals'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s: leer propios" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t, t);
    if t <> 'nutrition_targets' then
      execute format('create policy "%s: crear propios" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id and (select public.has_health_consent()))', t, t);
    end if;
    execute format('create policy "%s: editar propios" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id and (select public.has_health_consent()))', t, t);
    execute format('create policy "%s: borrar propios" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t, t);
  end loop;
end $$;

-- BR-19: con riesgo declarado no se guardan metas de déficit.
create policy "nutrition_targets: crear propios" on public.nutrition_targets for insert to authenticated
  with check (
    (select auth.uid()) = user_id and (select public.has_health_consent())
    and not (direction = 'deficit' and (select public.has_health_risk()))
  );

-- Ejercer derechos (RF-16) no exige consentimiento vigente.
alter table public.data_requests enable row level security;
create policy "data_requests: leer propias" on public.data_requests for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "data_requests: crear propias" on public.data_requests for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'pending' and completed_at is null);

create trigger food_logs_updated_at before update on public.food_logs
  for each row execute function public.set_updated_at();
create trigger planned_meals_updated_at before update on public.planned_meals
  for each row execute function public.set_updated_at();
create trigger body_measurements_updated_at before update on public.body_measurements
  for each row execute function public.set_updated_at();
create trigger weight_goals_updated_at before update on public.weight_goals
  for each row execute function public.set_updated_at();

create trigger food_logs_audit after update or delete on public.food_logs
  for each row execute function public.audit_row();
create trigger planned_meals_audit after update or delete on public.planned_meals
  for each row execute function public.audit_row();
create trigger body_measurements_audit after update or delete on public.body_measurements
  for each row execute function public.audit_row();
create trigger weight_goals_audit after update or delete on public.weight_goals
  for each row execute function public.audit_row();
