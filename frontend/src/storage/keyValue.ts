// Versión web con localStorage; Android usa keyValue.native.ts (SQLite).
const prefix = 'strongerfit.';

export async function readValue(key: string): Promise<string | null> {
  return globalThis.localStorage?.getItem(prefix + key) ?? null;
}

export async function writeValue(key: string, value: string | null): Promise<void> {
  if (value === null) globalThis.localStorage?.removeItem(prefix + key);
  else globalThis.localStorage?.setItem(prefix + key, value);
}
