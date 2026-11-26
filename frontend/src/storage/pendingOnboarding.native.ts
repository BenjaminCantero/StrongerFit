import { getDatabase } from './database';

// Perfil del onboarding hecho antes de crear la cuenta. Misma tabla que el borrador, otra clave
// (ni clearSessionDraft ni clearPendingSession lo tocan).
const KEY = 'pending-onboarding';

async function table() {
  const db = await getDatabase();
  await db.execAsync('CREATE TABLE IF NOT EXISTS session_drafts (id TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL);');
  return db;
}

export async function readPendingOnboardingRaw(): Promise<string | null> {
  const row = await (await table()).getFirstAsync<{ payload: string }>('SELECT payload FROM session_drafts WHERE id = ?', KEY);
  return row?.payload ?? null;
}

export async function writePendingOnboardingRaw(payload: string): Promise<void> {
  await (await table()).runAsync('INSERT OR REPLACE INTO session_drafts (id, payload, updated_at) VALUES (?, ?, ?)', KEY, payload, new Date().toISOString());
}

export async function clearPendingOnboarding(): Promise<void> {
  await (await table()).runAsync('DELETE FROM session_drafts WHERE id = ?', KEY);
}
