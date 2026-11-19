import { resolve } from 'node:path';

// Lee la configuración del entorno. `.env` es opcional: si no existe se usan los valores por defecto.
try {
  process.loadEnvFile();
} catch {
  // Sin fichero .env: valores por defecto.
}

function readPositiveInt(raw: string | undefined, fallback: number): number {
  const value = Number(raw ?? fallback);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export const config = {
  port: readPositiveInt(process.env.PORT, 3000),
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  dbPath: resolve(process.env.DB_PATH ?? 'data/saasomatic.sqlite'),
  vatSyncUrl: process.env.VAT_SYNC_URL ?? 'https://api.vatcomply.com/vat_rates',
  vatSyncIntervalMs: readPositiveInt(process.env.VAT_SYNC_INTERVAL_MS, DAY_MS),
  vatSyncTimeoutMs: readPositiveInt(process.env.VAT_SYNC_TIMEOUT_MS, 10_000),
} as const;
