-- DB-02 · Entrenamiento: planes con versión, días, ejercicios, sesiones, series,
-- sugerencias de carga, temporizadores y trazabilidad de recomendaciones.
-- RF-05 a RF-08, RF-19, RF-25, RF-32, RF-33, BR-05, BR-11, BR-13, RNF-08.
-- exercise_id y template_id apuntan al catálogo empaquetado en @strongerfit/training-engine
-- (identificado por catalog_version), por eso no tienen FK.

-- Plan generado: inmutable salvo su estado; uno activo por persona.
create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  rule_version text not null check (length(rule_version) between 1 and 64),
  template_id text not null check (length(template_id) between 1 and 120),
  template_version text not null check (length(template_version) between 1 and 64),
  catalog_version text not null check (length(catalog_version) between 1 and 64),
  environment text not null check (environment in ('none', 'calisthenics', 'small-gym', 'commercial-gym')),
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  days_per_week smallint not null check (days_per_week between 1 and 7),
  session_minutes smallint not null check (session_minutes between 15 and 180),
  equipment text[] not null check (equipment <@ array['bodyweight', 'dumbbells', 'barbell', 'machines', 'bands']),
  zones text[] not null default '{}' check (zones <@ array['back', 'knee', 'elbow', 'shoulder', 'wrist', 'hip']),
  changes jsonb not null default '[]' check (jsonb_typeof(changes) = 'array'),
  warnings text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create unique index workout_plans_one_active on public.workout_plans (user_id) where status = 'active';

create table public.workout_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null,
  user_id uuid not null default auth.uid(),
  position smallint not null check (position between 0 and 6),
  weekday smallint not null check (weekday between 0 and 6),
  name text not null check (length(name) between 1 and 80),
  unique (id, user_id),
  unique (plan_id, position),
  foreign key (plan_id, user_id) references public.workout_plans (id, user_id) on delete cascade
);

-- Editable dentro del plan activo (RF-06), con auditoría.
create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null,
  user_id uuid not null default auth.uid(),
  position smallint not null check (position between 0 and 30),
  exercise_id text not null check (length(exercise_id) between 1 and 120),
  sets smallint not null check (sets between 1 and 10),
  reps_min smallint not null check (reps_min between 1 and 50),
  reps_max smallint not null check (reps_max between 1 and 50),
  rest_seconds smallint not null check (rest_seconds between 0 and 600),
  tempo smallint[] check (tempo is null or (array_length(tempo, 1) = 3 and 0 <= all (tempo) and 10 >= all (tempo))),
  note text check (length(note) <= 200),
  updated_at timestamptz not null default now(),
  check (reps_min <= reps_max),
  foreign key (day_id, user_id) references public.workout_days (id, user_id) on delete cascade
);
create index workout_exercises_day_idx on public.workout_exercises (day_id, position);

-- Sesión finalizada: histórica (BR-05). client_id viene del borrador del teléfono y
-- hace idempotente el envío (BR-13, CA-03).
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  client_id uuid not null,
  plan_id uuid,
  day_id uuid,
  title text not null check (length(title) between 1 and 80),
  started_at timestamptz not null,
  finished_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (started_at <= finished_at),
  unique (user_id, client_id),
  unique (id, user_id),
  foreign key (plan_id, user_id) references public.workout_plans (id, user_id),
  foreign key (day_id, user_id) references public.workout_days (id, user_id)
);
create index workout_sessions_user_idx on public.workout_sessions (user_id, finished_at desc);

create table public.performed_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null default auth.uid(),
  exercise_id text not null check (length(exercise_id) between 1 and 120),
  exercise_position smallint not null check (exercise_position between 0 and 30),
  set_number smallint not null check (set_number between 1 and 50),
  weight_kg numeric(5, 2) check (weight_kg between 0 and 500),
  reps smallint check (reps between 0 and 100),
  duration_seconds integer check (duration_seconds between 1 and 3600),
  completed boolean not null default true,
  kind text not null default 'work' check (kind in ('work', 'calibration')),
  reserve smallint check (reserve between 0 and 10),
  estimated boolean not null default false,
  updated_at timestamptz not null default now(),
  check (reps is not null or duration_seconds is not null),
  unique (session_id, exercise_position, set_number),
  foreign key (session_id, user_id) references public.workout_sessions (id, user_id) on delete cascade
);
create index performed_sets_exercise_idx on public.performed_sets (user_id, exercise_id);

-- Calibración y sobrecarga sugeridas: nunca se aplican solas (BR-22 a BR-24).
create table public.load_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exercise_id text not null check (length(exercise_id) between 1 and 120),
  session_id uuid,
  kind text not null check (kind in ('calibration-estimate', 'overload')),
  suggested_kg numeric(5, 2) not null check (suggested_kg between 0 and 500),
  applied_kg numeric(5, 2) check (applied_kg between 0 and 500),
  decision text not null default 'pending' check (decision in ('pending', 'applied', 'modified', 'ignored', 'undone')),
  rule_version text not null check (length(rule_version) between 1 and 64),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  check (decision not in ('applied', 'modified') or applied_kg is not null),
  foreign key (session_id, user_id) references public.workout_sessions (id, user_id)
);
create index load_suggestions_user_idx on public.load_suggestions (user_id, exercise_id, created_at desc);

-- Temporizador por ejercicio (RF-25).
create table public.timer_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exercise_id text not null check (length(exercise_id) between 1 and 120),
  kind text not null check (kind in ('rest', 'hold', 'interval')),
  rest_seconds smallint not null check (rest_seconds between 0 and 600),
  hold_seconds smallint check (hold_seconds between 1 and 600),
  work_seconds smallint check (work_seconds between 1 and 600),
  interval_rest_seconds smallint check (interval_rest_seconds between 0 and 600),
  rounds smallint check (rounds between 1 and 50),
  updated_at timestamptz not null default now(),
  unique (user_id, exercise_id),
  check (kind <> 'hold' or hold_seconds is not null),
  check (kind <> 'interval' or (work_seconds is not null and interval_rest_seconds is not null and rounds is not null))
);

-- Trazabilidad de cada recomendación (RNF-08): append-only.
create table public.recommendation_runs (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('workout-plan', 'nutrition-targets', 'meal-plan', 'load-suggestion')),
  rule_version text not null check (length(rule_version) between 1 and 64),
  params jsonb not null default '{}' check (jsonb_typeof(params) = 'object'),
  result_id uuid,
  created_at timestamptz not null default now()
);
create index recommendation_runs_user_idx on public.recommendation_runs (user_id, created_at desc);

-- Permisos: solo lo que cada tabla admite. Las columnas no listadas no se editan.
grant select, insert on public.workout_plans, public.workout_days, public.workout_sessions,
  public.performed_sets, public.load_suggestions, public.recommendation_runs to authenticated;
grant update (status) on public.workout_plans to authenticated;
grant select, insert, update, delete on public.workout_exercises, public.timer_presets to authenticated;
grant update (title, started_at, finished_at) on public.workout_sessions to authenticated;
grant update (weight_kg, reps, duration_seconds, completed, reserve, estimated) on public.performed_sets to authenticated;
grant update (applied_kg, decision, decided_at) on public.load_suggestions to authenticated;

-- RLS homogénea: leer, crear, editar y borrar lo propio; crear y editar exige
-- consentimiento vigente. Las operaciones sin permiso de tabla quedan bloqueadas antes.
do $$
declare t text;
begin
  foreach t in array array['workout_plans', 'workout_days', 'workout_exercises', 'workout_sessions',
    'performed_sets', 'load_suggestions', 'timer_presets', 'recommendation_runs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s: leer propios" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t, t);
    execute format('create policy "%s: crear propios" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id and (select public.has_health_consent()))', t, t);
    execute format('create policy "%s: editar propios" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id and (select public.has_health_consent()))', t, t);
    execute format('create policy "%s: borrar propios" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t, t);
  end loop;
end $$;

create trigger workout_exercises_updated_at before update on public.workout_exercises
  for each row execute function public.set_updated_at();
create trigger workout_sessions_updated_at before update on public.workout_sessions
  for each row execute function public.set_updated_at();
create trigger performed_sets_updated_at before update on public.performed_sets
  for each row execute function public.set_updated_at();
create trigger timer_presets_updated_at before update on public.timer_presets
  for each row execute function public.set_updated_at();

create trigger workout_exercises_audit after update or delete on public.workout_exercises
  for each row execute function public.audit_row();
create trigger workout_sessions_audit after update or delete on public.workout_sessions
  for each row execute function public.audit_row();
create trigger performed_sets_audit after update or delete on public.performed_sets
  for each row execute function public.audit_row();
create trigger load_suggestions_audit after update or delete on public.load_suggestions
  for each row execute function public.audit_row();

-- Envío único de una sesión finalizada con sus series, en una transacción (CA-03).
-- security invoker: corre con los permisos y la RLS de quien llama. Si el client_id ya
-- existe para esa persona, devuelve la sesión guardada sin insertar nada.
-- payload: { client_id, plan_id?, day_id?, title, started_at, finished_at,
--            sets: [{ id?, exercise_id, exercise_position, set_number, weight_kg?, reps?,
--                     duration_seconds?, completed?, kind?, reserve?, estimated? }] }
create function public.submit_session(payload jsonb) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  session_id uuid;
begin
  insert into public.workout_sessions (client_id, plan_id, day_id, title, started_at, finished_at)
  values (
    (payload ->> 'client_id')::uuid, (payload ->> 'plan_id')::uuid, (payload ->> 'day_id')::uuid,
    payload ->> 'title', (payload ->> 'started_at')::timestamptz, (payload ->> 'finished_at')::timestamptz
  )
  on conflict (user_id, client_id) do nothing
  returning id into session_id;

  if session_id is null then
    select s.id into session_id from public.workout_sessions s
    where s.user_id = (select auth.uid()) and s.client_id = (payload ->> 'client_id')::uuid;
    return session_id;
  end if;

  insert into public.performed_sets (id, session_id, exercise_id, exercise_position, set_number, weight_kg,
    reps, duration_seconds, completed, kind, reserve, estimated)
  select coalesce(s.id, gen_random_uuid()), session_id, s.exercise_id, s.exercise_position, s.set_number, s.weight_kg,
    s.reps, s.duration_seconds, coalesce(s.completed, true), coalesce(s.kind, 'work'), s.reserve, coalesce(s.estimated, false)
  from jsonb_to_recordset(coalesce(payload -> 'sets', '[]')) as s (
    id uuid, exercise_id text, exercise_position smallint, set_number smallint, weight_kg numeric,
    reps smallint, duration_seconds integer, completed boolean, kind text, reserve smallint, estimated boolean
  );

  return session_id;
end $$;
grant execute on function public.submit_session(jsonb) to authenticated;
