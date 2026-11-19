import { type Db, openDatabase } from './connection';
import { migrate } from './migrate';
import { seed } from './seed';

/** Abre la BD, aplica migraciones pendientes y carga los datos iniciales que falten. */
export function bootstrapDatabase(path: string): Db {
  const db = openDatabase(path);
  migrate(db);
  seed(db);
  return db;
}
