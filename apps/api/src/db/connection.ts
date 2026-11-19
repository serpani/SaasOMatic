import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';

export type Db = Database.Database;

/** Minúsculas y sin tildes: permite buscar "facil" y encontrar "Fácil S.L.". */
export function searchNormalize(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/** Abre (o crea) la base de datos SQLite. Usa ':memory:' para tests. */
export function openDatabase(path: string): Db {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma('foreign_keys = ON');
  if (path !== ':memory:') db.pragma('journal_mode = WAL');
  db.function('search_normalize', { deterministic: true }, (value: unknown) =>
    typeof value === 'string' ? searchNormalize(value) : value,
  );
  return db;
}
