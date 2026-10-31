# Progreso: quinto corte visual

Implementación del HTML aportado por el usuario, integrada en la pestaña `/progress`.
Reutiliza encabezado, navegación, fuentes, tokens, Screen, Card, AppText, AppButton,
AppPressable y ProgressBar. No añade dependencias ni cambios en el backend.

## Responsabilidades

```text
features/progress/
├── domain/progress.ts              Períodos, agrupación, adherencia y pesos
├── domain/progress.test.ts         Pruebas de límites, cálculo y edición
├── data/progress.preview.ts        Sesiones y pesos ilustrativos de desarrollo
├── useProgress.ts                  Estado temporal de la pantalla
├── presentation.ts                Formatos es-CL y etiquetas
├── ProgressScreen.tsx              Composición del flujo
└── components/
    ├── PeriodSelector.tsx
    ├── VolumeChart.tsx
    ├── WeightCheckIn.tsx
    └── WorkoutHistory.tsx
```

La ruta decide entre datos de ejemplo (`__DEV__`) y estado vacío. El dominio es
TypeScript puro. El calendario compartido usa fechas YYYY-MM-DD y el día de
America/Santiago, sin acoplar Progreso al dominio de Alimentación.

## Comportamiento

- Últimas cuatro semanas: 28 días inclusivos, agrupados en cuatro intervalos de siete días.
- Tres meses: desde el primer día de hace dos meses hasta hoy; año: doce meses,
  incluyendo el actual, hasta hoy. Las fechas del intervalo se muestran en pantalla.
- La adherencia compara sesiones completadas y planificadas dentro del período;
  no atribuye un cero por ciento cuando no hay planificación.
- El volumen suma únicamente sesiones completadas. Las barras y el total utilizan
  los mismos registros. El porcentaje compara la última barra con la primera;
  se omite cuando el valor inicial es cero.
- El historial muestra las cuatro sesiones completadas más recientes del filtro.
- El peso acepta coma o punto y hasta dos decimales; rechaza cero, negativos,
  notación científica y formatos no finitos. Se añade o reemplaza el registro del día.
  Cancelar no modifica el peso y cambiar de período conserva las ediciones.
- Las etiquetas del gráfico también son accesibles sin depender del color. El
  gráfico se desplaza horizontalmente cuando hace falta, especialmente en el año.
- La exportación PDF muestra su estado pendiente. No crea un archivo ni anuncia
  una descarga inexistente o un PDF accesible sin haberlo verificado.

Los números del HTML eran inconsistentes entre gráfico e historial. El fixture
mantiene las cuatro sesiones recientes y deriva el volumen: 4.800, 5.200, 5.100 y
7.020 kg, total 22.120 kg y 14 de 16 sesiones en la vista de cuatro semanas.

## Alcance

Los registros son temporales; se conserva la pantalla al navegar entre pestañas,
pero no hay persistencia ni sincronización. Progreso no consume aún los resultados
de la sesión de entrenamiento de ejemplo. No hay objetivos corporales, diagnóstico,
clasificación del peso ni generación de informes en este corte.

Producción muestra estado vacío, con el registro de peso temporal identificado.
`/progress?preview=empty` permite comprobar ese estado en desarrollo.

## Diseño

La tarjeta de constancia es el elemento principal: un mapa de días (4 semanas) o de
semanas (3 meses, año) alineado al lunes, calculado por `consistencyMap`. Las sesiones
no realizadas llevan borde, no solo color. Debajo resume volumen, horas y minutos por
sesión. El peso muestra su variación en el período y, con dos o más registros, puntos
por fecha con la meta del onboarding como línea de referencia; se dibuja con vistas,
sin librería de gráficos. Se quitaron las fotografías decorativas.

## Verificación

Ocho pruebas nuevas de agrupación, adherencia, historial, filtros de fecha,
calendario, ausencia de datos y validación/reemplazo del peso. Se ejecutan también
las pruebas existentes del calendario alimentario para preservar su comportamiento.
Revisión web a 320, 390 y 1440 px y recorrido nativo en emulador Android API 36:
filtros, ingreso de peso, guardado y desplazamiento hasta historial/exportación.
Tipos/lint, suite completa y exportación Android/web. La ejecución en un celular
físico sigue pendiente.


También se verificó el selector y el gráfico anual a 320 dp con fuente al 130 %.
Las dimensiones y la escala originales del emulador se restauran tras la prueba.

Capturas: [pantalla completa](../design/step-05-progress.png),
[Android](../design/step-05-progress-android.png),
[320 dp y letra ampliada](../design/step-05-progress-320-large.png).
