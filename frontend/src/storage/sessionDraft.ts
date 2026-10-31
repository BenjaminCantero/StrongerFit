// Versión web: localStorage. No importa expo-sqlite, cuyo worker web requiere un .wasm
// que Metro no resuelve en la exportación. Android usa sessionDraft.native.ts.
const WEB_KEY = 'strongerfit.session-draft';

export async function readSessionDraft(): Promise<string | null> {
  return globalThis.localStorage?.getItem(WEB_KEY) ?? null;
}

export async function writeSessionDraft(payload: string): Promise<void> {
  globalThis.localStorage?.setItem(WEB_KEY, payload);
}

export async function clearSessionDraft(): Promise<void> {
  globalThis.localStorage?.removeItem(WEB_KEY);
}
