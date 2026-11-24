# Cuenta y persistencia (AU-01, SY-01 a SY-04) — diseño

Fecha: 2026-11-24 · Fase 2 del cronograma · Hito H-2 ("un usuario real usa la app y sus
datos sobreviven a reinstalar")

Depende de: `docs/superpowers/specs/2026-11-24-database-rls-design.md` (esquema DB-01 a DB-04).

## Alcance

- **AU-01:** flujo de cuenta obligatorio con guardas de ruta, renovación del token según
  AppState y cierre de sesión que limpia caché y borrador.
- **SY-01:** capa de datos común (cliente tipado, errores, caché persistida, estados de carga
  y sin conexión).
- **SY-02 a SY-04:** cada dominio deja de vivir en memoria y lee y escribe en Supabase.

Fuera de alcance:
- **AU-02** (recuperación con App Links): bloqueada por P-03, porque no hay dominio. Mientras
  tanto, "Olvidé mi contraseña" solo envía el correo.
- Sincronización offline completa (V1-02), foto de perfil en Storage y sueño (V1-01).

## Decisiones

1. **Cuenta obligatoria.** Se elimina el modo "solo en el dispositivo" sin claves de Supabase.
   En desarrollo se usa el stack local (`npm run supabase:start`).
2. **Sin conexión en la v0: lectura desde caché, escritura con conexión.** La caché de
   TanStack Query se persiste en el teléfono. Las escrituras fallan con un error claro y
   "Reintentar". Excepción: la sesión de entrenamiento se envía desde el borrador SQLite y se
   reintenta (RNF-06, CA-03).
3. **TanStack Query es la fuente del estado del servidor.** Los stores Zustand de datos
   persistentes desaparecen; los reducers puros quedan para formularios y UI.
4. **Escrituras multi-tabla por RPC.** El onboarding usa `complete_onboarding(payload)` y la
   sesión usa `submit_session(payload)`, que ya existe. Ambas son `security invoker`.

## AU-01 · Flujo de cuenta

### Guardas

`RootLayout` combina la sesión (`useAuthSession`) con el estado del perfil
(`useProfileStatus`: existe fila en `profiles` y `current_consents` tiene `health-data`
otorgado). Usa `Stack.Protected` de Expo Router:

| Estado | Rutas permitidas |
|---|---|
| cargando sesión o estado del perfil | pantalla de carga |
| sin sesión | `welcome`, `account` |
| con sesión, sin perfil o sin consentimiento vigente | `onboarding` (si ya hay perfil, abre el paso de consentimiento) |
| con sesión y perfil completo | pestañas y demás pantallas |

Orden: Bienvenida → Registro/Login → Onboarding → Inicio. Se elimina el `Redirect` de
`src/app/(tabs)/_layout.tsx`.

### Token

`autoRefreshToken: true`. Un listener de `AppState` llama `auth.startAutoRefresh()` al
volver a `active` y `auth.stopAutoRefresh()` al salir. Si el refresh falla, el evento
`SIGNED_OUT` dispara la limpieza.

### Cierre de sesión

Se ejecuta en `signOut()`, al eliminar la cuenta y cuando `onAuthStateChange` informa otro
usuario:

1. `queryClient.clear()` y borrado de la caché persistida.
2. Borrado del borrador de sesión (SQLite) y de las claves por usuario en `key_values`.
3. `auth.signOut()`.

### Configuración

`frontend/.env.example` documenta el stack local:
`EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` (web) o `http://10.0.2.2:54321`
(emulador), y la anon key de `npx supabase status`. Los correos de confirmación se leen en
Inbucket (`http://127.0.0.1:54324`). Sin claves, la app muestra una pantalla de
configuración faltante.

## SY-01 · Capa de datos

### Tipos

`npx supabase gen types typescript --local --workdir backend` genera
`packages/contracts/src/database.types.ts`. El cliente es `SupabaseClient<Database>`. El job
`database` de CI regenera el archivo y falla si difiere del commiteado.

### Estructura

```
frontend/src/lib/data/
  client.ts       db(): SupabaseClient<Database>; requireUserId(): Promise<string>
  errors.ts       DataError, toDataError(error: unknown): DataError, dataErrorMessage(e): string
  query.ts        createQueryClient(), userKey(userId, ...parts), persister y onlineManager
  QueryState.tsx  carga, error y sin conexión con "Reintentar"
frontend/src/features/<dominio>/data/
  <dominio>.repository.ts   funciones async; validan con Zod la fila leída y el dominio antes de escribir
  <dominio>.mappers.ts      funciones puras fila ↔ dominio
frontend/src/features/<dominio>/use<Algo>.ts   useQuery / useMutation sobre el repositorio
```

### Errores

| `DataError.kind` | Origen | Comportamiento |
|---|---|---|
| `offline` | `fetch` falla o NetInfo sin red | "Sin conexión. Lo que ves puede no estar al día." + Reintentar |
| `session` | 401 o JWT inválido | cierre de sesión y vuelta a Bienvenida |
| `consent` | 42501 en escritura | navega al paso de consentimiento |
| `conflict` | 23505 | mensaje del dominio |
| `invalid` | 23514 o error de Zod | "Revisa los datos" |
| `unknown` | otro | "Algo falló. Inténtalo de nuevo."; log sin datos sensibles (RNF-19) |

### Caché y conexión

- `PersistQueryClientProvider` con `createAsyncStoragePersister` sobre `key_values` (SQLite);
  `maxAge` de 7 días; `buster` = `userId:schemaVersion`. En web no se persiste.
- Claves de query: `['u', userId, dominio, ...]`.
- `@react-native-community/netinfo` alimenta `onlineManager`.
- Mutaciones: requieren conexión, invalidan las claves del dominio al terminar y no son
  optimistas en la v0.

### Dependencias nuevas (MIT)

`@tanstack/react-query-persist-client`, `@tanstack/query-async-storage-persister`,
`@react-native-community/netinfo`.

### Pruebas

- Unitarias (vitest, en `npm test`): mappers, `toDataError`, lógica de guardas.
- Integración (`npm run test:integration`): los repositorios contra el stack local con RLS
  real, con dos usuarios creados por la Admin API. Corren en el job `database` de CI con
  `supabase start` sin los servicios innecesarios.

## SY-02 · Identidad

| Hoy | Pasa a |
|---|---|
| `complete-onboarding` | RPC `complete_onboarding(payload)` (migración nueva + pgTAP): consentimiento, cuestionario, perfil, meta, preferencias, lesiones, primer pesaje y objetivo de peso en una transacción |
| `update-personal` | `profiles` UPDATE; días, minutos y meta → fila nueva en `user_goals` |
| `update-nutrition` | `user_preferences` UPDATE |
| `update-training-setup` | fila nueva en `user_goals` + altas y `resolved_at` en `user_injuries` |
| otorgar o retirar consentimiento | `consents` INSERT; la guarda reacciona (CA-11) |
| `healthFlags` | `health_screenings`; `has_risk` alimenta el motor nutricional (BR-19) |
| foto de perfil | sigue local en `key_values` |

## SY-03 · Entrenamiento

| Hoy | Pasa a |
|---|---|
| `set-training-plan` | `workout_plans` + `workout_days` + `workout_exercises` (archiva el anterior) + `recommendation_runs` |
| `update-plan-exercise` | `workout_exercises` UPDATE |
| terminar la sesión | `submit_session` con el `client_id` del borrador; el borrador se borra al recibir el id. Si falla, Inicio muestra la sesión pendiente con Reintentar |
| `record-load-decision` | `load_suggestions` (insert al sugerir, update al decidir) + `recommendation_runs` |
| `nextLoads`, `consume-next-loads` | derivados: última sugerencia `applied` o `modified` posterior a la última sesión con ese ejercicio |
| historial, récords, `record-workout` | consultas sobre `workout_sessions` y `performed_sets` |
| temporizador por ejercicio | `timer_presets` |

Prueba manual del cronograma: cerrar la app a mitad de sesión y reintentar el envío dos veces.

## SY-04 · Nutrición y progreso

| Hoy | Pasa a |
|---|---|
| `set-nutrition-plan` | `nutrition_targets` + `recommendation_runs` |
| diario (`add`, `update`, `delete-meal`) | `food_logs` con snapshot y procedencia |
| `set-meal-plan`, intercambios | `meal_plans` + `planned_meals`; intercambio = UPDATE de `items` |
| `record-weight` | `body_measurements` (upsert por día) |
| objetivo de peso | `weight_goals` |
| Inicio y Progreso | leen las queries reales; datos de vista previa solo con `__DEV__` y modo vista previa explícito en `dev-status` |

`ProfileData` deja de ser un blob: cada pantalla usa los hooks de su dominio. La lógica pura
ya probada de los reducers se conserva como funciones de dominio.

## Criterio de terminado (H-2)

- Registro → onboarding → Inicio funciona contra el stack local; cerrar sesión e iniciarla
  de nuevo, o reinstalar, conserva los datos.
- Otra cuenta en el mismo teléfono no ve nada de la anterior.
- `npm run check`, `npm run db:test` y `npm run test:integration` en verde.
