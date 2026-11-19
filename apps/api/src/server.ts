import { createApp } from './app';
import { config } from './config';
import { createContainer } from './container';
import { bootstrapDatabase } from './db/bootstrap';
import { createTaxRateSyncService } from './services/taxRateSync.service';

function start(): void {
  const db = bootstrapDatabase(config.dbPath);
  const container = createContainer(db);
  container.catalogService.assertPricingTiersAreValid();

  createTaxRateSyncService(container.taxRatesRepository, {
    url: config.vatSyncUrl,
    timeoutMs: config.vatSyncTimeoutMs,
  }).schedule(config.vatSyncIntervalMs);

  createApp(container, { webOrigin: config.webOrigin }).listen(config.port, () => {
    console.info(`API de SaaS-O-Matic escuchando en http://localhost:${config.port}`);
  });
}

try {
  start();
} catch (error) {
  console.error('No se pudo arrancar la API.', error instanceof Error ? error.message : error);
  process.exit(1);
}
