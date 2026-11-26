# Bienvenida y onboarding

Primer flujo de la app (RF-02, RF-22, CA-11). Sin perfil completo, las pestañas
redirigen a `/welcome` (BR-02). Al eliminar los datos locales se vuelve a este flujo.

## Orden del flujo (AU-01): onboarding primero, cuenta al final

```text
Sin sesión:  Bienvenida -> Comenzar -> Onboarding (5 pasos, aviso de salud, consentimiento)
             -> Crear cuenta (/account?mode=signup) -> confirmar correo -> iniciar sesión
             -> el perfil se guarda solo (pantalla "Guardando tu perfil") -> Inicio
"Ya tengo cuenta" -> /account?mode=signin directo, sin onboarding.
Con sesión y cuenta sin perfil, sin pendiente local -> onboarding y guardado directo.
```

Razón: la persona ve el valor de la app y entrega sus datos antes de comprometerse con una
cuenta. Costo: los datos de salud viven un tiempo en el teléfono sin cuenta (ver abajo).

### Onboarding pendiente (local)

- Qué guarda: `{ version: 2, savedAt, email?, payload }`, con `payload` = el mismo `OnboardingPayload`
  que recibe la RPC `complete_onboarding`.
- Dónde: `storage/pendingOnboarding.ts` (web, `localStorage`, clave sin prefijo `strongerfit.`)
  y `.native.ts` (SQLite, tabla `session_drafts`, id `pending-onboarding`). La lectura con
  validación Zod y caducidad está en `features/account/pendingOnboarding.ts`.
- Ligado al correo: al enviar Crear cuenta (solo signup, no Iniciar sesión), `submitAuth` guarda en el pendiente el
  correo normalizado (trim y minúsculas) antes de llamar a Supabase; si se reintenta con otro correo se
  sobrescribe. Al guardar, `useFinishPendingOnboarding` compara ese correo con el de la sesión: solo si
  coincide se guarda. Si falta o difiere (otra persona en el mismo teléfono) se descarta sin guardar y
  se muestra el onboarding normal de esa cuenta. Un pendiente `version: 1` se descarta.
- Caduca a los 7 días: al leer, un pendiente vencido, dañado, de otra versión o con fecha futura se
  borra y se ignora (minimización de datos de salud sin cuenta, SRS 11.4, RNF-05).
- Se borra: al guardarse en la cuenta (también si la RPC devuelve `false`), al descartarlo
  ("Completar de nuevo"), al expirar, al salir del onboarding sin cuenta ("Volver") y en
  `signOutAndPurge`. `purgeLocalData` NO lo borra: corre al entrar la cuenta, justo después de
  crearlo, y lo perdería.
- Guardado automático: `useFinishPendingOnboarding` (usado por `AppStack`) actúa solo con
  `status === 'needs-onboarding'` y hace un único intento por pendiente. Si falla, muestra
  "No pudimos guardar tu perfil" con Reintentar y Completar de nuevo. Con la cuenta ya con perfil,
  descarta el pendiente sin sobrescribir nada. No usa `<Redirect>`: al quedar la cuenta `ready`
  las guardas de ruta llevan a Inicio.

```text
features/onboarding/
├── domain/onboarding.ts        Borrador, validación por paso, ritmo de peso y cierre
├── domain/onboarding.test.ts   CA-11, CA-21 (ritmo), BR-20, rangos del perfil
├── components/                 ChoiceChips, CheckRow y los cinco pasos
├── WelcomeScreen.tsx          Comenzar -> /onboarding; Ya tengo cuenta -> /account
└── OnboardingScreen.tsx
```

Pasos: sobre ti (edad, sexo, altura, peso, actividad), entrenamiento (objetivo,
nivel, perfil de deportista, días, minutos, equipamiento), objetivo de peso
(opcional), alimentación (exclusiones) y salud y confirmación.

- Días validados contra el perfil de deportista (SRS 8.10): general 2–5, fuerza e
  hipertrofia 3–6.
- Objetivo de peso: meta y plazo en semanas; si el ritmo supera 1 % del peso
  inicial por semana se exige confirmación y se informa que no habrá
  recomendación automática (BR-20, BR-12).
- Salud: aviso leído, cuestionario de aptitud con «Ninguna aplica» explícito y
  consentimiento obligatorio. Cualquier condición declarada muestra derivación
  y queda en `healthFlags` para limitar planes futuros (BR-19).
- El consentimiento guarda versión y fecha. Perfil muestra ambos como vigentes.

El resultado se guarda en el perfil local en memoria (`onboarding`). Sin `.env`
de Supabase no hay registro ni inicio de sesión; la bienvenida lo dice. La foto de
portada reutiliza un recurso entregado con el HTML de Progreso.
