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

Las acciones principales navegan a Entrenar y Alimentación, que mantienen su aviso
de funcionalidad pendiente. No se simula un guardado ni el inicio de una sesión.

## Verificación

TypeScript y lint del frontend, pruebas existentes y exportación Android/web.
Revisión en navegador a 320, 390 y 1440 px, fuentes cargadas, estado vacío y accesos
principales. La exportación Android no sustituye la ejecución en un dispositivo.

Captura de la vista previa: [Inicio — paso 1](../design/step-01-home.png).
