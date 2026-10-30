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

La estructura de implementación está descrita en
[arquitectura de frontend](docs/architecture/frontend.md).
