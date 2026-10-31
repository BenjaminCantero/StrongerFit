# Entrenamiento: sesión de ejemplo

Segundo corte visual, basado en el HTML de sesión de entrenamiento entregado el
30 de octubre de 2026 y en el sistema de diseño compartido.

## Estructura

```text
features/training/
├── domain/session.ts               Estado, transiciones, validación y resúmenes
├── domain/session.test.ts          Pruebas de registro y relojes
├── data/session.preview.ts         Plantilla de ejemplo
├── useTrainingSession.ts           Ciclo de vida del reloj y dispatch
├── format.ts                      Formatos de tiempo y carga
├── TrainingScreen.tsx              Composición, confirmaciones y estado vacío
└── components/
    ├── SessionControls.tsx         Pausar, reanudar y finalizar
    ├── ExerciseCard.tsx            Ejercicio, historial breve y tabla
    ├── SetEditor.tsx               Edición y confirmación de una serie
    ├── RestTimer.tsx               Descanso, extensión y omisión
    ├── SessionDialog.tsx           Diálogo accesible de la funcionalidad
    └── ExerciseDetails.tsx         Técnica e historial ilustrativos
```

La ruta `/training` selecciona la plantilla de desarrollo y conecta la salida con
Expo Router. El dominio es TypeScript puro y no importa React, temporizadores,
almacenamiento ni clientes de red. El hook actualiza la vista; los componentes
envían acciones y presentan el estado.

## Comportamiento

- Registra carga y repeticiones; acepta coma o punto decimal, carga cero y
  repeticiones enteras positivas. Los incrementos de carga son de 1,25 kg.
- Identifica la serie por ejercicio e ID. Una doble confirmación no completa la
  serie siguiente. El cambio de ejercicio conserva las series ya registradas.
- Permite añadir series y cambiar de ejercicio con confirmación si quedan pendientes.
- Pausa sesión y descanso. Los relojes usan marcas absolutas, por lo que la vista
  recupera el tiempo transcurrido aunque no se hayan ejecutado intervalos.
- Finalizar congela los relojes y muestra el volumen de las series completadas.
- El encabezado contextual permite volver a Inicio; la barra inferior se oculta
  durante la sesión. Los controles se redistribuyen en pantallas estrechas.

## Alcance de esta etapa

Los cambios viven en memoria. La interfaz lo indica expresamente y no afirma
guardar borradores, trabajar sincronizada ni enviar notificaciones. La persistencia
local, autenticación, historial real y notificaciones requieren un corte posterior.

El prototipo se habilita solo en desarrollo. `/training?preview=empty` permite
revisar el estado vacío; producción utiliza ese estado hasta conectar una sesión
real. Una recarga reinicia los ejemplos. La rutina semanal no se implementa aquí.

## Verificación

Pruebas del dominio para doble confirmación, invariantes del registro, cambios de
ejercicio, pausa/reanudación, saltos de reloj, descanso y volumen. Navegador a 320,
390 y 1440 px con edición, errores, modal, finalización y navegación desde Inicio.
Exportación Android/web y comprobación de tipos y lint. Falta ejecución en un
dispositivo Android.

Captura: [sesión — paso 2](../design/step-02-training.png).

## Plan semanal

`packages/training-engine` genera el plan desde días, minutos, equipamiento,
nivel y perfil de deportista del onboarding. `features/training/domain/plan.ts`
lo crea desde el perfil y convierte un día en `SessionTemplate`
(series vacías, sin historial ni técnica inventados). El plan se guarda en el
perfil con versión de reglas y de catálogo; las ediciones pasan por
`validateExercise`. La pestaña Entrenar es el plan y la sesión vive en `/session`.

## Temporizadores y borrador

`domain/timers.ts` modela sostén e intervalos con marcas absolutas (CA-20 en pruebas).
`timerAlerts.native.ts` programa notificaciones locales importando solo los
submódulos locales de `expo-notifications`: el índice exige un módulo de push que
Expo Go 57 no trae y rompía la ruta. En Expo Go la creación del canal falla
(NullPointerException interno) y se usa el canal predeterminado. En el emulador el
aviso llegó con ~8 s de desvío (alarma inexacta); falta medirlo en un build propio
frente a los 5 s de CA-20. `timerAlerts.ts` es la versión web, sin avisos.

`domain/draft.ts` valida el borrador con Zod; `storage/sessionDraft.ts` lo guarda en
SQLite (`session_drafts`) o localStorage. Verificado en Android: tras recargar la app
la sesión vuelve con sus series y Entrenar ofrece continuarla o descartarla.

## Carga de la vez anterior

Al finalizar, el registro de la sesión guarda las series completadas por ejercicio del
catálogo (`exercises` en `WorkoutRecord`). Al abrir un día del plan, `sessionFromDay`
precarga cada serie con la carga de la misma serie en la última sesión de ese
ejercicio (o la última serie registrada si ahora hay más), mantiene las repeticiones
del plan y muestra «La vez anterior» con la serie más pesada. Las últimas tres veces
aparecen en el detalle del ejercicio. La persona confirma o ajusta cada serie antes
de completarla; sin registros, la carga parte en 0 kg. No es una progresión automática.
