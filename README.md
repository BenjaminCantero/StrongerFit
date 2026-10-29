# StrongerFit

Base inicial del MVP descrito en `SRS_Entrenamiento_Nutricion_MVP_v1.1.docx`.
App móvil Android-first y API TypeScript, con una estructura extensible a iOS.

## Requisitos

- Node.js 24 LTS y npm (versión fijada de Node en `.nvmrc`).
- Deno 2.9.6 para ejecutar y verificar la API.
- Android Studio/emulador o dispositivo compatible con Expo SDK 57 para probar Android.
- Docker solo para ejecutar Supabase local; no hace falta para la API inicial.

## Arranque rápido

Desde la raíz:

```sh
npm ci
cp backend/.env.example backend/.env
npm run dev:backend
```

En otra terminal:

```sh
npm run dev:frontend
```

La API escucha en `http://localhost:8000`. Expo muestra las opciones para abrir
Android. Para la vista web de desarrollo, usar `npm run dev:web`.

Sin archivo `.env` del frontend, la API apunta a `10.0.2.2:8000` en el emulador
Android y a `localhost:8000` en web/iOS. En un teléfono físico, copiar
`frontend/.env.example` a `frontend/.env` y cambiar `EXPO_PUBLIC_API_URL` por la IP
LAN del computador, conectado a la misma red. Reiniciar Expo al cambiar variables.

En Perfil → Comprobar conexión de desarrollo se puede probar la comunicación con
la API y reintentar. Esa pantalla solo está habilitada en desarrollo.

Los builds propios de desarrollo que usen HTTP local necesitan
`APP_VARIANT=development`; por ejemplo `APP_VARIANT=development npx expo run:android`
desde `frontend`. Los builds normales bloquean tráfico HTTP. Expo Go utiliza su
propia configuración nativa, por lo que no sirve para verificar esas restricciones.

## Estructura

```text
frontend/src/app/             Rutas y navegación con Expo Router
frontend/src/components/      Componentes de interfaz
frontend/src/lib/             Clientes de API y Supabase
frontend/src/storage/         Apertura de SQLite
backend/src/                  API Hono, validación y autenticación
backend/supabase/functions/   Adaptador de Supabase Edge Functions
backend/supabase/migrations/  Futuras migraciones SQL y RLS
backend/tests/                Pruebas de API y autorización
packages/contracts/           Esquemas Zod compartidos
packages/training-engine/     Ubicación reservada para reglas de entrenamiento
packages/nutrition-engine/    Ubicación reservada para reglas de nutrición
docs/architecture/            Decisiones y alcance
```

TanStack Query está conectado a la comprobación remota. Zustand está instalado para
el estado local de los futuros flujos. SecureStore es el adaptador de sesión nativa;
SQLite tiene un punto de apertura preparado, sin tablas de dominio todavía.

## API

| Ruta local | Resultado |
| --- | --- |
| `GET /v1/health` | Disponibilidad del proceso, sin consultar PostgreSQL |
| `GET /openapi.json` | Contrato OpenAPI 3.1 generado a partir de los esquemas |
| `GET /v1/me` | Identidad `{ id }` verificada con Supabase Auth |

`/v1/me` devuelve 401 sin sesión, o 503 cuando se envía un token y Supabase aún no
está configurado. Los errores usan `application/problem+json`. Para habilitarlo,
completar `SUPABASE_URL` y `SUPABASE_ANON_KEY` en `backend/.env`. Las variables
equivalentes `EXPO_PUBLIC_SUPABASE_*` preparan el cliente móvil para el futuro login.
Nunca colocar claves `service_role` en el frontend.

## Supabase local

```sh
npm run supabase:start
npm run supabase:serve
```

Health estará en `http://127.0.0.1:54321/functions/v1/api/v1/health` y OpenAPI en
`http://127.0.0.1:54321/functions/v1/api/openapi.json`. El gateway proporciona las
variables de Supabase a la función. Para conectar el frontend, usar como base
`http://10.0.2.2:54321/functions/v1/api` en el emulador, o su equivalente local/LAN.

La comprobación de JWT del gateway se desactiva para permitir health y OpenAPI
públicos. Cada ruta privada debe usar `requireAuth`, que valida el token con
Supabase Auth. Esta configuración no autoriza acceso anónimo a datos privados.

No hay tablas de aplicación todavía. Las primeras migraciones deben incluir RLS y
pruebas de aislamiento. `npm run supabase:stop` detiene los servicios locales.

## Verificación

```sh
npm run check
npm run export --workspace @strongerfit/frontend
cd frontend
npx expo-doctor
```

`check` ejecuta TypeScript, Deno, lint y Vitest. Las pruebas cubren contratos, prefijo
de Edge Functions, autorización, errores, límite de cuerpo, CORS y consumo de la API
por el cliente móvil. La autenticación en estas pruebas usa un mock de Supabase;
no constituye una prueba de integración con una cuenta real ni de RLS.

La exportación genera bundles Android y web; no genera un APK ni verifica ejecución
en un dispositivo. GitHub Actions repite los controles y la exportación.

## Alcance de esta entrega

Navegación inicial en español y pantallas explícitas de funciones pendientes.
Registro/login, onboarding, perfil persistido, consentimiento, rutinas, alimentación,
motores, sincronización, RLS y pruebas Maestro/RTL se implementarán en los siguientes
cortes. El esquema de navegación `strongerfit` no debe usarse para recuperación de
cuenta: el SRS requiere App Links HTTPS verificados para ese flujo.

Decisiones: [arquitectura inicial](docs/architecture/initial.md).
