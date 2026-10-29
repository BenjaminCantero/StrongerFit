import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

let database: Promise<SQLiteDatabase> | undefined;

// Las tablas y migraciones de borradores se añadirán al implementar RF-07/17.
export function getDatabase(): Promise<SQLiteDatabase> {
  database ??= openDatabaseAsync('strongerfit.db').catch((error: unknown) => {
    database = undefined;
    throw error;
  });
  return database;
}
