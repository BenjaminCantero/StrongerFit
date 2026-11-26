// Versión web: localStorage (ver sessionDraft.ts). Android usa pendingSession.native.ts.
const WEB_KEY = 'strongerfit.pending-session';

export async function readPendingSession(): Promise<string | null> {
  return globalThis.localStorage?.getItem(WEB_KEY) ?? null;
}

export async function writePendingSession(payload: string): Promise<void> {
  globalThis.localStorage?.setItem(WEB_KEY, payload);
}

export async function clearPendingSession(): Promise<void> {
  globalThis.localStorage?.removeItem(WEB_KEY);
}
