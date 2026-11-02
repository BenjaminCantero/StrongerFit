# Motor de entrenamiento

TypeScript puro para RF-05/06/28. Genera una rutina semanal desde plantillas por
frecuencia, filtra el catálogo por equipamiento (BR-03), aplica series,
repeticiones y descansos del perfil de deportista (SRS 8.10) y valida ediciones
(CA-12). Determinista; cada plan guarda `ruleVersion`, `catalogVersion` y la entrada.

`catalog.ts` es un catálogo propio de 120 ejercicios sin imágenes (RF-04, RNF-28):
músculo principal y secundarios, equipo, dificultad, medición, zonas contraindicadas
(o la marca `none-validated`) y descripción, más `searchExercises` para la pantalla de
catálogo. `catalog.test.ts` valida la integridad en CI. Las zonas contraindicadas y los
valores son provisionales y requieren revisión profesional (BR-26).
