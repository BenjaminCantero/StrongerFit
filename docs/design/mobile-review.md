# Revisión de visibilidad en Android

Se conservan el diseño aprobado, Literata/Nunito Sans, la paleta crema/verde y las
cinco secciones. El objetivo es corregir controles invisibles y adaptación móvil.

## Causa y corrección

NativeWind convierte los estilos de los componentes nativos. En su implementación
instalada, un callback `Pressable.style` se procesa como objeto en lugar de conservarse
como función. En Android desaparecían el fondo, los espacios y la dirección de la
fila: texto blanco sin fondo y botones con icono y etiqueta separados.

`AppPressable` desactiva esa conversión solo para controles con StyleSheet. Conserva
la API de Pressable, callbacks, refs y accesibilidad. Su tipo excluye `className`;
los controles que usan clases siguen utilizando la conversión de NativeWind.
La corrección cubre Inicio, entrenamiento, diario, registro y encabezados.

También se ajustaron:

- Encabezados compactos para evitar palabras partidas, conservando las acciones.
- Etiquetas y altura de navegación con texto grande; nombres completos accesibles.
- Campos numéricos más anchos y disposición vertical del editor de series en teléfonos.
- Macros en columna cuando falta ancho o aumenta la escala de fuente.
- Diálogos desplazables, unidades kcal separadas y respaldo visible para fotos.
- Redondeo coherente entre energía consumida y restante en Inicio.

## Evidencia

Capturas obtenidas con `adb exec-out screencap -p` en un emulador Pixel con Android
API 36 y Expo Go. Se revisaron 1080×2400 a 420 dpi (aprox. 411 dp) y 840×2100 a
420 dpi (320 dp), con escalas de fuente 1,0 y 1,3. Se restauraron tamaño, escala y
apariencia del emulador al terminar. El engranaje flotante es una herramienta de
Expo Go, ajena a la interfaz de StrongerFit.

- [Inicio a 320 dp y texto al 130 %](mobile-home-320-large.png).
- [Diario a 320 dp y texto al 130 %](mobile-diary-320-large.png).
- [Serie completada y descanso en Android](mobile-training-android.png).

Recorrido nativo: abrir minuta y cerrar diálogo, desplazar el diario hasta Cena,
abrir el registro y confirmar, completar la serie 3 y revisar el descanso.
A 320 dp con fuente 1,3 también se comprobaron diario, diálogo y registro.

Comprobación complementaria web a 320, 390 y 1440 px: fechas, altas, edición,
cancelación, eliminación, múltiples registros, doble confirmación y estados vacíos;
sin errores de ejecución ni desbordamiento horizontal. Suite completa (40 pruebas),
tipos, lint y exportación Android/web. Las capturas nativas son evidencia del
emulador; queda pendiente repetir la revisión en el celular físico del usuario.
