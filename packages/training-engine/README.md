# Motor de entrenamiento

TypeScript puro para RF-05/06/28. Genera una rutina semanal desde plantillas por
frecuencia, filtra el catálogo por equipamiento (BR-03), aplica series,
repeticiones y descansos del perfil de deportista (SRS 8.10) y valida ediciones
(CA-12). Determinista; cada plan guarda `ruleVersion`, `catalogVersion` y la entrada.

`catalog.ts` es un catálogo inicial de movimientos genéricos sin imágenes,
pendiente de reemplazo por uno con licencia verificada (SRS 11.1). Los valores
son de referencia y requieren revisión profesional.
