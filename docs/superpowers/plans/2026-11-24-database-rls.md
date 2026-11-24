# Base de datos y RLS (DB-01 a DB-04) — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Esquema Supabase con RLS por propietario y pruebas pgTAP de acceso cruzado que corren en CI desde cero.

**Architecture:** Cuatro migraciones SQL (base, identidad, entrenamiento, nutrición y progreso) en `backend/supabase/migrations/`. Pruebas pgTAP en `backend/supabase/tests/`, un archivo por migración más helpers y una guarda global. Job `database` en GitHub Actions.

**Tech Stack:** PostgreSQL 17 (Supabase local), Supabase CLI 2.122.0, pgTAP, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-24-database-rls-design.md` (columnas, rangos y modos de cada tabla).

## Global Constraints

- Toda tabla de `public` tiene RLS y aparece en el manifiesto de `tests/database/99_coverage.test.sql`.
- Políticas `to authenticated` con `(select auth.uid()) = user_id`; `anon` sin permisos.
- Tablas hijas: FK compuesta `(parent_id, user_id)` hacia `unique (id, user_id)` del padre.
- INSERT de datos de salud exige `public.has_health_consent()`.
- Funciones `security definer` con `set search_path = ''` y nombres calificados.
- Rangos: edad 18–100, altura 120–230 cm, peso 30–300 kg, días 1–7, minutos 15–180.
- Comandos: `npx supabase db reset --workdir backend` y `npx supabase test db --workdir backend`.

---

### Task 1: Helpers de prueba, migración base y guarda de cobertura

**Files:**
- Create: `backend/supabase/tests/database/00_helpers.test.sql` (crea esquema `tests` y funciones; un `ok(true)`)
- Create: `backend/supabase/tests/database/99_coverage.test.sql`
- Create: `backend/supabase/migrations/20261124000001_base.sql`

**Interfaces — Produces:**
- `tests.create_user(email text) returns uuid`
- `tests.as_user(uid uuid)`, `tests.as_anon()`, `tests.as_service()`, `tests.as_postgres()`
- `public.audit_events`, trigger function `public.audit_row()`, `public.set_updated_at()`

Steps:
- [ ] Escribir helpers y guarda (falla: `audit_events` sin RLS o sin manifiesto).
- [ ] `db reset` + `test db` → falla esperada.
- [ ] Escribir migración base.
- [ ] `db reset` + `test db` → pasa.
- [ ] Commit `feat(db): add base migration and test helpers`.

### Task 2: DB-01 identidad

**Files:** `migrations/20261124000002_identity.sql`, `tests/database/10_identity.test.sql`, manifiesto en `99_coverage`.

Pruebas: A≠B y anónimo en `profiles`, `user_goals`, `user_preferences`, `user_injuries`, `health_screenings`, `consents`; INSERT sin consentimiento falla; retirar consentimiento bloquea; append-only rechaza UPDATE/DELETE; `has_risk`; CHECK de rangos; auditoría de `profiles`; cascada al borrar usuario.

Commit `feat(db): add identity tables with RLS (DB-01)`.

### Task 3: DB-02 entrenamiento

**Files:** `migrations/20261124000003_training.sql`, `tests/database/20_training.test.sql`.

Pruebas: A≠B en las 8 tablas; hijo no apunta a padre ajeno; un plan activo; sesión sin DELETE; `submit_session` dos veces → 1 sesión y N series; `reps_min <= reps_max`; auditoría en `workout_exercises`.

Commit `feat(db): add training tables and submit_session (DB-02)`.

### Task 4: DB-03 nutrición y progreso

**Files:** `migrations/20261124000004_nutrition_progress.sql`, `tests/database/30_nutrition_progress.test.sql`.

Pruebas: A≠B en las 7 tablas; BR-19 (déficit con riesgo falla); BR-20 (ritmo > 1 % sin confirmar falla); `data_requests` sin UPDATE de usuario y conserva fila con `user_id` nulo tras borrar usuario; medida mínima en `body_measurements`.

Commit `feat(db): add nutrition and progress tables (DB-03)`.

### Task 5: DB-04 CI, script y docs

**Files:** `.github/workflows/ci.yml` (job `database`), `package.json` (`db:test`), `backend/supabase/migrations/README.md`, `backend/supabase/tests/README.md`, `docs/architecture/initial.md`.

Verificación: `npm run db:test` y `npm run check` en verde.

Commit `ci(db): apply migrations from scratch and run RLS tests (DB-04)`.
