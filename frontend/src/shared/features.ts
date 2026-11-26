// Funciones pospuestas a la versión 1.1 según el SRS 1.3: el código se conserva, pero no se
// muestra en la v0. Sueño (RF-26, RF-27), escáner de códigos (RF-23, V1-05) y foto de comida
// (fuera del MVP: requiere IA).
export const features = { sleep: false, barcode: false, foodPhoto: false } as const;
