import { rmSync } from 'node:fs';
import { config } from '../config';
import { createTaxRatesRepository } from '../repositories/taxRates.repository';
import { createTaxRateSyncService } from '../services/taxRateSync.service';
import { bootstrapDatabase } from './bootstrap';

/** `npm run db:setup` crea la BD con sus datos iniciales; `npm run db:reset` la borra antes. */
async function main(): Promise<void> {
  if (process.argv.includes('--reset')) {
    for (const suffix of ['', '-wal', '-shm']) rmSync(`${config.dbPath}${suffix}`, { force: true });
    console.info('Base de datos borrada.');
  }

  const db = bootstrapDatabase(config.dbPath);
  console.info(`Base de datos lista en ${config.dbPath}`);

  const sync = createTaxRateSyncService(createTaxRatesRepository(db), {
    url: config.vatSyncUrl,
    timeoutMs: config.vatSyncTimeoutMs,
  });
  await sync.sync();
  db.close();
}

main().catch((error: unknown) => {
  console.error('No se pudo preparar la base de datos.', error);
  process.exit(1);
});
