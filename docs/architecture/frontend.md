# Frontend: primer paso visual

La referencia de composición es `Sin título.pdf`. Este corte implementa el sistema
visual compartido, la navegación y la pantalla de Inicio. La lógica funcional y el
backend siguen el alcance previamente acordado.

## Responsabilidades

```text
frontend/src/
├── app/                         Rutas, parámetros y conexión con navegación
├── components/
│   ├── ui/                      Texto, botón, tarjeta y barra de progreso
│   ├── AppHeader.tsx            Encabezado compartido
│   └── Screen.tsx               Contenedor, ancho y desplazamiento
├── features/home/
│   ├── HomeScreen.tsx           Composición de Inicio
│   ├── components/             Entrenamiento, energía/macros y adherencia
│   ├── home.types.ts           Datos necesarios para presentar Inicio
│   └── home.preview.ts         Fixture y estado vacío
├── theme/
│   ├── tokens.json             Colores, espacios, radios y dimensiones
│   ├── index.ts                Tipografías y exports tipados
│   └── fonts.ts                Fuentes locales empaquetadas
├── lib/                         Clientes técnicos existentes
└── storage/                     Persistencia local existente
```

La ruta conecta las acciones de Inicio con Expo Router. `HomeScreen` y sus secciones
reciben datos y callbacks; no consultan Supabase, no persisten ni generan planes.
Los componentes `ui` no importan funcionalidades específicas. Los próximos flujos
añadirán sus casos de uso y acceso a datos cuando esas operaciones se implementen.

Los tokens JSON se usan tanto desde los estilos nativos como desde Tailwind, de
modo que las pantallas existentes comparten la misma paleta.

## Vista previa

En desarrollo, Inicio utiliza los datos de ejemplo del mockup e incluye una etiqueta
explícita. `/?preview=empty` permite revisar el estado vacío. En producción siempre
se muestra el estado sin datos hasta conectar una fuente real. El avatar de muestra
solo se utiliza en desarrollo; proviene de la referencia HTML entregada por el usuario.

La acción de entrenamiento abre la sesión de ejemplo del segundo corte visual.
La pestaña Alimentación abre el diario del cuarto corte visual. Registrar comida
en Inicio abre el formulario del tercer corte; su confirmación actualiza el diario
y el balance de hoy en Inicio. Los ejemplos solo existen en memoria y están rotulados.

El módulo de sesión se detalla en [arquitectura de entrenamiento](training.md).
El registro de alimentos se detalla en [arquitectura de alimentación](nutrition.md).

## Controles nativos

Los controles con StyleSheet usan `AppPressable`. Desactiva la conversión CSS de
NativeWind en ese límite para conservar los callbacks nativos de estado pulsado.
En Android, procesarlos como objetos de estilo borraba fondos, tamaños y filas:
los botones blancos y el banner quedaban casi invisibles. Los controles que usan
`className` conservan el Pressable de NativeWind (por ejemplo, conexión de desarrollo).
`AppPressable` excluye `className` de sus props para evitar mezclar ambos caminos.

Las pestañas mantienen las etiquetas completas para accesibilidad. En ventanas
estrechas o con texto grande muestran «Entreno» y «Comidas»; la barra aumenta su
altura con la escala de fuente. No se desactiva el escalado del texto del sistema.
Los diálogos permiten desplazamiento y los editores de series redistribuyen sus
campos en teléfonos, con más espacio para valores numéricos.

## Verificación

TypeScript y lint del frontend, pruebas existentes y exportación Android/web.
Revisión en navegador a 320, 390 y 1440 px, fuentes cargadas, estado vacío y accesos
principales. La exportación Android no sustituye la ejecución en un dispositivo.

Captura de la vista previa: [Inicio — paso 1](../design/step-01-home.png).


El quinto corte incorpora la pantalla de Progreso, documentada en
[arquitectura de progreso](progress.md). Comparte el calendario de Santiago con
Alimentación mediante `src/shared/calendar.ts`; las exportaciones anteriores del
dominio alimentario se conservan para compatibilidad.
