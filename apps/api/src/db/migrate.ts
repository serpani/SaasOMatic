import type { Db } from './connection';
import { MIGRATIONS } from './schema';

/** Aplica las migraciones pendientes dentro de una transacción. Devuelve las versiones aplicadas. */
export function migrate(db: Db): number[] {
  const current = Number(db.pragma('user_version', { simple: true }));
  const pending = MIGRATIONS.filter((m) => m.version > current).sort((a, b) => a.version - b.version);

  const apply = db.transaction(() => {
    for (const migration of pending) {
      db.exec(migration.sql);
      db.pragma(`user_version = ${migration.version}`);
    }
  });
  apply();

  return pending.map((m) => m.version);
}
