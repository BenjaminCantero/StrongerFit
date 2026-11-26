// Versión web: localStorage. Android usa pendingOnboarding.native.ts (SQLite).
// Solo guarda texto; la validación y la caducidad viven en features/account/pendingOnboarding.ts.
// La clave NO empieza por "strongerfit." a propósito: clearValues() borra ese prefijo al entrar otra
// cuenta y el pendiente debe sobrevivir justo a ese momento.
const WEB_KEY = 'strongerfit-pending-onboarding';

export async function readPendingOnboardingRaw(): Promise<string | null> {
  return globalThis.localStorage?.getItem(WEB_KEY) ?? null;
}

export async function writePendingOnboardingRaw(payload: string): Promise<void> {
  globalThis.localStorage?.setItem(WEB_KEY, payload);
}

export async function clearPendingOnboarding(): Promise<void> {
  globalThis.localStorage?.removeItem(WEB_KEY);
}
