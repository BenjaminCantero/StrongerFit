# Fundación de cuenta y datos (AU-01 + SY-01) — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cuenta obligatoria con guardas de ruta y una capa de datos común (cliente tipado, errores, caché persistida) sobre la que se construyen SY-02 a SY-04.

**Architecture:** Expo Router `Stack.Protected` decide las rutas según sesión y estado del perfil. Los repositorios hablan con Supabase (`SupabaseClient<Database>`), validan con Zod y exponen hooks TanStack Query. El onboarding se guarda con la RPC `complete_onboarding`.

**Tech Stack:** Expo SDK 58, Expo Router, supabase-js 2.118, TanStack Query 5, Zod 4, vitest, pgTAP.

**Spec:** `docs/superpowers/specs/2026-11-24-account-persistence-design.md`

## Global Constraints

- Solo la anon key en el cliente; nunca `service_role` (RNF-13).
- Mensajes en español de Chile; sin tokens ni datos de salud en logs (RNF-05, RNF-19).
- Dependencias nuevas solo con licencia MIT.
- `npm run check`, `npm run db:test` y `npm run test:integration` en verde al cerrar cada tarea que los toque.
- Cambio respecto de la spec: `complete_onboarding` se implementa aquí (no en SY-02) porque la guarda la necesita.

---

### Task 1: Dependencias y tipos generados
- `npx expo install @react-native-community/netinfo` y `npm i -w @strongerfit/frontend @tanstack/react-query-persist-client @tanstack/query-async-storage-persister`.
- Script raíz `db:types` → `packages/contracts/src/database.types.ts`; `contracts` exporta `Database`.
- CI `database`: regenerar tipos y `git diff --exit-code`.
- Commit `build(app): add query persistence deps and generated DB types`.

### Task 2: Errores y utilidades de datos (`frontend/src/lib/data/`)
- Pruebas primero: `errors.test.ts` (cada código → `kind`, mensajes), `query.test.ts` (`userKey`).
- `errors.ts`, `client.ts`, `query.ts` (QueryClient, persister sobre `key_values`, `onlineManager` con NetInfo), `QueryState.tsx`.
- Commit `feat(app): add data layer errors, client and query cache (SY-01)`.

### Task 3: RPC `complete_onboarding`
- pgTAP primero (`40_onboarding.test.sql`): escribe las 8 tablas en una transacción; sin `consent_version` falla; reintento con perfil existente falla con 23505 y no deja filas a medias; B no puede escribir a nombre de A.
- Migración `20261124000005_complete_onboarding.sql`.
- Regenerar tipos. Commit `feat(db): add complete_onboarding RPC`.

### Task 4: Repositorio de cuenta y onboarding
- Pruebas primero: `onboarding.mappers.test.ts` (resultado de `completeOnboarding` → payload RPC), `account-status` (perfil + consentimiento → `'ready' | 'needs-onboarding' | 'needs-consent'`).
- `features/account/data/account.repository.ts`: `fetchAccountStatus()`, `saveOnboarding(payload)`; hooks `useAccountStatus()`, `useSaveOnboarding()`.
- Commit `feat(app): persist onboarding and read account status`.

### Task 5: Ciclo de sesión y guardas (AU-01)
- `lib/supabase.ts`: `autoRefreshToken: true`, listener `AppState`.
- `features/account/session.ts`: `endSession(queryClient)` limpia caché persistida, borrador y `key_values`; se llama en `signOut`, `deleteAccount` y cambio de usuario.
- `app/_layout.tsx`: `Stack.Protected` por estado; pantalla de configuración faltante; quitar `Redirect` de `(tabs)/_layout.tsx`; quitar modo local de Bienvenida y Cuenta; onboarding guarda con `useSaveOnboarding`.
- Pruebas unitarias de la función pura `routeAccess(state)`.
- Commit `feat(app): require an account with route guards (AU-01)`.

### Task 6: Pruebas de integración
- `vitest.integration.config.ts`, script `test:integration`; helper que crea usuarios con la Admin API local (clave de servicio solo en el proceso de prueba, leída de `supabase status`).
- `account.repository.integration.test.ts`: A completa onboarding y ve `ready`; B ve `needs-onboarding` y no lee datos de A; retirar consentimiento → `needs-consent`.
- CI `database`: `supabase start` con exclusiones, exportar URL y claves de `supabase status -o env`, correr `test:integration`.
- `.env.example` y README con el stack local.
- Commit `test(app): run repository integration tests against local Supabase`.
