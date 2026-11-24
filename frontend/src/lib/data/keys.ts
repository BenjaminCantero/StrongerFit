// Versión del formato de la caché persistida. Subirla cuando cambie la forma de los datos
// guardados (por ejemplo, tras una migración que cambia lo que devuelve un repositorio).
export const CACHE_SCHEMA_VERSION = 1;

// Toda clave de datos lleva el usuario: dos cuentas en el mismo teléfono nunca comparten caché.
export const userKey = (userId: string, ...parts: string[]) => ['u', userId, ...parts] as const;

export const cacheBuster = (userId: string) => `${userId}:${CACHE_SCHEMA_VERSION}`;
