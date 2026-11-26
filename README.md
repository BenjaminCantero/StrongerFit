# StrongerFit

App móvil de entrenamiento y nutrición descrita en `SRS_Entrenamiento_Nutricion_MVP_v1.3.docx`.
Android-first, con Expo, Supabase (Auth, PostgreSQL con RLS y Edge Functions) y una API Hono.

## Requisitos

- Node.js 24 LTS y npm (versión fijada en `.nvmrc`).
- Deno 2.9.6 para ejecutar y verificar la API.
- Docker para el stack local de Supabase (`npm run supabase:start`), necesario para las
  pruebas de base de datos y de integración.
- Expo Go compatible con Expo SDK 58, o Android Studio con un emulador, para probar la app.

## Arranque rápido

Todos los comandos se ejecutan desde la raíz del repositorio.

```sh
npm ci
npm start
```

`npm start` abre Expo para el frontend. No ejecutar `npx expo start` en la raíz: allí no
hay app Expo; usar `cd frontend` antes de cualquier comando `npx expo`. La vista web de
desarrollo se abre con `npm run dev:web`.

La cuenta es obligatoria. `frontend/.env` define a qué Supabase se conecta la app:

- Nube: `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` del proyecto, y
  `EXPO_PUBLIC_API_URL` apuntando a la Edge Function `api`
  (`https://<proyecto>.supabase.co/functions/v1/api`). Funciona desde Expo Go en cualquier red.
- Local: los valores de `frontend/.env.example` con `npm run supabase:start`. Los correos de
  confirmación se leen en Mailpit (`http://127.0.0.1:54324`).

Solo van claves públicas (anon o publishable); nunca `service_role` en el frontend.
Reiniciar Expo con `npx expo start -c` (desde `frontend`) al cambiar variables.

Para abrir la app en Expo Go desde otra red contra un backend local, iniciar un túnel con
`cd frontend && npx expo start --go --tunnel`.

En desarrollo, la pantalla Conexión de desarrollo (`/dev-status`) comprueba la API y permite
mostrar u ocultar datos de ejemplo. Los builds propios que usen HTTP local necesitan
`APP_VARIANT=development` (por ejemplo `APP_VARIANT=development npx expo run:android` desde
`frontend`); los builds normales bloquean tráfico HTTP.

## Estructura

```text
frontend/src/app/             Rutas y navegación con Expo Router
frontend/src/features/        Pantallas, dominio y datos por funcionalidad
frontend/src/lib/data/        Capa de datos: cliente Supabase, errores, caché, ids
frontend/src/storage/         SQLite (borrador y sesión pendiente) y valores locales
backend/src/                  API Hono, validación y autenticación
backend/supabase/functions/   Edge Function `api` (adaptador de la API Hono)
backend/supabase/migrations/  Esquema SQL con RLS y RPC
backend/supabase/tests/       Pruebas pgTAP de RLS y RPC
packages/contracts/           Esquemas Zod y tipos generados de la base
packages/training-engine/     Reglas de entrenamiento: catálogo, plantillas, cargas
packages/nutrition-engine/    Reglas de nutrición: metas, catálogo de alimentos, minuta
docs/                         Arquitectura, specs, planes y cronograma
```

Los datos de la persona viven en Supabase. TanStack Query es la fuente del estado del
servidor y su caché se persiste en el teléfono para leer sin conexión. La sesión de
entrenamiento se guarda como borrador en SQLite y se envía al terminar; si no hay conexión,
queda pendiente y se reintenta.

Funciones pospuestas a la versión 1.1 (sueño, escáner de códigos y foto de comida) siguen en
el código detrás de `frontend/src/shared/features.ts`.

## API

| Ruta | Resultado |
| --- | --- |
| `GET /v1/health` | Disponibilidad del proceso, sin consultar PostgreSQL |
| `GET /openapi.json` | Contrato OpenAPI 3.1 generado a partir de los esquemas |
| `GET /v1/me` | Identidad `{ id }` verificada con Supabase Auth |
| `DELETE /v1/me` | Elimina la cuenta propia (requiere `SUPABASE_SERVICE_ROLE_KEY` en el servidor) |

Los errores usan `application/problem+json`. La verificación de JWT del gateway está
desactivada (`config.toml`) para que health y OpenAPI sean públicos; cada ruta privada usa
`requireAuth`, que valida el token con Supabase Auth.

Para correr la API fuera de Supabase: `cp backend/.env.example backend/.env`, completar las
variables y ejecutar `npm run dev:backend` (escucha en `http://localhost:8000`).

## Supabase local

```sh
npm run supabase:start   # stack local
npm run supabase:serve   # Edge Function api
npm run db:types         # regenera packages/contracts/src/database.types.ts
npm run supabase:stop
```

Cada tabla nueva lleva RLS, su prueba de acceso cruzado en `backend/supabase/tests/database/`
y su entrada en el manifiesto `99_coverage.test.sql`. Detalle en
[migraciones](backend/supabase/migrations/README.md).

## Verificación

```sh
npm run check              # TypeScript, Deno, lint y Vitest
npm run db:test            # migraciones desde cero, lint de SQL y pgTAP
npm run test:integration   # repositorios contra Supabase local (RLS real)
```

GitHub Actions repite los controles, aplica las migraciones desde cero y corre las pruebas
de RLS.

## Documentación

- [Arquitectura inicial](docs/architecture/initial.md)
- Specs y planes de implementación en `docs/superpowers/`
- Cronograma en `docs/planning/Cronograma_StrongerFit.xlsx`
