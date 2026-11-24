-- DB-01 · Identidad: perfil, metas, preferencias, lesiones, cuestionario de aptitud y
-- consentimientos. RF-02, RF-03, RF-22, RF-30, RNF-13, RNF-25, BR-01, BR-19, CA-11.
-- Los valores enumerados siguen los tipos de @strongerfit/training-engine y del onboarding.

-- Consentimientos: append-only. El vigente por tipo es el último registro (CA-11).
create table public.consents (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('health-data')),
  policy_version text not null check (length(policy_version) between 1 and 64),
  action text not null check (action in ('granted', 'withdrawn')),
  at timestamptz not null default clock_timestamp()
);
create index consents_user_idx on public.consents (user_id, kind, id desc);
alter table public.consents enable row level security;
grant select, insert on public.consents to authenticated;
create policy "consents: leer propios" on public.consents
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "consents: registrar propios" on public.consents
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- Verdadero si el último consentimiento de datos de salud de quien consulta está otorgado.
-- Las políticas de escritura de datos de salud lo exigen.
create function public.has_health_consent() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((
    select c.action = 'granted' from public.consents c
    where c.user_id = (select auth.uid()) and c.kind = 'health-data'
    order by c.id desc limit 1
  ), false)
$$;
grant execute on function public.has_health_consent() to authenticated;

create view public.current_consents with (security_invoker = on) as
  select distinct on (user_id, kind) * from public.consents order by user_id, kind, id desc;
grant select on public.current_consents to authenticated;

-- Perfil: una fila por persona, editable y auditada.
create table public.profiles (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  display_name text not null check (length(display_name) between 1 and 80),
  sex text not null check (sex in ('female', 'male', 'unspecified')),
  age_years smallint not null check (age_years between 18 and 100),
  height_cm numeric(5, 1) not null check (height_cm between 120 and 230),
  activity text not null check (activity in ('sedentary', 'light', 'moderate', 'high', 'very-high')),
  units text not null default 'metric' check (units in ('metric')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Metas de entrenamiento: append-only; la vigente es la última (RF-03).
create table public.user_goals (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal text not null check (goal in ('strength', 'muscle', 'fat-loss', 'health')),
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  environment text not null check (environment in ('none', 'calisthenics', 'small-gym', 'commercial-gym')),
  equipment text[] not null check (equipment <@ array['bodyweight', 'dumbbells', 'barbell', 'machines', 'bands']),
  days_per_week smallint not null check (days_per_week between 1 and 7),
  session_minutes smallint not null check (session_minutes between 15 and 180),
  created_at timestamptz not null default clock_timestamp()
);
create index user_goals_user_idx on public.user_goals (user_id, id desc);

create view public.current_user_goals with (security_invoker = on) as
  select distinct on (user_id) * from public.user_goals order by user_id, id desc;

-- Preferencias alimentarias: una fila por persona, editable y auditada.
create table public.user_preferences (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  meals_per_day smallint not null default 4 check (meals_per_day between 3 and 6),
  preferred_food_ids text[] not null default '{}',
  disliked_food_ids text[] not null default '{}',
  exclusions text[] not null default '{}',
  diet_focus text not null default '' check (length(diet_focus) <= 200),
  training_day_targets boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Lesiones por zona (RF-30): se resuelven con resolved_at, no se borran.
create table public.user_injuries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  zone text not null check (zone in ('back', 'knee', 'elbow', 'shoulder', 'wrist', 'hip')),
  declared_at timestamptz not null default now(),
  resolved_at timestamptz check (resolved_at is null or resolved_at >= declared_at),
  updated_at timestamptz not null default now()
);
create unique index user_injuries_active_zone on public.user_injuries (user_id, zone) where resolved_at is null;

-- Cuestionario de aptitud (RF-22): append-only. Las respuestas de riesgo limitan las
-- recomendaciones automáticas (BR-19); una lesión sola no es riesgo clínico.
create table public.health_screenings (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  questionnaire_version text not null check (length(questionnaire_version) between 1 and 64),
  flags text[] not null check (flags <@ array['injury', 'cardiovascular', 'pregnancy', 'eating-disorder']),
  has_risk boolean generated always as (flags && array['cardiovascular', 'pregnancy', 'eating-disorder']) stored,
  disclaimer_accepted_at timestamptz not null,
  created_at timestamptz not null default clock_timestamp()
);
create index health_screenings_user_idx on public.health_screenings (user_id, id desc);

create view public.current_health_screening with (security_invoker = on) as
  select distinct on (user_id) * from public.health_screenings order by user_id, id desc;

-- RLS: lectura propia; escritura propia y solo con consentimiento vigente.
alter table public.profiles enable row level security;
alter table public.user_goals enable row level security;
alter table public.user_preferences enable row level security;
alter table public.user_injuries enable row level security;
alter table public.health_screenings enable row level security;

grant select, insert, update on public.profiles, public.user_preferences, public.user_injuries to authenticated;
grant select, insert on public.user_goals, public.health_screenings to authenticated;
grant select on public.current_user_goals, public.current_health_screening to authenticated;

create policy "profiles: leer propio" on public.profiles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "profiles: crear propio" on public.profiles for insert to authenticated
  with check ((select auth.uid()) = user_id and (select public.has_health_consent()));
create policy "profiles: editar propio" on public.profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and (select public.has_health_consent()));

create policy "user_goals: leer propias" on public.user_goals for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "user_goals: crear propias" on public.user_goals for insert to authenticated
  with check ((select auth.uid()) = user_id and (select public.has_health_consent()));

create policy "user_preferences: leer propias" on public.user_preferences for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "user_preferences: crear propias" on public.user_preferences for insert to authenticated
  with check ((select auth.uid()) = user_id and (select public.has_health_consent()));
create policy "user_preferences: editar propias" on public.user_preferences for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and (select public.has_health_consent()));

create policy "user_injuries: leer propias" on public.user_injuries for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "user_injuries: crear propias" on public.user_injuries for insert to authenticated
  with check ((select auth.uid()) = user_id and (select public.has_health_consent()));
create policy "user_injuries: editar propias" on public.user_injuries for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and (select public.has_health_consent()));

create policy "health_screenings: leer propios" on public.health_screenings for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "health_screenings: crear propios" on public.health_screenings for insert to authenticated
  with check ((select auth.uid()) = user_id and (select public.has_health_consent()));

-- updated_at y auditoría de las tablas editables.
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger user_preferences_updated_at before update on public.user_preferences
  for each row execute function public.set_updated_at();
create trigger user_injuries_updated_at before update on public.user_injuries
  for each row execute function public.set_updated_at();

create trigger profiles_audit after update or delete on public.profiles
  for each row execute function public.audit_row();
create trigger user_preferences_audit after update or delete on public.user_preferences
  for each row execute function public.audit_row();
create trigger user_injuries_audit after update or delete on public.user_injuries
  for each row execute function public.audit_row();
