# Base inicial — SRS v1.1

- Monorepo npm: `frontend`, `backend` y `packages/contracts`.
- Frontend: Expo SDK 57, React Native, Expo Router y NativeWind 4.2.7.
  SDK 57 se eligió por el soporte explícito de NativeWind 4.2.7.
- `frontend/src/app` solo contiene rutas. Componentes, clientes y almacenamiento
  viven fuera de ese directorio. TanStack Query administra solicitudes remotas;
  Zustand está instalado para el estado local de los futuros flujos.
- Backend: Hono, Zod y OpenAPI 3.1. El mismo `createApp` se usa en Deno local y
  Supabase Edge Functions. `api/deno.json` es el mapa de imports de ambos modos.
- Contratos: TypeScript y Zod compartidos, sin importar el backend desde la app.
- Supabase Auth: el servidor verifica el token con `getUser`; nunca confía en un
  UUID recibido del cliente. `/v1/me` solo devuelve la identidad en esta etapa.
- Credenciales móviles: SecureStore; la vista web de desarrollo no persiste sesiones.
  Antes de implementar login se conectará la renovación de sesión al ciclo de vida
  móvil. El esquema `strongerfit` sirve a navegación; recuperación de acceso deberá
  usar App Links HTTPS verificados según RNF-24.
- SQLite: punto de apertura preparado. Borradores, migraciones locales, cola e
  idempotencia se implementarán con RF-07/17.
- No hay tablas privadas todavía. RLS y sus pruebas serán parte de cada migración
  de dominio; esta entrega no afirma cumplir RNF-04.
- Los motores están reservados, sin algoritmos ficticios. Su cobertura mínima del
  80 % se exigirá cuando exista implementación.

## Próximo corte funcional

Registro/login, onboarding, consentimiento y perfil con tablas, RLS y pruebas de
aislamiento. Después, catálogo y motor de entrenamiento. Antes de esos cambios se
deben precisar las diferencias de prioridad del offline, los criterios pendientes y
el versionado de catálogos identificado en la revisión del SRS.

## Referencias de configuración

- https://docs.expo.dev/router/installation/
- https://docs.expo.dev/guides/monorepos/
- https://www.nativewind.dev/docs/getting-started/installation
- https://supabase.com/docs/guides/functions/dependencies
- https://hono.dev/docs/getting-started/supabase-functions
