    # Validación de la base inicial

29 de octubre de 2026.

- `npm run check`: TypeScript, Deno y lint aprobados; 12 pruebas Vitest aprobadas.
- Expo Doctor: 21 de 21 verificaciones aprobadas.
- Exportación de bundles Android y web: aprobada.
- Navegador Chromium a 390 × 844 y 1440 × 900: interfaz revisada visualmente,
  navegación a Entrenar comprobada y sin excepciones de ejecución.
- Pantalla de conexión: solicitud real desde la app web a Deno en el puerto 8000,
  respuesta del contrato de health y estado de éxito visibles.
- `npm ci --dry-run --ignore-scripts`: lockfile consistente.

No se ejecutó un APK/emulador Android, Supabase local completo ni un proyecto
remoto. No hay credenciales configuradas ni migraciones de dominio aplicadas.
La validación de Auth en Vitest usa mocks; faltan las pruebas reales de sesión y
RLS cuando se implemente el primer flujo persistente.

Avisos de paquetes pendientes: [dependencias](dependencies.md).

## H-2 · Datos que sobreviven a reinstalar

Criterio de salida SRS 11.3: una persona real usa la app y sus datos siguen ahí
después de desinstalarla y reinstalarla. La prueba automatizada
`frontend/src/features/account/data/reinstall.integration.test.ts` cubre la capa
de datos (un cliente nuevo sin sesión ni caché lee lo mismo que el anterior y no
ve datos de otra persona). Esta guía cubre la app real en un teléfono.

### Requisitos

- Teléfono Android 10 o superior con Expo Go o un build de StrongerFit
  (guía de builds: [builds.md](builds.md)).
- Backend Supabase accesible desde el teléfono: el stack local en la misma red
  (`npm run supabase:start`, URL `http://IP_LAN_DE_TU_PC:54321`) o un proyecto
  alojado.
- `frontend/.env` con `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  (clave pública anon/publishable) y `EXPO_PUBLIC_API_URL`. NUNCA pongas
  `service_role` ni la clave secreta en el frontend.
- Una cuenta nueva con un correo que puedas confirmar (en local, Mailpit en
  `http://IP_LAN_DE_TU_PC:54324`).
- Anota los valores que ingreses; los compararás al final.

### Pasos

1. Registrarse con correo y contraseña y confirmar el correo.
   Esperado: la app permite iniciar sesión y lleva al onboarding.
2. Completar el onboarding (datos personales, objetivo, entrenamiento, objetivo
   de peso, consentimiento).
   Esperado: termina sin error y entra a Inicio.
3. En Entrenar, generar la rutina y editar un ejercicio (series o nota).
   Esperado: la rutina se muestra y el ejercicio editado conserva el cambio.
4. Registrar una sesión completa con temporizador (descanso o intervalo) y
   terminarla.
   Esperado: la sesión aparece en el historial con su volumen; el temporizador
   corre y termina.
5. En Nutrición, registrar al menos un alimento en el diario.
   Esperado: el alimento y sus totales del día aparecen.
6. Generar la minuta e intercambiar un alimento.
   Esperado: la minuta muestra el alimento nuevo y los totales del día se
   recalculan.
7. Registrar un pesaje y abrir el gráfico del objetivo de peso.
   Esperado: el gráfico muestra el pesaje junto al peso inicial y la meta.
8. Abrir Inicio y Progreso.
   Esperado: ambos muestran datos de entrenamiento y de nutrición/peso
   relacionados. Anota lo que ves (sesiones, kcal, peso).
9. Desinstalar la app del teléfono (si usas Expo Go, borra también sus datos o
   cierra la sesión y reinicia Expo Go).
   Esperado: no queda sesión local.
10. Reinstalar la app e iniciar sesión con la misma cuenta.
    Esperado: entra directo a Inicio, sin repetir el onboarding.
11. Revisar cada dato anterior: perfil y objetivos, rutina con el ejercicio
    editado, historial con la sesión, temporizador guardado, diario, minuta con
    el intercambio, pesajes y gráfico, Inicio y Progreso.
    Esperado: todo aparece igual que antes de desinstalar.
12. Aislamiento: iniciar sesión con una segunda cuenta nueva.
    Esperado: no ve ningún dato de la primera cuenta.

### Registro de la prueba

| Campo | Valor |
| --- | --- |
| Fecha | |
| Dispositivo | |
| Versión de Android | |
| Expo Go / dev build (versión) | |
| Backend (local / alojado) | |
| Resultado (aprobada / con defectos) | |
| Pasos fallidos | |
| Defectos encontrados | |

## BL-01 · Builds de Android

Procedimiento de builds locales con EAS y checklist en teléfono real (incluye la
medición del aviso del temporizador, CA-20): [builds.md](builds.md).
