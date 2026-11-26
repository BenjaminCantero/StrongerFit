# Migraciones

Esquema versionado de Supabase (RNF-12). El diseño completo está en
`docs/superpowers/specs/2026-11-24-database-rls-design.md`.

| Archivo | Tarea | Contenido |
|---|---|---|
| `20261124000001_base.sql` | — | `audit_events`, `audit_row()`, `set_updated_at()`, permisos por defecto |
| `20261124000002_identity.sql` | DB-01 | perfil, metas, preferencias, lesiones, cuestionario y consentimientos |
| `20261124000003_training.sql` | DB-02 | planes, días, ejercicios, sesiones, series, cargas, temporizadores, `submit_session()` |
| `20261124000004_nutrition_progress.sql` | DB-03 | metas nutricionales, registro alimentario, minuta, mediciones, objetivo de peso, `data_requests` |
| `20261124000005_complete_onboarding.sql` | AU-01 | RPC `complete_onboarding()` atómica e idempotente; `EXECUTE` revocado a `anon` |
| `20261126000006_save_workout_plan.sql` | SY-03 | RPC `save_workout_plan()` atómica: archiva el plan activo e inserta el nuevo con días, ejercicios y traza |
| `20261126000007_nutrition_writes.sql` | SY-04 | `food_logs.position` y RPC `save_meal_plan()` atómica |

## Convenciones

- Toda tabla privada lleva `user_id` (por defecto `auth.uid()`), RLS activo y políticas
  `to authenticated` con `(select auth.uid()) = user_id`. `anon` no tiene permisos.
- Crear o editar datos de salud exige `public.has_health_consent()` (CA-11).
- Las tablas hijas repiten `user_id` y usan una FK compuesta `(parent_id, user_id)`.
- Historial: las tablas append-only solo conceden SELECT e INSERT; las editables se
  auditan con el trigger `audit_row()`. Los permisos por columna limitan qué se edita.
- Valores enumerados como `text` con `CHECK`, alineados con los tipos de los motores.
- Ejercicios y alimentos no están en la base: se guardan sus identificadores y la versión
  del catálogo.

## Agregar una tabla

1. `npx supabase migration new <nombre> --workdir backend` y escribir la tabla, sus
   permisos, RLS y triggers siguiendo las convenciones.
2. Escribir su prueba de acceso cruzado en `../tests/database/`.
3. Sumarla al manifiesto de `../tests/database/99_coverage.test.sql`; sin eso CI falla.
4. `npm run db:test`.
