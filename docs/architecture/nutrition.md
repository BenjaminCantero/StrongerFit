# Alimentación: diario y registro

Cuarto corte visual basado en el HTML del diario aportado por el usuario. La
pestaña Alimentación es el diario; el diseño anterior corresponde al formulario
independiente de registro. Ambos reutilizan el tema y los componentes compartidos.

## Responsabilidades

```text
features/nutrition/
├── domain/diary.ts             Fechas, snapshots, altas, edición, eliminación y balance
├── domain/food-entry.ts        Borrador, búsqueda, cantidades y nutrientes
├── domain/*.test.ts            Pruebas de dominio y estado compartido
├── data/foods.preview.ts       Catálogo ilustrativo
├── data/diary.preview.ts       Registros y metas ilustrativos de desarrollo
├── data/food-images.ts         Imágenes por ID, separadas del modelo
├── state/diary-store.ts        Adaptador Zustand, sin persistencia
├── useNutritionDiary.ts        Memoria compartida entre rutas
├── useFoodEntry.ts             Borrador independiente y confirmación única
├── presentation.ts             Etiquetas y formatos es-CL
├── NutritionScreen.tsx         Diario: fecha, balance, cuatro comidas y diálogos
├── FoodRegistrationScreen.tsx  Formulario de alta y edición
└── components/                 Secciones del diario y controles del formulario
```

`/nutrition` conecta el diario con Expo Router. `/food-entry` recibe la fecha y
comida al añadir, o el ID al editar. Al confirmar, despacha al estado compartido y
regresa al diario; cancelar o volver no modifica registros. Inicio lee el balance
de hoy del mismo estado, aunque el diario esté consultando otra fecha.

El dominio es TypeScript puro. No importa React, imágenes, Zustand ni servicios.
El adaptador comparte el estado entre pantallas sin introducir acceso de red.
Los componentes de presentación reciben datos y callbacks.

## Diario

- Fecha anterior, siguiente y retorno a hoy. El día actual usa America/Santiago;
  los desplazamientos se hacen como fechas de calendario, sin sumar horas locales.
- Balance diario, energía restante y macros calculados desde los registros de la
  fecha seleccionada. Se conserva precisión interna y se redondea al presentar.
- Desayuno, almuerzo, once/merienda y cena, con estados vacíos.
- Añadir alimentos a una comida; editar un registro existente sin duplicarlo.
  Si una comida contiene varios registros, se elige cuál editar.
- Eliminar todos los registros de una comida y fecha, con confirmación previa.
- El acceso a minuta semanal presenta un estado vacío; el generador queda pendiente.

Los totales del HTML no coincidían con sus alimentos. La implementación suma los
valores del catálogo ilustrativo, en lugar de copiar esos totales inconsistentes.
Las metas de desarrollo también se identifican como ejemplo.

## Formulario

- Búsqueda sin distinguir mayúsculas o acentos, con estado sin resultados.
- Selección de comida; al abrir desde el diario se muestra la comida correspondiente.
- Cantidad en gramos o porciones, ajustes de ±10/25 g y restablecimiento.
- Teclado numérico con decimal, retroceso y borrado; admite teclado físico.
- Los gramos exactos se conservan al alternar unidades.
- Nutrientes proporcionales a la base por 100 g; acompañamientos seleccionables.
- Confirmación fija, bloqueo de cantidades inválidas y protección contra doble toque.
- Edición precargada con la cantidad, comida y acompañamientos del registro.

Las barras de macros del formulario comparan su aporte energético con 4/4/9.
Las del diario comparan lo consumido con las metas ilustrativas.

## Alcance y estados vacíos

Los datos existen solo en memoria y se reinician al recargar o cerrar la app.
No hay persistencia, sincronización, validación de alergias ni generación de minutas.
El catálogo no se atribuye a INTA/MINSAL ni se declara verificado. Las imágenes del
formulario provienen del HTML recibido y se empaquetan localmente.

Producción presenta el diario vacío y sin metas; registrar muestra el catálogo no
disponible hasta conectar datos reales. En desarrollo, `/nutrition?preview=empty`
permite revisar ese recorrido. Los parámetros inválidos del formulario muestran un
estado no disponible. La barra de pestañas permanece en el diario y se oculta en el
formulario, cuyo encabezado regresa a Alimentación.

## Verificación

Pruebas de cantidades, nutrientes, búsquedas, snapshots, altas, edición, eliminación
por comida/fecha, estado compartido y fechas. Revisión del recorrido en navegador:
añadir, editar, cancelar, eliminar, múltiples registros, cambio de fecha, doble
confirmación, rutas inválidas y estados vacíos. Diseño revisado a 320, 390 y 1440 px.
Tipos/lint, suite completa y exportación Android/web. La ejecución en un dispositivo
Android físico queda pendiente.

Capturas: [diario — paso 4](../design/step-04-nutrition-diary.png),
[registro — paso 3](../design/step-03-food.png).

## Minuta semanal (RF-12, RF-13)

`packages/nutrition-engine` incluye un catálogo de referencia (`foods.ts`, versión
`alimentos-referencia-0.1`) con rol, comidas posibles y etiquetas de restricción por
alimento. Sus valores por 100 g son aproximados y deben reemplazarse por una fuente
importada con procedencia (RF-18); también alimenta el buscador de desarrollo.

`generateMealPlan` arma 7 días con desayuno, almuerzo, once y cena combinando
alimentos y porciones (sin recetas). Reparte la meta diaria por comida, deja las
verduras en su porción habitual, escala el resto y redondea a 5 g. Es determinista y
guarda versión de reglas y catálogo (RF-19). Cada día informa su desviación frente a
la meta con tolerancia ±10 % (BR-09).

Las exclusiones del perfil se reconocen como alérgenos (gluten, lactosa, lácteos,
frutos secos, maní, huevo, pescado, mariscos, soya) o como nombres de alimentos; lo
no reconocido se muestra como aviso. «Lácteos» o «leche» bloquea también lo sin
lactosa. Vegetariana y vegana se leen del enfoque alimentario. Un alimento excluido
nunca entra en la minuta (BR-08, CA-05); si una restricción deja una comida sin
opciones, se informa qué la bloquea en lugar de ignorarla (CU-05).

La minuta se genera como propuesta y se guarda solo al aceptar. «Cambiar» ofrece
alimentos del mismo rol, compatibles, con porción de energía similar y diferencias de
kcal y proteína; en la minuta guardada elegir una opción confirma el cambio. Cada
comida guardada puede registrarse en el diario de hoy. Hay pruebas que exigen al
menos dos alternativas por casillero con las exclusiones comunes.
