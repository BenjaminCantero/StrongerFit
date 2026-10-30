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
