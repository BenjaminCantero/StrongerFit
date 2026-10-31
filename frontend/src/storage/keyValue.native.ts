import { getDatabase } from './database';

// Valores pequeños que deben sobrevivir al cierre de la app (por ejemplo, la hora de acostarse pendiente).
async function table() {
  const db = await getDatabase();
  await db.execAsync('CREATE TABLE IF NOT EXISTS key_values (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);');
  return db;
}

export async function readValue(key: string): Promise<string | null> {
  const row = await (await table()).getFirstAsync<{ value: string }>('SELECT value FROM key_values WHERE key = ?', key);
  return row?.value ?? null;
}

export async function writeValue(key: string, value: string | null): Promise<void> {
  const db = await table();
  if (value === null) await db.runAsync('DELETE FROM key_values WHERE key = ?', key);
  else await db.runAsync('INSERT OR REPLACE INTO key_values (key, value) VALUES (?, ?)', key, value);
}
