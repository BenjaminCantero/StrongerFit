# Base de datos y RLS (DB-01 a DB-04) — diseño

Fecha: 2026-11-24 · Fase 1 del cronograma · Hito H-1 (CA-01, CA-10)

## Objetivo

Crear el esquema PostgreSQL de Supabase que persistirá lo que hoy la app guarda en memoria
(onboarding, perfil, plan y sesiones de entrenamiento, diario, metas, minuta, pesajes y
objetivo de peso), con RLS por propietario en el 100 % de las tablas privadas y pruebas
automatizadas de acceso cruzado que corren en CI desde una base vacía.

No incluye la capa de datos de la app (SY-01 a SY-04), el proyecto Supabase en la nube (AU-01),
las Edge Functions de exportación y eliminación (BE-01) ni las tablas de la versión 1.1
(`sleep_logs`, `sync_events`, `weekly_checkins`, `plan_adjustments`, `athlete_profiles`).

## Decisiones

1. **Acceso por SDK directo con RLS (SRS 8.3).** La app lee y escribe con la clave pública.
   Las políticas cubren SELECT, INSERT, UPDATE y DELETE según el modo de cada tabla. La API Hono
   queda para operaciones privilegiadas.
2. **Historial append-only + auditoría por trigger (RF-03, BR-05).** Metas, consentimientos,
   cuestionarios, metas nutricionales y ejecuciones de recomendación solo admiten INSERT; la
   fila vigente es la más reciente. Las tablas editables registran el antes y el después en
   `audit_events` mediante trigger.
3. **El consentimiento se exige en la base (CA-11).** Las políticas INSERT de las tablas con
   datos de salud llaman a `has_health_consent()`. Sin consentimiento vigente, o después de
   retirarlo, no se insertan datos nuevos aunque la app tenga un error.
4. **Catálogos fuera de la base.** Ejercicios, plantillas y alimentos viven en
   `@strongerfit/training-engine` y `@strongerfit/nutrition-engine`. Las tablas guardan
   identificadores `text` más `catalog_version`, sin FK. Los registros de alimentos guardan un
   snapshot de nutrientes y procedencia (BR-07).
5. **Una migración por tarea del cronograma.** `audit_events` se adelanta de DB-03 a la
   migración base porque los triggers de DB-01 la necesitan.

## Convenciones

- Esquema `public`, claves `uuid`. Las filas que nacen en el teléfono (sesiones, series,
  registros de alimentos, mediciones) llevan un UUID generado en el cliente, lo que da
  idempotencia (BR-13).
- Toda tabla privada tiene `user_id uuid not null references auth.users(id) on delete cascade`
  (excepción: `data_requests`, ver abajo), RLS activo y políticas `to authenticated` con
  `(select auth.uid()) = user_id`. El rol `anon` no recibe permisos sobre tablas privadas.
- Las tablas hijas repiten `user_id` y usan una FK compuesta `(parent_id, user_id)` hacia el
  padre, con `unique (id, user_id)` en el padre. Así RLS se evalúa sin joins y nadie puede
  colgar una fila en el padre de otra persona.
- Tiempo en `timestamptz` (UTC) y fechas de calendario en `date`. Unidades SI: kg, cm, g, kcal
  (RNF-23).
- Los valores enumerados se guardan como `text` con `CHECK (... in (...))`, alineados con los
  tipos de los motores (`Zone`, `Equipment`, `Environment`, `MealSlot`, etc.). Los arreglos se
  validan con `<@ array[...]`.
- Rangos tomados de `frontend/src/features/profile/domain/profile.ts`: edad 18–100, altura
  120–230 cm, peso 30–300 kg, días 1–7, minutos 15–180.
- Las vistas usan `with (security_invoker = on)` para respetar RLS.
- Las tablas con `updated_at` lo mantienen con el trigger `set_updated_at()`.

## Migraciones

Ruta: `backend/supabase/migrations/`. Prefijo de fecha según `supabase migration new`.

### Base (`..._base.sql`)

- `audit_events(id, user_id, table_name, row_id, action, old_row jsonb, new_row jsonb, at)`.
  Política SELECT propia; sin políticas de escritura. Solo inserta la función
  `audit_row()` (`security definer`, `search_path` fijo).
- `set_updated_at()`.
- `has_health_consent()` (`security definer`, `stable`): verdadero si el último registro de
  `consents` del usuario actual con `kind = 'health-data'` tiene `action = 'granted'`. Se crea
  en la migración de identidad, después de `consents`.
- Revocación de privilegios por defecto a `anon` en `public`.

### DB-01 Identidad (`..._identity.sql`)

| Tabla | Modo | Columnas principales |
|---|---|---|
| `profiles` | una fila por usuario (`user_id` PK), editable, auditada | `display_name`, `sex` (female, male, unspecified), `age_years` 18–100, `height_cm` 120–230, `activity` (sedentary, light, moderate, high, very-high), `units` ('metric') |
| `user_goals` | append-only | `goal` (strength, muscle, fat-loss, health), `level` (beginner, intermediate, advanced), `environment` (none, calisthenics, small-gym, commercial-gym), `equipment text[]`, `days_per_week` 1–7, `session_minutes` 15–180 |
| `user_preferences` | una fila por usuario, editable, auditada | `meals_per_day` 3–6, `preferred_food_ids text[]`, `disliked_food_ids text[]`, `exclusions text[]`, `diet_focus`, `training_day_targets boolean` |
| `user_injuries` | editable, auditada | `zone` (back, knee, elbow, shoulder, wrist, hip), `declared_at`, `resolved_at`; índice único parcial por zona activa |
| `health_screenings` | append-only | `questionnaire_version`, `flags text[]` (injury, cardiovascular, pregnancy, eating-disorder), `disclaimer_accepted_at`, `has_risk` generada (true si hay cardiovascular, pregnancy o eating-disorder; BR-19) |
| `consents` | append-only | `kind` ('health-data'), `policy_version`, `action` (granted, withdrawn), `at` |

Vistas: `current_user_goals`, `current_health_screening`, `current_consents`.

`consents` se inserta sin exigir consentimiento previo. El resto de las tablas exige
`has_health_consent()` en INSERT.

### DB-02 Entrenamiento (`..._training.sql`)

| Tabla | Modo | Columnas principales |
|---|---|---|
| `workout_plans` | inmutable salvo `status`; un `active` por usuario | `rule_version`, `template_id`, `template_version`, `catalog_version`, `environment`, `level`, `days_per_week`, `session_minutes`, `equipment text[]`, `zones text[]`, `changes jsonb`, `warnings text[]`, `status` (active, archived) |
| `workout_days` | hija de plan | `plan_id`, `position`, `weekday` 0–6, `name` |
| `workout_exercises` | hija de día, editable, auditada (RF-06) | `day_id`, `position`, `exercise_id text`, `sets` 1–10, `reps_min`/`reps_max` 1–50 con `reps_min <= reps_max`, `rest_seconds` 0–600, `tempo smallint[]` de 3 elementos o nulo |
| `workout_sessions` | histórica: UPDATE auditado, sin DELETE (BR-05) | `client_id uuid` con `unique (user_id, client_id)`, `plan_id`/`day_id` opcionales, `title`, `started_at`, `finished_at` con `started_at <= finished_at` |
| `performed_sets` | hija de sesión, mismo régimen | `id` de cliente, `exercise_id`, `exercise_position`, `set_number`, `weight_kg` 0–500 o nulo, `reps` 0–100 o nulo, `duration_seconds` o nulo, `completed`, `kind` (work, calibration), `reserve` 0–10 o nulo, `estimated` |
| `load_suggestions` | solo cambia la decisión, auditada | `exercise_id`, `session_id` opcional, `kind` (calibration-estimate, overload), `suggested_kg`, `applied_kg`, `decision` (pending, applied, modified, ignored, undone), `rule_version`, `decided_at` |
| `timer_presets` | una fila por ejercicio, editable | `exercise_id`, `kind` (rest, hold, interval), `rest_seconds`, `hold_seconds`, `work_seconds`, `interval_rest_seconds`, `rounds` |
| `recommendation_runs` | append-only (RNF-08, RF-19) | `kind` (workout-plan, nutrition-targets, meal-plan, load-suggestion), `rule_version`, `params jsonb`, `result_id uuid` |

RPC `submit_session(payload jsonb)` (`security invoker`): inserta la sesión y sus series en
una transacción. Si `client_id` ya existe, devuelve la sesión existente sin insertar nada. Con
esto el envío único de CA-03 se garantiza en el servidor.

### DB-03 Nutrición y progreso (`..._nutrition_progress.sql`)

| Tabla | Modo | Columnas principales |
|---|---|---|
| `nutrition_targets` | append-only | snapshot de entradas (`sex`, `age_years`, `height_cm`, `weight_kg`, `activity`), `direction` (deficit, maintenance, surplus), `adjustment`, `protein_per_kg`, `fat_share`, `bmr_kcal`, `tdee_kcal`, `target_kcal`, `protein_g`, `carbs_g`, `fat_g`, `training_day_kcal`/`rest_day_kcal` opcionales, `warnings text[]`, `formula`, `rule_version` |
| `food_logs` | editable y borrable (RF-11) | `id` de cliente, `entry_id`, `logged_on`, `meal` (breakfast, lunch, snack, dinner), `food_id`, `food_name`, `grams` 1–2000, `kcal`, `protein_g`, `carbs_g`, `fat_g`, `source`, `source_version`, `license`, `catalog_version` |
| `meal_plans` | inmutable salvo `status`; una activa | `rule_version`, `catalog_version`, `nutrition_target_id`, `week_start`, `meals_per_day`, `params jsonb`, `status` |
| `planned_meals` | hija de minuta, editable, auditada (RF-13) | `day` 0–6, `slot` (breakfast, morning-snack, lunch, snack, evening-snack, dinner), `day_type` (training, rest o nulo), `target_kcal`, `target_protein_g`, `items jsonb` (arreglo) |
| `body_measurements` | editable | `id` de cliente, `measured_on` único por usuario, `weight_kg` 30–300, `waist_cm`, `hip_cm`, `body_fat_pct` opcionales; al menos una medida |
| `weight_goals` | uno `active` por usuario | `start_kg`, `target_kg`, `start_date < end_date`, `pace_confirmed`, `status` (active, achieved, abandoned). CHECK: si el ritmo semanal supera 1 % del peso inicial, `pace_confirmed` debe ser verdadero (BR-20) |
| `data_requests` | usuario inserta y lee; solo `service_role` actualiza | `kind` (export, delete), `status` (pending, processing, done, failed), `requested_at`, `completed_at`. `user_id` nullable con `on delete set null` para conservar la constancia de la eliminación (CA-09) |

La política INSERT de `nutrition_targets` rechaza `direction = 'deficit'` cuando el cuestionario
vigente tiene `has_risk` (BR-19).

## Pruebas (DB-04)

Ruta: `backend/supabase/tests/`. pgTAP mediante `supabase test db`. Cada archivo corre dentro
de `begin ... rollback`.

- `00_helpers.sql`: `tests.create_user()`, `tests.as_user(uuid)` (fija `role authenticated` y
  `request.jwt.claims`), `tests.as_anon()`, `tests.as_service()`. Sin dependencias externas.
- **Guarda global:** falla si alguna tabla de `public` no tiene RLS o no figura en el manifiesto
  de tablas probadas. Una tabla nueva sin prueba rompe CI.
- **Acceso cruzado A≠B en cada tabla:** B no lee, no actualiza ni borra filas de A y no puede
  insertar con el `user_id` de A; un hijo no puede apuntar al padre de otra persona.
- **Anónimo:** sin lectura ni escritura en tablas privadas.
- **Reglas:** consentimiento exigido y retiro efectivo (CA-11); append-only rechaza UPDATE y
  DELETE; `audit_events` se llena por trigger y el usuario no puede escribirla; BR-19; BR-20;
  rangos CHECK; `submit_session` repetido deja una sola sesión (CA-03); borrar el usuario en
  `auth.users` elimina sus datos y conserva `data_requests` con `user_id` nulo (CA-09).

## CI

Nuevo job `database` en `.github/workflows/ci.yml`:

1. `supabase/setup-cli` con versión 2.122.0.
2. `supabase db start --workdir backend`.
3. `supabase db reset --workdir backend` (aplica las migraciones desde cero, CA-10).
4. `supabase test db --workdir backend`.

Script raíz `db:test` para correr lo mismo en local.

## Documentación

- Reemplazar `backend/supabase/migrations/README.md` y `backend/supabase/tests/README.md` por
  la descripción de las convenciones y cómo agregar una tabla con su prueba.
- Actualizar `docs/architecture/initial.md`: ya existen tablas privadas con RLS.

## Criterio de terminado

- `supabase db reset` aplica las cuatro migraciones sin error desde cero.
- `supabase test db` pasa en local y en CI.
- Ninguna tabla de `public` queda sin RLS ni sin prueba cruzada.
- `npm run check` sigue en verde.
