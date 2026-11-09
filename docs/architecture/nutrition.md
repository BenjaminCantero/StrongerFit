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
├── data/foods.preview.ts       Adaptador del catálogo importado
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
- El acceso a minuta semanal abre el generador descrito más abajo.

Los totales se calculan desde los alimentos seleccionados y sus cantidades; no se
copian los totales del HTML de referencia.
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
El diario no tiene persistencia ni sincronización. El motor de minutas aplica las
restricciones curadas descritas abajo. Las imágenes del formulario provienen del
HTML recibido y se empaquetan localmente.

Producción presenta el diario vacío y sin metas, pero el registro manual dispone
del catálogo local importado, incluidos los alimentos propios no verificados.
En desarrollo, `preview=empty` permite revisar el estado sin catálogo. Los parámetros inválidos del formulario muestran un
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

`packages/nutrition-engine/src/foods.ts` expone el catálogo generado
`foods.generated.ts`, versión `usda-sr-2018-04-cl-1`: 251 alimentos, 237 importados de
USDA FoodData Central SR Legacy 2018-04 y 14 propios no verificados. También alimenta
el buscador. No hace llamadas USDA en tiempo real. Cada alimento conserva fuente,
conjunto, versión, licencia, fecha de importación (2026-11-09) y, para USDA, `fdcId`.
`verified` significa importado de la fuente identificada; no certifica alérgenos ni
valida un producto comercial. `FoodSummary` presenta la fuente junto a los nutrientes.

La curaduría versionada vive en `packages/nutrition-engine/data/food-mapping.json`:
ID interno, fdcId, descripción original cotejada, nombre chileno con preparación,
rol, comidas, etiquetas, porciones y acompañamientos. Los nutrientes no están en
el mapeo: proceden exclusivamente del CSV oficial. Los 53 IDs anteriores se conservan;
los snapshots ya registrados en el diario no se recalculan al cambiar el catálogo.
Los datos propios mantienen exactamente sus nutrientes y porciones anteriores en
`unverified-foods.json`. El generador y los intercambios exigen `verified === true`;
el registro manual permite buscar y elegir los no verificados.

### Regeneración controlada (RF-18, RNF-16, BR-07)

Requiere Python 3 (biblioteca estándar, sin dependencias), curl y unzip. Desde la raíz:

```sh
curl --fail --location --output /tmp/FoodData_Central_sr_legacy_food_csv_2018-04.zip \
  https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip
unzip /tmp/FoodData_Central_sr_legacy_food_csv_2018-04.zip -d /tmp/strongerfit-usda
python3 scripts/import-foods.py /tmp/strongerfit-usda/FoodData_Central_sr_legacy_food_csv_2018-04
python3 scripts/import-foods.py /tmp/strongerfit-usda/FoodData_Central_sr_legacy_food_csv_2018-04 --check
npm run check
```

Descargas: [USDA FoodData Central](https://fdc.nal.usda.gov/download-datasets/).
`usda-release.json` fija URL, SHA-256 del ZIP y de las tres tablas utilizadas, fecha
explícita e IDs/unidades confirmados en `nutrient.csv`: energía 1008/KCAL,
proteína 1003/G, carbohidratos por diferencia 1005/G y grasa 1004/G. 1062 es energía
en kJ y no se importa. No se calculan nutrientes faltantes. Un valor ausente, negativo
o no finito excluye el alimento y se registra en `import-report.json`; cero sí es
válido. Un ID desconocido, descripción cambiada, duplicado o hash distinto aborta.
Los archivos se generan en orden estable y UTF-8; ni el reloj ni el orden de los CSV
alteran el resultado. Se versionan catálogo, mapeo, manifiesto e informe, nunca el ZIP
ni las tablas crudas (ignoradas por Git).

Para actualizar datos hay que revisar la nueva descarga oficial, sus unidades y
variantes, actualizar el manifiesto explícitamente y subir `FOOD_CATALOG_VERSION`.
Revisar el diff nutricional y ejecutar las pruebas antes de publicar. La reversión
consiste en revertir los commits de esta migración; no modifica registros del diario.
La suite incluye pruebas del importador con CSV sintéticos (no son datos del catálogo),
procedencia, rangos, energía 4/4/9 con tolerancia de mayor entre 20 kcal y 20% por
fibra/factores Atwater, IDs y exclusión de no verificados de generación/intercambio.

Se inspeccionó además Foundation Foods **2026-10-29** en su
[JSON oficial](https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_json_2026-10-29.zip):
no agregó equivalentes fieles a los originales pendientes. No se importó ningún
alimento Foundation; el script de esta versión acepta únicamente SR Legacy.
El ZIP CSV Foundation de esa fecha carecía de `food.csv` y `food_nutrient.csv`, por
lo que la búsqueda de equivalentes se hizo en el JSON, sin sustituir la fuente.

### Alimentos propios y decisiones para revisión

Los 14 no verificados son: marraqueta (`bread`), avena con leche sin lactosa (`oats`),
posta negra cocida (`beef`), merluza al vapor (`hake`), camarones salteados (`shrimp`),
tofu firme salteado (`tofu`), quesillo (`fresh-cheese`), leche semidescremada sin lactosa
(`lactose-free-milk`), yogur natural sin lactosa (`lactose-free-yogurt`), hojuelas de
quinoa (`quinoa-flakes`), ensalada de lechuga y tomate (`salad`), brócoli al vapor
(`broccoli`), zapallo italiano salteado (`zucchini`) y espinaca salteada (`spinach`).
No se equipararon mezclas, cortes chilenos, especies ni preparaciones distintas:
por ejemplo, USDA hervido no verifica un salteado ni un alimento al vapor. Hay
alternativas USDA con nombres y nuevos IDs que describen la preparación real.

Revisar estas decisiones de curaduría antes de ampliar equivalencias:

- Palta `avocado` usa 171705 (variedades comerciales), sin afirmar Hass; leche `milk`
  usa 172205 (2% de grasa), explicitado en el nombre; `soy-yogurt` usa 167722 (yogur
  de tofu), sin afirmar que sea sin azúcar. Son equivalencias genéricas, no marcas.
- Los panes comerciales llevan preventivamente gluten, leche/lactosa, huevo, soya
  y animal; las pastas de trigo incluyen huevo/animal por precaución. Esto limita
  opciones, pero evita afirmar una receta libre de esos ingredientes.
- Coco y aceite de coco llevan `frutos-secos` de forma conservadora; aceite de soya
  mantiene `soya`. La avena mantiene `gluten`, sin presumir certificación.
- `lacteo` incluye derivados sin lactosa; `lactosa` se conserva preventivamente en
  los quesos. No se infiere ausencia de alérgenos a partir de nutrientes en cero.
- Los nombres mejillón azul, sardina atlántica, salmón atlántico/coho y corte vacuno
  “eye of round” identifican la variante USDA; no se presentan como chorito chileno,
  posta negra u otra especie/corte local. Los `usdaDescription` permiten auditarlo.
- El tipo de etiquetas preexistente no incluye sésamo ni lupino; esta importación no
  amplía ese contrato. No se debe interpretar el catálogo como certificación de
  ausencia de todos los posibles alérgenos o trazas de fabricación.

Distribución: proteína 46, lácteos/alternativas 41, carbohidratos 44, verduras 45,
frutas 36 y grasas 39. Descartes por nutrientes incompletos entre los 237 candidatos:
**ninguno**. Se mantiene la exigencia de al menos dos intercambios por casillero con
las exclusiones comunes, y se añade cobertura vegana y vegana sin gluten/lácteos.

`generateMealPlan` arma 7 días combinando alimentos y porciones (sin recetas). Es
determinista: mismo perfil y mismo catálogo producen la misma minuta. Cada minuta guarda
`ruleVersion` (`minuta-0.2`) y `catalogVersion` (RF-19). Las reglas viven en
`packages/nutrition-engine/src/meal-plan.ts`; la meta por tipo de día, en `index.ts`.
Todos los valores siguientes son **provisionales**, como el resto del motor, y requieren
revisión profesional antes del lanzamiento público.

### Comidas al día

La persona elige de 3 a 6 comidas (por defecto 4). Cada reparto suma 1 en energía y en
proteína (`mealLayouts`):

| Comidas | Desayuno | Colación mañana | Almuerzo | Once | Cena | Colación noche |
|---|---|---|---|---|---|---|
| 3 | 30 % / 25 % | — | 40 % / 40 % | — | 30 % / 35 % | — |
| 4 | 25 % / 20 % | — | 35 % / 35 % | 12 % / 10 % | 28 % / 35 % | — |
| 5 | 22 % / 20 % | 10 % / 5 % | 30 % / 33 % | 12 % / 10 % | 26 % / 32 % | — |
| 6 | 20 % / 18 % | 10 % / 5 % | 27 % / 30 % | 12 % / 10 % | 23 % / 27 % | 8 % / 10 % |

Energía / proteína. Con 4 comidas la energía es la de `minuta-0.1`. La proteína se reparte
más pareja entre comidas principales y menos en colaciones. La colación de media mañana es
fruta y grasa (frutos secos o semillas); la nocturna, un lácteo o alternativa. Ambas usan
los alimentos que el catálogo marca para la once, y al registrarlas en el diario (que tiene
cuatro comidas) quedan en «Once / Merienda».

### Porciones: proteína y energía

Cada comida recibe su parte de la meta de energía y de proteína. Dentro de la comida:

1. Las verduras quedan en su porción habitual.
2. Los proteicos y lácteos se fijan para acercarse a la proteína de la comida, sin dejar a
   carbohidratos, frutas y grasas bajo su porción mínima (la energía tiene prioridad).
3. Carbohidratos, frutas y grasas completan la energía.
4. Si aun así falta energía porque esos alimentos llegaron a su máximo, los proteicos pueden
   crecer hasta +10 % sobre la proteína de la comida, nunca más.

Ninguna porción sale de 0,5× a 2,5× la porción habitual, redondeada a 5 g. Las comidas con
poco margen (desayuno y colaciones) se calculan primero; almuerzo y cena reciben su parte
de lo que queda y absorben lo que las anteriores no alcanzaron.

Prioridad cuando no se puede todo: exclusiones, luego límites de porción, luego energía,
luego proteína. Cada día informa `deviation` (energía) y `proteinDeviation` frente a su
meta, con tolerancia ±10 % para ambas (BR-09). Si la proteína queda bajo la tolerancia, la
minuta se genera igual y la pantalla dice cuántos gramos faltan.

### Selección de alimentos

Para cada casillero se ordenan los candidatos compatibles por, en este orden:

1. Que le guste: los marcados «no me gusta» solo si no queda otra opción.
2. No repetirlo en el mismo día.
3. Que la comida llegue a su meta con él (proteína para proteicos y lácteos; energía para el resto).
4. No superar el tope de **4 apariciones por semana** (`MAX_WEEKLY_REPEATS`).
5. No repetirlo del día anterior.
6. Que sea preferido y no haya llegado al tope.
7. Rotación por día (la cena parte desde la mitad de la lista).

Con un único favorito, este aparece en días alternos: como máximo 4 veces. El tope gana a
la preferencia y a la rotación; solo cede si ningún otro alimento compatible permite que la
comida llegue a su meta (la proteína está por encima de la variedad).

### Preferencias

Alimentos preferidos y no deseados se eligen del catálogo (solo verificados, hasta 20 por
lista) en el onboarding y en Perfil → Nutrición y restricciones; no hay texto libre. Un
alimento no puede estar en ambas listas. Si todos los alimentos de un rol no le gustan, se
prueba el rol de respaldo (lácteo → proteína → grasa) antes de usarlos. La minuta avisa qué
alimento no deseado usó, dónde y por qué.

Las exclusiones (alergias, intolerancias, vegetariana, vegana) son duras: un alimento
excluido nunca entra en la minuta, ni como preferido, ni como respaldo, ni en un
intercambio. Si un preferido está excluido, gana la exclusión y la minuta lo avisa; el
buscador lo marca como bloqueado y no permite marcarlo.

### Meta por tipo de día (RF-21)

Opción explícita en Perfil, desactivada por defecto y ofrecida solo si hay un plan de
entrenamiento guardado (que indica los días) y una meta calculada (piso y gasto total).
`TRAINING_REST_GAP` = **10 %** de la meta: es la diferencia entre un día de entrenamiento y
uno de descanso, repartida para que el promedio semanal sea exactamente la meta. Con `t`
días de entrenamiento, entrenar suma `10 % × (7 − t) / 7` y descansar resta `10 % × t / 7`
(con 4 días: +4,3 % y −5,7 %). El redondeo al entero se compensa en los días de descanso.
Proteína y grasa no cambian; la diferencia va en carbohidratos (4 kcal/g). No es una
estimación del gasto de la sesión: el SRS prohíbe usar gasto de ejercicio estimado.

Cada día por separado respeta el piso de energía (BR-16), el déficit máximo de 20 % del
gasto total (BR-17), el superávit máximo de 15 % y, con riesgo declarado, la ausencia de
déficit (BR-19). Si la diferencia los rompería, se reduce (truncada a milésimas) hasta que
no ocurra, y la minuta lo informa. Una meta en el piso queda sin diferencia.

### Minutas guardadas e intercambios

`readMealPlan` abre minutas `minuta-0.1`: completa meta por día, proteína por comida,
desviación de proteína y preferencias vacías sin recalcular alimentos ni porciones, y
conserva su versión. Hay una minuta `minuta-0.1` real como fixture de prueba.

«Cambiar» ofrece alimentos del mismo rol y comida, compatibles con las exclusiones. Los
proteicos conservan la proteína del original; el resto, la energía. Los no deseados se
ofrecen solo si no hay alternativa y van marcados; hasta dos preferidos van primero.

Capturas a 390 px: [minuta con tipos de día](../design/step-06-meal-plan.png),
[proteína que no alcanza](../design/step-06-meal-plan-protein-short.png),
[editor de preferencias](../design/step-06-meal-preferences.png).

### Dónde la proteína no alcanza

Medido sobre el catálogo actual (hombre 80 kg y mujer 62 kg; 1,6, 1,8 y 2,0 g/kg; déficit
15 y 20 %, mantención y superávit 10 %; 3 a 6 comidas; 384 combinaciones). La energía queda
siempre en ±10 %. La proteína queda en tolerancia en todos los perfiles sin restricciones y
vegetarianos, salvo mujer vegetariana con 2,0 g/kg, déficit 20 % y 5–6 comidas (3 de 7 días,
hasta −17 %). Las faltas se concentran en dietas veganas: sin soya, faltan entre 11 % y 48 %
según meta y comidas (p. ej. mujer 1,6 g/kg en déficit 15 % con 4 comidas: −22 %); con soya,
solo con déficit alto y 5–6 comidas (hasta −28 % con 2,0 g/kg). Las colaciones de fruta y
grasa diluyen la proteína; con 3–4 comidas el resultado es mejor.

Las exclusiones del perfil se reconocen como alérgenos (gluten, lactosa, lácteos,
frutos secos, maní, huevo, pescado, mariscos, soya) o como nombres de alimentos; lo
no reconocido se muestra como aviso. «Lácteos» o «leche» bloquea también lo sin
lactosa. Vegetariana y vegana se leen del enfoque alimentario. Un alimento excluido
nunca entra en la minuta (BR-08, CA-05); si una restricción deja una comida sin
opciones, se informa qué la bloquea en lugar de ignorarla (CU-05).

La minuta se genera como propuesta y se guarda solo al aceptar. En la minuta guardada
elegir una opción de «Cambiar» confirma el cambio. Cada
comida guardada puede registrarse en el diario de hoy. Hay pruebas que exigen al
menos dos alternativas por casillero con las exclusiones comunes.

## Registro por foto (interfaz)

`/food-photo` permite tomar o elegir una foto, analizarla y revisar el resultado
antes de registrarlo en el diario. Estados: inicio, foto lista, analizando, error y
revisión. En revisión se ajustan los gramos (±10 g, entre 5 y 2000 g), se quitan
alimentos y se elige la comida; los de confianza < 60 % se marcan para revisar.

- `domain/photo-analysis.ts`: reductor puro, totales y conversión a `FoodEntry`.
  Cada análisis lleva un `requestId`; las respuestas tardías de un análisis
  cancelado o de una foto anterior se descartan.
- `photo-analyzer.ts`: contrato `FoodPhotoAnalyzer`. Hoy solo existe la
  simulación de desarrollo (siempre el mismo plato); producción muestra el estado
  no disponible.
- `photo-picker.ts`: cámara (pide permiso) o galería vía `expo-image-picker`.

Pendiente para que funcione de verdad: un endpoint del backend que reciba la imagen,
la envíe a un modelo de visión con salida estructurada (nombre, gramos estimados,
confianza), asocie cada alimento al catálogo para obtener los valores por 100 g y
devuelva `PhotoAnalysis`. La clave del proveedor vive solo en el backend.

## Código de barras (Open Food Facts)

`/barcode` lee EAN-13, EAN-8, UPC-A y UPC-E con `expo-camera` (incluido en Expo Go) y
admite escribir el número a mano. `openfoodfacts.ts` consulta
`world.openfoodfacts.org/api/v2/product/{código}` con los campos mínimos y 10 s de
espera; en Android/iOS envía el User-Agent que pide Open Food Facts. La pantalla
consulta con TanStack Query (clave `open-food-facts/product/{código}`, 24 h en caché,
un reintento). La app llama directo a la API pública de lectura, sin claves; si se
necesita caché compartida u offline (RF-07/17), se moverá al backend.

`domain/barcode.ts` valida el dígito verificador, interpreta la respuesta (kcal desde
kJ si falta) y exige nombre y los cuatro valores por 100 g dentro de rangos
plausibles; si faltan, ofrece el registro manual en lugar de registrar ceros. La
cantidad inicial es la porción declarada o 100 g. Los datos son ODbL y la pantalla
muestra la atribución; no se guarda copia de la base.

Verificado en navegador (Chromium sin interfaz) contra la API real: búsqueda manual
de 3017620422003, cálculo por cantidad y registro en el diario. Falta probar la
lectura con la cámara de un teléfono y la cobertura de productos chilenos.

## Edición de registros externos

Los registros de código de barras (`off:…`) y foto (`photo:…`) no están en el
catálogo, así que «Editar» abre `EntryAdjustScreen`: gramos por ítem (±10 g, 1–2000 g)
y comida; los nutrientes se reescalan desde lo guardado (`domain/entry-adjust.ts`).
