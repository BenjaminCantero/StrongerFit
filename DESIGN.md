# Diseño visual aprobado

El usuario confirmó [Sin título.pdf](<Sin título.pdf>) como diseño visual final
de StrongerFit. Este archivo tiene prioridad sobre la apariencia provisional
implementada y sobre las propuestas visuales anteriores de la conversación.

La lámina incluye diez pantallas: sesión de entrenamiento, registro de alimento,
Inicio, Progreso, Perfil, salud y confirmación del onboarding, bienvenida, rutina
semanal, resumen de entrenamiento y diario alimentario.

Conservar el fondo crema, los verdes, los títulos con serif, el texto de lectura
sans serif, las superficies redondeadas y la navegación inferior de cinco secciones.
El HTML de Stitch previo identifica Literata y Nunito Sans; usar el PDF como
autoridad para la composición final. Las pantallas no representadas deben continuar
este mismo lenguaje visual.

La aprobación visual no cambia el alcance funcional acordado ni adelanta las
funcionalidades futuras del SRS v1.2. Los datos de ejemplo, atribuciones, mensajes
legales y estados de guardado del mockup deben corresponder a la implementación real.

## Implementación por pasos

Paso 1: tema compartido, tipografías, componentes UI, encabezado, navegación e Inicio.
Paso 2: sesión de entrenamiento según el HTML adjunto, con encabezado de retorno,
tabla de series, descanso y panel de técnica/historial; durante la sesión se oculta
la barra inferior. Se conservan el tema y los componentes comunes del primer paso.
Paso 3: registro de alimento con búsqueda, comida, cantidades, macros y
acompañamientos, siguiendo el HTML adjunto. La confirmación permanece fija y la
barra inferior se oculta. Los textos largos se redistribuyen en anchos estrechos.
Paso 4: diario principal de Alimentación con selector de fecha, balance y comidas.
El formulario del paso 3 vive en una ruta aparte; añadir, editar y eliminar actualizan
el diario en memoria. Las cinco pestañas permanecen visibles en el diario. El acceso
a minuta semanal presenta un estado vacío hasta implementar esa funcionalidad.
Las demás pantallas mantienen su aviso de funcionalidad pendiente. Modo Operate:
controles familiares, lectura clara y acciones que responden a la navegación real.

Los tokens implementados viven en `frontend/src/theme/tokens.json` y se comparten
con Tailwind. Fondo `#FAF6F0`, superficie `#F0ECE4`, superficie suave `#F5F1EA`,
texto `#2E3230`, secundario `#6B6358`, verde `#4A7C59` y superficie blanca `#FFFFFF`.
Literata Bold para títulos; Nunito Sans Regular/Semibold/Bold para lectura y controles.
Las cuatro fuentes se empaquetan localmente. Iconos Ionicons coherentes entre pantallas.

Composición móvil de hasta 480 px, margen lateral de 16 px, tarjetas con radio de
28 px y botones de al menos 48 px. El texto conserva el escalado del sistema; las
filas se redistribuyen en anchos estrechos. Los estados no dependen solo del color.

Inicio presenta entrenamiento, energía/macros y adherencia semanal. Los datos de
ejemplo están separados y rotulados en desarrollo; producción utiliza el estado
vacío hasta conectar datos reales. La imagen de perfil de muestra no representa
una cuenta del usuario.

La sesión de entrenamiento utiliza ejemplos separados y estado solo en memoria.
La banda superior lo indica y reemplaza el mensaje de guardado automático del
mockup hasta que exista persistencia. Finalizar pide confirmación y presenta un
resumen de los valores editados en esa vista previa.

El panel de alimentos conserva gramos exactos al alternar unidades, recalcula el
desglose y confirma en memoria los alimentos seleccionados. El catálogo se rotula
como ejemplo, sin atribuciones ni etiquetas de verificación que no estén respaldadas.

La estructura de implementación está descrita en
[arquitectura de frontend](docs/architecture/frontend.md).

## Ajuste nativo de visibilidad

Los controles con estilos nativos pasan por `AppPressable` para evitar que la
conversión CSS de NativeWind elimine los estilos calculados al pulsar en Android.
Se preservan los fondos verdes, la alineación de iconos y texto y las áreas táctiles.
La navegación inferior adapta sus etiquetas y altura a ventanas pequeñas y a la
escala de fuente; los nombres completos permanecen disponibles para accesibilidad.
Los diálogos admiten desplazamiento y los campos de series tienen más ancho.
Las fotos de alimentos mantienen un icono de respaldo mientras cargan.


## Progreso — paso 5

Pantalla basada en el HTML de Progreso recibido: selector de período, consistencia,
volumen movilizado, registro corporal, historial y reflexión. El gráfico usa barras
nativas proporcionales a sus valores, con etiquetas legibles y desplazamiento si
los doce meses no caben. Los filtros, totales y registros de peso responden en memoria.
La exportación PDF se identifica como pendiente; no se simula la descarga ni se
promete accesibilidad de un archivo que aún no se genera. Las fuentes, colores,
encabezado, navegación y controles táctiles siguen el sistema compartido.

## Perfil y resumen de entrenamiento — paso 6

Perfil mantiene la composición del PDF con datos de un estado local en memoria
(`features/profile`). La ficha personal y las restricciones se editan con validación
(adultos de 18 a 100 años, rangos de altura, peso, días y minutos). La foto se elige
con el selector del sistema y puede quitarse. «Exportar mis datos» genera un JSON con
perfil, diario y progreso del dispositivo; en web se descarga. «Eliminar datos de este
dispositivo» pide confirmación y vacía perfil, diario y progreso.

Sin cuenta todavía: no hay botón de cerrar sesión ni de cambiar contraseña activo.
El consentimiento de salud (Ley 19.628 y Ley 21.719) y el cuestionario de aptitud se
muestran como pendientes; los documentos legales, como «Próximamente». La versión
proviene de la configuración de Expo.

Al finalizar una sesión con series completadas, esta se añade una sola vez al
historial de Progreso (id de sesión como clave). El resumen lo indica sin prometer
guardado ni sincronización, y «Ver en el historial de Progreso» abre esa pestaña.

## Revisión de diseño — paso 7

Revisión rápida según `webdesign-review` (accesibilidad, usabilidad, UX, UI,
tipografía y color) con capturas a 360 px de todas las pantallas.

- Contraste: el verde `#4A7C59` sobre tarjetas daba 3,9–4,1:1. El texto verde usa
  ahora `brandText` `#3D6A4B` (≥ 5:1 sobre todas las superficies); botones, iconos
  y barras conservan el verde del PDF.
- Diario: macros redondeadas al gramo (SRS 8.5) y unidad unida al número.
- Acompañamientos: una columna en teléfonos para no partir palabras.
- Perfil y resumen: etiquetas en tipo oración en lugar de mayúsculas espaciadas;
  «Pendiente» dentro de su fila; documentos por publicar resumidos en una línea.

La app se inicia desde `frontend/` (o `npm start` en la raíz). `npx expo start` en
la raíz falla con `Unable to resolve "../../App"` porque allí no hay app Expo.

## Revisión con apple-design — paso 8

Principios y fundamentos de Apple aplicados a una app Android-first en React Native
(sin convenciones exclusivas de iOS). La paleta y tipografía del PDF se mantienen.

- `typography.md`: etiquetas de pestañas a 11 px como mínimo (antes 10 en anchos estrechos).
- `branding.md` («Resist the temptation to display your logo throughout your app»):
  el encabezado ya no repite el ícono ni la marca STRONGERFIT; el título usa `heading`.
- El avatar del encabezado muestra la foto del perfil local o un ícono neutro,
  en vez de la foto de ejemplo fija.
- `color.md` / `buttons.md`: la minuta semanal, aún pendiente, pasa de fondo verde a
  tarjeta secundaria; el verde de fondo queda para la acción principal.
- Aviso de vista previa unificado en `PreviewNotice`.
- Resumen de entrenamiento sin doble margen superior bajo el encabezado.

## Bienvenida y onboarding — paso 9

Siguen la lámina del PDF (bienvenida y «salud y confirmación») con dos correcciones
de contenido: el consentimiento cita la Ley 19.628 y la Ley 21.719 (no la 20.584), y
no se afirma revisión de kinesiólogos ni nutricionistas, aún pendiente (SRS 11.1).
Opciones en chips en lugar de texto libre; etiquetas en tipo oración. Detalle en
[onboarding](docs/architecture/onboarding.md).

## Metas nutricionales — paso 10

`/nutrition-goals` muestra TMB y gasto total estimados (fórmula, factor y rótulo de
estimación, RNF-07), deja elegir dirección, ajuste, proteína y grasa con opciones
acotadas y propone la meta con macros. Nada se aplica hasta «Guardar meta»
(SRS 9.3). El cálculo vive en `packages/nutrition-engine` con los vectores de
CA-14 y CA-19. Se abre desde el balance del diario y desde Perfil.

## Rutina semanal — paso 11

La pestaña Entrenar muestra «Tu plan semanal» (lámina del PDF) con la barra
inferior visible: selector de días, ejercicios con series, repeticiones y
descanso, edición por ejercicio con alternativas del mismo patrón y equipo
propio (CA-12) y regeneración con confirmación. «Iniciar entrenamiento» abre
`/session` a pantalla completa con las series del día. El generador vive en
`packages/training-engine` (RF-05/06/28, CA-02, CA-16, CA-23) con un catálogo
inicial de movimientos genéricos sin imágenes, pendiente de licencia (SRS 11.1).
En desarrollo, Inicio sigue abriendo la sesión de ejemplo con historial.

## Temporizadores y borrador de sesión — paso 12

Cada ejercicio muestra una tarjeta de temporizador: sostén para isométricos, tempo
3-1-1 con tiempo bajo tensión estimado en el perfil de fuerza e intervalos
configurables (trabajo, descanso, rondas). Todo se calcula desde marcas absolutas
(RNF-26) y pausar la sesión pausa también el temporizador. Al terminar un descanso o
temporizador llega una notificación local; el permiso se pide al iniciar el primero.
La sesión se guarda como borrador (SQLite; localStorage en web) en cada cambio y se
retoma desde Entrenar («Tienes una sesión en curso») o al reabrir la misma sesión.
Al finalizar se registra una sola vez y el borrador se elimina (CA-03).
