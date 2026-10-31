# Bienvenida y onboarding

Primer flujo de la app (RF-02, RF-22, CA-11). Sin perfil completo, las pestañas
redirigen a `/welcome` (BR-02). Al eliminar los datos locales se vuelve a este flujo.

```text
features/onboarding/
├── domain/onboarding.ts        Borrador, validación por paso, ritmo de peso y cierre
├── domain/onboarding.test.ts   CA-11, CA-21 (ritmo), BR-20, rangos del perfil
├── components/                 ChoiceChips, CheckRow y los cinco pasos
├── WelcomeScreen.tsx
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
