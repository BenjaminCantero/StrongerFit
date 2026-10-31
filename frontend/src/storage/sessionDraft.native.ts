import { getDatabase } from './database';

// Un solo borrador: la sesión en curso, guardado en SQLite.
const KEY = 'current';

async function table() {
  const db = await getDatabase();
  await db.execAsync('CREATE TABLE IF NOT EXISTS session_drafts (id TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL);');
  return db;
}

export async function readSessionDraft(): Promise<string | null> {
  const row = await (await table()).getFirstAsync<{ payload: string }>('SELECT payload FROM session_drafts WHERE id = ?', KEY);
  return row?.payload ?? null;
}

export async function writeSessionDraft(payload: string): Promise<void> {
  await (await table()).runAsync('INSERT OR REPLACE INTO session_drafts (id, payload, updated_at) VALUES (?, ?, ?)', KEY, payload, new Date().toISOString());
}

export async function clearSessionDraft(): Promise<void> {
  await (await table()).runAsync('DELETE FROM session_drafts WHERE id = ?', KEY);
}
