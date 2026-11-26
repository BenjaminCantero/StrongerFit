import { getDatabase } from './database';

// Sesión terminada sin confirmar por el servidor. Misma tabla que el borrador, otra clave.
const KEY = 'pending';

async function table() {
  const db = await getDatabase();
  await db.execAsync('CREATE TABLE IF NOT EXISTS session_drafts (id TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL);');
  return db;
}

export async function readPendingSession(): Promise<string | null> {
  const row = await (await table()).getFirstAsync<{ payload: string }>('SELECT payload FROM session_drafts WHERE id = ?', KEY);
  return row?.payload ?? null;
}

export async function writePendingSession(payload: string): Promise<void> {
  await (await table()).runAsync('INSERT OR REPLACE INTO session_drafts (id, payload, updated_at) VALUES (?, ?, ?)', KEY, payload, new Date().toISOString());
}

export async function clearPendingSession(): Promise<void> {
  await (await table()).runAsync('DELETE FROM session_drafts WHERE id = ?', KEY);
}
