# Pruebas de base de datos

Pruebas pgTAP de RLS y reglas del esquema (RNF-04, CA-01, CA-10). Corren con la base
local de Supabase (requiere Docker):

```sh
npx supabase db start --workdir backend   # una vez
npm run db:test                           # reinicia la base local, aplica migraciones, lint y pruebas
```

`db:test` ejecuta `supabase db reset`: borra los datos de la base local.

## Archivos

- `database/00_helpers.test.sql`: crea el esquema `tests` y hace COMMIT (corre primero).
  `tests.create_user(email)`, `tests.as_user(uid)`, `tests.as_anon()`, `tests.as_service()`,
  `tests.as_postgres()` y `tests.affected(sql)` (filas afectadas con el rol actual).
- `database/10_identity`, `20_training`, `30_nutrition_progress`: una por migración.
  Cada una corre en `begin ... rollback`.
- `database/99_coverage.test.sql`: toda tabla de `public` tiene RLS, figura en el
  manifiesto y es ilegible para `anon`.

Cada tabla prueba que otra persona (B) no lee, no edita, no borra ni inserta a nombre de
la dueña (A), y que no puede colgar filas en un padre ajeno. No sustituir estas pruebas
por los mocks de autenticación de las pruebas de la API.
